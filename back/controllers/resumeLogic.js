import {extractPdfText , normalizeText , extractCandidateName , parseClientMessage , summarizeResume , extractResumeKeywords} from "../utils/pdfScrap.js"
import { randomUUID } from "crypto";
import {resumeSessions} from "../server.js"
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




export const resumeScraper = async(req , res) => {
    try {
        if (!req.file) {
          res.status(400).json({ error: "Please upload a PDF resume." });
          return;
        }
    
        if (req.file.mimetype !== "application/pdf") {
          res.status(400).json({ error: "Only PDF resumes are supported." });
          return;
        }
    
        const resumeText = await extractPdfText(req.file.buffer);
    
        if (!resumeText) {
          res.status(400).json({ error: "Could not read text from this PDF." });
          return;
        }
    
        const candidateName = extractCandidateName(resumeText);
        const resumeSummary = summarizeResume(resumeText);
        const sessionId = randomUUID();
    
        resumeSessions.set(sessionId, {
          candidateName,
          resumeText: resumeText.slice(0, MAX_RESUME_TEXT_CHARS),
          resumeSummary,
          createdAt: Date.now()
        });
    
        res.json({
          sessionId,
          candidateName,
          resumeSummary
        });
      } catch (error) {
        console.error("Resume parse error:", error.message);
        res.status(500).json({ error: "Could not process resume PDF." });
      }
}
