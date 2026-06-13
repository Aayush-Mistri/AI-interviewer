import express from "express";
import cors from "cors";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";
import dotenv from "dotenv";
import multer from "multer";
import ExcelJS from "exceljs";
import { randomUUID } from "crypto";
import { PDFParse } from "pdf-parse";
import { evaluateTranscript } from "./controllers/evaluateTra.js";
import { resumeScraper } from "./controllers/resumeLogic.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const port = Number(process.env.PORT || 3001);
const deepgramApiKey = process.env.DEEPGRAM_API_KEY?.trim();

const DEEPGRAM_URL = "wss://agent.deepgram.com/v1/agent/converse";
const INTERVIEW_DURATION_MS = 5 * 60 * 1000;
const MAX_RESUME_TEXT_CHARS = 6000;
const EVALUATION_FILE = path.join(__dirname, "candidate-evaluations.xlsx");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});
const resumeSessions = new Map();
const completedEvaluations = new Map();

setInterval(() => {
  const expiresBefore = Date.now() - 30 * 60 * 1000;

  for (const [sessionId, session] of resumeSessions.entries()) {
    if (session.createdAt < expiresBefore) {
      resumeSessions.delete(sessionId);
    }
  }
}, 10 * 60 * 1000);

app.use(express.json());
app.use(cors());


app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_ORIGIN || "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    deepgramConfigured: Boolean(deepgramApiKey),
  });
});

app.post("/api/evaluate-local", evaluateTranscript);

app.post("/resume", upload.single("resume"), resumeScraper);

app.get("/evaluation/:sessionId", (req, res) => {
  const evaluation = completedEvaluations.get(req.params.sessionId);

  if (!evaluation) {
    res.status(404).json({ error: "Evaluation is not ready yet." });
    return;
  }

  res.json(evaluation);
});

app.use(express.static(path.join(__dirname, "public")));

