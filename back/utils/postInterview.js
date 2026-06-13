import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import multer from "multer";
import ExcelJS from "exceljs";




export const DEEPGRAM_URL = "wss://agent.deepgram.com/v1/agent/converse";
export const INTERVIEW_DURATION_MS = 5 * 60 * 1000;
export const MAX_RESUME_TEXT_CHARS = 6000;
export const EVALUATION_FILE = path.join(__dirname, "candidate-evaluations.xlsx");
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

export function collectTranscriptLine(eventText, transcriptLines) {
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

export function extractTextFromEvent(event) {
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

export function evaluateCandidate({ resumeText, transcript, durationSeconds, endedByTimer }) {
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

export function estimateAnsweredQuestions(transcript) {
  const agentQuestionCount = (transcript.match(/\?/g) || []).length;
  return Math.min(5, Math.max(0, agentQuestionCount));
}

//writing in excel file
export async function appendEvaluationRow(row) {   
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
