import { config } from "../config.js";
import ExcelJS from "exceljs";
import { extractResumeKeywords } from "./pdfScrap.js";

export function collectTranscriptLine(eventText, transcriptLines) {
  try {
    const event = JSON.parse(eventText);
    if (event.type !== "ConversationText") return null;
    const text = extractTextFromEvent(event);

    if (!text) return null;

    const speaker = event.role === "assistant" ? "AI" : event.role === "user" ? "Candidate" : "System";
    const line = { speaker, text };
    transcriptLines.push(line);
    return line;
  } catch {
    return null;
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
  const turns = parseTranscript(transcript);
  const candidateTurns = turns.filter((turn) => turn.speaker === "Candidate");
  const interviewerQuestions = turns.filter((turn) => turn.speaker === "AI" && turn.text.includes("?"));
  const answerPairs = interviewerQuestions.slice(0, 5).map((question, index) => ({
    question: question.text,
    answer: candidateTurns[index]?.text || "No answer captured.",
  }));
  const meaningfulAnswers = answerPairs.filter(({ answer }) => isMeaningfulAnswer(answer));
  const questionsAnswered = meaningfulAnswers.length;
  const transcriptWords = candidateTurns.reduce((total, turn) => total + wordCount(turn.text), 0);
  const averageAnswerWords = candidateTurns.length ? Math.round(transcriptWords / candidateTurns.length) : 0;
  const resumeKeywords = extractResumeKeywords(resumeText);
  const candidateText = candidateTurns.map((turn) => turn.text).join(" ").toLowerCase();
  const matchedKeywords = resumeKeywords.filter((keyword) => candidateText.includes(keyword));
  const technicalSignals = ["because", "implemented", "built", "debug", "test", "api", "database", "algorithm", "deploy", "trade-off", "performance", "scalable", "architecture", "repository", "latency"];
  const evidenceSignals = ["for example", "measured", "result", "improved", "reduced", "increased", "users", "%", "trade-off", "in production"];
  const technicalMatches = technicalSignals.filter((signal) => candidateText.includes(signal));
  const evidenceMatches = evidenceSignals.filter((signal) => candidateText.includes(signal));
  const coverageScore = interviewerQuestions.length ? Math.round((questionsAnswered / Math.min(5, interviewerQuestions.length)) * 30) : 0;
  const depthScore = Math.min(25, Math.round((averageAnswerWords / 20) * 25));
  const technicalScore = Math.min(20, technicalMatches.length * 4);
  const relevanceScore = Math.min(15, Math.round(matchedKeywords.length * 1.5));
  const evidenceScore = Math.min(10, evidenceMatches.length * 3);
  let score = coverageScore + depthScore + technicalScore + relevanceScore + evidenceScore;

  // Short or purely conversational interviews must not look like strong technical results.
  if (transcriptWords < 20) score = Math.min(score, 10);
  else if (transcriptWords < 40) score = Math.min(score, 25);
  if (!technicalMatches.length) score = Math.min(score, 45);
  if (!meaningfulAnswers.length) score = Math.min(score, 15);

  const strengths = [];
  const weaknesses = [];

  if (questionsAnswered >= 3) strengths.push("Answered several questions with enough detail to evaluate.");
  if (technicalMatches.length >= 2) strengths.push("Used concrete technical and problem-solving language.");
  if (matchedKeywords.length >= 3) strengths.push("Connected answers to skills found in the resume.");
  if (evidenceMatches.length >= 2) strengths.push("Included examples, outcomes, or measurable evidence.");
  if (!strengths.length) strengths.push("The interview contained too little evidence to identify a reliable strength.");
  if (questionsAnswered < Math.min(3, interviewerQuestions.length || 3)) weaknesses.push("Several questions were unanswered or had very short responses.");
  if (averageAnswerWords < 10) weaknesses.push("Answers needed substantially more context, reasoning, and explanation.");
  if (technicalMatches.length < 2) weaknesses.push("Technical answers did not include enough implementation detail.");
  if (evidenceMatches.length < 2) weaknesses.push("Answers lacked concrete examples, trade-offs, or measurable outcomes.");
  if (!weaknesses.length) weaknesses.push("Continue sharpening answers with measurable outcomes and trade-offs.");

  const questionFeedback = answerPairs.map(({ question, answer }) => {
    const answerWords = wordCount(answer);
    const substantive = isMeaningfulAnswer(answer);
    const answerLower = answer.toLowerCase();
    const answerTechnicalMatches = technicalSignals.filter((signal) => answerLower.includes(signal));
    return {
      question,
      answer,
      assessment: !substantive
        ? "Insufficient response to assess."
        : answerWords < 12
          ? "Relevant start, but it needs more explanation and detail."
          : answerTechnicalMatches.length
            ? "Shows useful technical direction; add outcomes and trade-offs to make it stronger."
            : "Provides some detail, but the technical reasoning is not yet clear.",
      wordCount: answerWords,
      score: !substantive ? 0 : Math.min(100, 35 + answerWords * 2 + answerTechnicalMatches.length * 10),
    };
  });

  return {
    score: Math.max(0, Math.min(100, score)),
    questionsAnswered,
    summary: `Scored ${score}/100 using answer coverage, depth, technical reasoning, resume relevance, and concrete evidence. This interview contained ${transcriptWords} candidate words across ${candidateTurns.length} response${candidateTurns.length === 1 ? "" : "s"}.`,
    scoreBreakdown: {
      coverage: coverageScore,
      depth: depthScore,
      technicalReasoning: technicalScore,
      resumeRelevance: relevanceScore,
      concreteEvidence: evidenceScore,
    },
    questionFeedback,
    strengths,
    weaknesses,
    improvementAdvice: "Use a situation, task, action, and result structure. Explain your design choices, mention trade-offs, and quantify the outcome. A strong technical answer should include what you built, how it worked, and how you verified it.",
    notes: `Candidate words: ${transcriptWords} | Resume keyword matches: ${matchedKeywords.slice(0, 8).join(", ") || "none"} | Duration: ${durationSeconds}s | ${endedByTimer ? "Auto-ended at the time limit." : "Ended by the candidate."}`
  };
}

function parseTranscript(transcript) {
  return transcript.split("\n").map((line) => {
    const separator = line.indexOf(":");
    if (separator < 0) return null;
    return { speaker: line.slice(0, separator).trim(), text: line.slice(separator + 1).trim() };
  }).filter((turn) => turn?.text && ["AI", "Candidate"].includes(turn.speaker));
}

function wordCount(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

function isMeaningfulAnswer(answer) {
  const words = wordCount(answer);
  if (!answer || answer === "No answer captured.") return false;
  return words >= 8 || (words >= 5 && /because|built|implemented|created|worked|used|developed|solved|debugged/i.test(answer));
}

//writing in excel file
export async function appendEvaluationRow(row) {   
  const workbook = new ExcelJS.Workbook();
  let worksheet;

  try {
    await workbook.xlsx.readFile(config.evaluationFile);
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
      { header: "Summary", key: "summary", width: 60 },
      { header: "Score Breakdown", key: "scoreBreakdown", width: 60 },
      { header: "Question Feedback", key: "questionFeedback", width: 80 },
      { header: "Strengths", key: "strengths", width: 60 },
      { header: "Weaknesses", key: "weaknesses", width: 60 },
      { header: "Improvement Advice", key: "improvementAdvice", width: 60 },
      { header: "Notes", key: "notes", width: 60 },
      { header: "Transcript", key: "transcript", width: 80 }
    ];
  }

  worksheet.addRow(row);
  await workbook.xlsx.writeFile(config.evaluationFile);
}