wss.on("connection", (clientWs, req) => {
  console.log("Browser connected");

  if (!deepgramApiKey) {
    clientWs.send(JSON.stringify({
      type: "Error",
      message: "Missing DEEPGRAM_API_KEY in back/.env",
    }));
    clientWs.close(1011, "Server is missing DEEPGRAM_API_KEY");
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const sessionId = url.searchParams.get("sessionId");
  const resumeSession = resumeSessions.get(sessionId);

  if (!resumeSession) {
    clientWs.send(JSON.stringify({
      type: "Error",
      message: "Please upload a resume before starting the interview.",
    }));
    clientWs.close(1008, "Missing resume session");
    return;
  }

  const startedAt = Date.now();
  const interviewEvents = [];
  const transcriptLines = [];
  let evaluationSaved = false;
  let interviewEndedByTimer = false;

  const dgWs = new WebSocket(DEEPGRAM_URL, {
    headers: {
      Authorization: `Token ${deepgramApiKey}`,
    },
  });

  dgWs.on("open", () => {
    console.log("Connected to Deepgram");

    dgWs.send(JSON.stringify({
      type: "Settings",
      audio: {
        input: {
          encoding: "linear16",
          sample_rate: 16000
        },
        output: {
          encoding: "linear16",
          sample_rate: 24000,
          container: "none"
        }
      },
      agent: {
        greeting: `Hello ${resumeSession.candidateName}, I reviewed your resume. This interview will have 5 questions based on your background and should take about 5 minutes. Let's begin.`,
        listen: {
          provider: {
            type: "deepgram",
            model: "nova-3",
            language: "en",
            smart_format: true
          }
        },
        think: {
          provider: {
            type: "open_ai",
            model: "gpt-4o-mini"
          },
          prompt: buildInterviewPrompt(resumeSession)
        },
        speak: {
          provider: {
            type: "deepgram",
            model: "aura-2-thalia-en"
          }
        }
      }
    }));
  });

  const interviewTimer = setTimeout(async () => {
    interviewEndedByTimer = true;
    await finalizeInterview("The 5-minute interview limit has been reached.", true);
  }, INTERVIEW_DURATION_MS);

  clientWs.on("message", (data, isBinary) => {
    if (!isBinary) {
      const message = parseClientMessage(data);

      if (message?.type === "EndInterview") {
        finalizeInterview("Interview ended by user.", true);
      }

      return;
    }

    if (dgWs.readyState === WebSocket.OPEN && isBinary) {
      dgWs.send(data);
    }
  });

  dgWs.on("message", (data, isBinary) => {
    if (clientWs.readyState !== WebSocket.OPEN) return;

    if (isBinary) {
      clientWs.send(data, { binary: true });
    } else {
      const eventText = data.toString();
      interviewEvents.push(eventText);
      collectTranscriptLine(eventText, transcriptLines);
      clientWs.send(eventText);
    }
  });

  clientWs.on("close", async () => {
    console.log("Browser disconnected");
    clearTimeout(interviewTimer);
    dgWs.close();
    await saveEvaluationOnce();
  });

  dgWs.on("close", async () => {
    console.log("Deepgram disconnected");
    clearTimeout(interviewTimer);
    await saveEvaluationOnce();
    clientWs.close();
  });

  dgWs.on("error", (error) => {
    console.error("Deepgram error:", error.message);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({
        type: "Error",
        message: "Deepgram connection failed. Check your API key and agent provider access.",
      }));
    }
  });

  clientWs.on("error", (error) => {
    console.error("Browser websocket error:", error.message);
  });

  async function saveEvaluationOnce() {
    if (evaluationSaved) return;

    evaluationSaved = true;
    resumeSessions.delete(sessionId);

    try {
      const durationSeconds = Math.round((Date.now() - startedAt) / 1000);
      const transcript = transcriptLines.join("\n") || interviewEvents.join("\n").slice(0, 12000);
      const evaluation = evaluateCandidate({
        resumeText: resumeSession.resumeText,
        transcript,
        durationSeconds,
        endedByTimer: interviewEndedByTimer
      });

      const evaluationPayload = {
        type: "EvaluationSaved",
        score: evaluation.score,
        questionsAnswered: evaluation.questionsAnswered,
        file: EVALUATION_FILE,
        durationSeconds,
        notes: evaluation.notes
      };

      completedEvaluations.set(sessionId, evaluationPayload);

      await appendEvaluationRow({
        timestamp: new Date().toISOString(),
        candidateName: resumeSession.candidateName,
        score: evaluation.score,
        questionsAnswered: evaluation.questionsAnswered,
        durationSeconds,
        endedByTimer: interviewEndedByTimer,
        resumeSummary: resumeSession.resumeSummary,
        notes: evaluation.notes,
        transcript
      });

      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify(evaluationPayload));
      }

      return evaluationPayload;
    } catch (error) {
      console.error("Evaluation save error:", error.message);
    }
  }

  async function finalizeInterview(reason, closeAfterSend) {
    clearTimeout(interviewTimer);

    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({
        type: "InterviewEnded",
        reason,
      }));
    }

    await saveEvaluationOnce();

    if (closeAfterSend) {
      setTimeout(() => {
        clientWs.close(1000, reason);
        dgWs.close();
      }, 300);
    }
  }
});

function parseClientMessage(data) {
  try {
    return JSON.parse(data.toString());
  } catch {
    return null;
  }
}

async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return normalizeText(result.text);
  } finally {
    await parser.destroy();
  }
}

function normalizeText(text) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractCandidateName(resumeText) {
  const lines = resumeText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12);

  const nameLine = lines.find((line) => {
    const lower = line.toLowerCase();
    return (
      line.length >= 3 &&
      line.length <= 60 &&
      !lower.includes("@") &&
      !lower.includes("resume") &&
      !lower.includes("curriculum") &&
      !/\d/.test(line)
    );
  });

  return nameLine || "Candidate";
}

