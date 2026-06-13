import { PDFParse } from "pdf-parse";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import multer from "multer";
import ExcelJS from "exceljs";
import { __filename , __dirname } from "../server.js";




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

export async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return normalizeText(result.text);
  } finally {
    await parser.destroy();
  }
}

export function normalizeText(text) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function extractCandidateName(resumeText) {
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


export function parseClientMessage(data) {
  try {
    return JSON.parse(data.toString());
  } catch {
    return null;
  }
}


export function summarizeResume(resumeText) {
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



export function extractResumeKeywords(resumeText) {
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