function summarizeResume(resumeText) {
  const lines = resumeText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 2);

  const email = resumeText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const skillsLine = lines.find((line) => /skills|technologies|tools/i.test(line));
  const experienceLine = lines.find((line) => /experience|intern|developer|engineer|project/i.test(line));
  const educationLine = lines.find((line) => /education|university|college|degree|bachelor|master/i.test(line));

  return [
    email ? `Email: ${email}` : null,
    skillsLine ? `Skills area: ${skillsLine}` : null,
    experienceLine ? `Experience/project area: ${experienceLine}` : null,
    educationLine ? `Education area: ${educationLine}` : null,
    `Resume excerpt: ${resumeText.slice(0, 1200)}`
  ].filter(Boolean).join("\n");
}

function buildInterviewPrompt(resumeSession) {
  return `
You are a strict, time-aware AI interviewer conducting a 5-minute technical interview based on the candidate's resume.

## CANDIDATE
Name: ${resumeSession.candidateName}

## RESUME CONTEXT
${resumeSession.resumeText}

## YOUR ROLE
- YOU control the interview. The user does not.
- You ask questions. The user answers. That's it.
- Use the resume context to ask relevant questions about their skills, projects, education, and experience.
- Do not let the user derail, chat, or steer the conversation.

## INTERVIEW FLOW
1. Do not ask for the candidate's name. You already know it.
2. Start directly with question 1 after the greeting.
3. Ask exactly 5 questions, one at a time. Wait for the answer before moving to the next.
4. Make the questions specific to the resume. Prefer projects, listed technologies, practical decisions, tradeoffs, and fundamentals related to their background.
5. After the 5th answer, say exactly:
   "Thank you ${resumeSession.candidateName}, that concludes your interview. Please end the interview now."
6. Do not ask anything after question 5. The interview is over.

## RESPONSE HANDLING
- Treat "I don't know", "not sure", "no idea", silence, or a weak answer as a completed answer.
- If the candidate does not know, say only: "Okay, let's move to the next question."
- Never pressure the candidate to answer the same question after they say they do not know.
- Never repeat a question more than once.
- Keep a strict internal count from question 1 to question 5.
- After every answer, move forward to the next numbered question.

## QUESTION STYLE
- Question 1: ask about the strongest or most recent project from the resume.
- Question 2: ask about a listed technical skill or tool.
- Question 3: ask a practical debugging, design, or implementation question related to their background.
- Question 4: ask about teamwork, ownership, or decision-making based on their experience.
- Question 5: ask a concise fundamentals question relevant to their role.

## STRICT RULES
- Do NOT answer questions from the user.
- Do NOT give hints, explanations, or teach during the interview.
- If the user goes off-topic or asks you something, say: "Let's stay focused. Please answer the question."
- If the user says something irrelevant, count it as the answer and move to the next question.
- Keep every response short, 1-2 sentences max. This is voice. No long speeches.
- Do NOT give feedback on answers during the interview. Just acknowledge briefly ("Got it.", "Thank you.") and move on.
- The entire interview must stay within 5 minutes. Move forward if an answer is too long or rambling.
- If a candidate is rambling for more than 30 seconds, politely interrupt: "Thank you, I have enough. Next question."

## TONE
- Professional, calm, neutral.
- Not overly warm or encouraging. Not harsh. Just neutral and in control.
  `;
}

function collectTranscriptLine(eventText, transcriptLines) {
  try {
    const event = JSON.parse(eventText);
    const text = extractTextFromEvent(event);

    if (text) {
      const role = event.role || event.speaker || event.channel?.alternatives?.[0]?.role || event.type || "event";
      transcriptLines.push(`${role}: ${text}`);
    }
  } catch {
    if (eventText.trim()) {
      transcriptLines.push(eventText.trim());
    }
  }
}

function extractTextFromEvent(event) {
  return (
    event.transcript ||
    event.text ||
    event.content ||
    event.message ||
    event.channel?.alternatives?.[0]?.transcript ||
    event.channel?.alternatives?.[0]?.text ||
    event.alternatives?.[0]?.transcript ||
    event.alternatives?.[0]?.text ||
    ""
  ).trim?.();
}

function evaluateCandidate({ resumeText, transcript, durationSeconds, endedByTimer }) {
  const answerLikeLines = transcript
    .split("\n")
    .filter((line) => /user|candidate|human|transcript/i.test(line) && line.split(":").slice(1).join(":").trim());
  const questionsAnswered = Math.min(5, answerLikeLines.length || estimateAnsweredQuestions(transcript));
  const transcriptWords = transcript.split(/\s+/).filter(Boolean).length;
  const resumeKeywords = extractResumeKeywords(resumeText);
  const matchedKeywords = resumeKeywords.filter((keyword) => transcript.toLowerCase().includes(keyword));

  const answerScore = Math.min(45, questionsAnswered * 9);
  const depthScore = Math.min(25, Math.round(transcriptWords / 18));
  const relevanceScore = Math.min(20, matchedKeywords.length * 4);
  const completionScore = endedByTimer ? 5 : 10;
  const score = Math.max(0, Math.min(100, answerScore + depthScore + relevanceScore + completionScore));

  return {
    score,
    questionsAnswered,
    notes: [
      `Estimated answered questions: ${questionsAnswered}/5`,
      `Transcript words: ${transcriptWords}`,
      `Resume keyword matches: ${matchedKeywords.slice(0, 8).join(", ") || "none"}`,
      `Duration: ${durationSeconds}s`,
      endedByTimer ? "Interview auto-ended after 5 minutes." : "Interview ended before timer."
    ].join(" | ")
  };
}

function estimateAnsweredQuestions(transcript) {
  const agentQuestionCount = (transcript.match(/\?/g) || []).length;
  return Math.min(5, Math.max(0, agentQuestionCount));
}

function extractResumeKeywords(resumeText) {
  const commonWords = new Set([
    "and", "the", "for", "with", "from", "that", "this", "have", "has", "are",
    "was", "were", "you", "your", "resume", "project", "experience"
  ]);

  return [...new Set(
    resumeText
      .toLowerCase()
      .match(/[a-z][a-z0-9+#.]{2,}/g)
      ?.filter((word) => !commonWords.has(word))
      .slice(0, 80) || []
  )];
}

async function appendEvaluationRow(row) {
  const workbook = new ExcelJS.Workbook();
  let worksheet;
  console.log(transcript)

  try {
    await workbook.xlsx.readFile(EVALUATION_FILE);
    worksheet = workbook.getWorksheet("Evaluations");
  } catch {
    worksheet = workbook.addWorksheet("Evaluations");
  }

  if (!worksheet) {
    worksheet = workbook.addWorksheet("Evaluations");
  }

  if (worksheet.rowCount === 0) {
    worksheet.columns = [
      { header: "Timestamp", key: "timestamp", width: 24 },
      { header: "Candidate Name", key: "candidateName", width: 28 },
      { header: "Score", key: "score", width: 10 },
      { header: "Questions Answered", key: "questionsAnswered", width: 20 },
      { header: "Duration Seconds", key: "durationSeconds", width: 18 },
      { header: "Ended By Timer", key: "endedByTimer", width: 16 },
      { header: "Resume Summary", key: "resumeSummary", width: 60 },
      { header: "Notes", key: "notes", width: 60 },
      { header: "Transcript", key: "transcript", width: 80 }
    ];
  }

  worksheet.addRow(row);
  await workbook.xlsx.writeFile(EVALUATION_FILE);
}

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Stop the existing process or set PORT to another value in back/.env.`);
    process.exit(1);
  }

  console.error("Server error:", error);
  process.exit(1);
});

wss.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Stop the existing process or set PORT to another value in back/.env.`);
    process.exit(1);
  }

  console.error("WebSocket server error:", error);
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
