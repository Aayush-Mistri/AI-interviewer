import {extractPdfText , normalizeText , extractCandidateName , summarizeResume , extractResumeKeywords} from "../utils/pdfScrap.js"
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import {resumeSessions, customJobs} from "../state.js"
import { Job } from "../models.js";
import { config, __dirname } from "../config.js";

const resumesDir = path.join(__dirname, "public", "resumes");
if (!fs.existsSync(resumesDir)) fs.mkdirSync(resumesDir, { recursive: true });

export const resumeScraper = async(req , res) => {
    try {
        const { jobRole, jobId, companyName, companyDescription, candidateRequirements, extraInstructions } = req.body;

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

        // Save candidate resume PDF file locally to public/resumes
        let resumeUrl = null;
        try {
          const resumeFileName = `${sessionId}.pdf`;
          const filePath = path.join(resumesDir, resumeFileName);
          await fs.promises.writeFile(filePath, req.file.buffer);
          resumeUrl = `/resumes/${resumeFileName}`;
        } catch (fileErr) {
          console.warn("Could not save candidate resume file locally:", fileErr.message);
        }

        // Check if there are associated custom job details from DB or memory
        let jobDetails = null;
        if (jobId) {
          try {
            jobDetails = await Job.findOne({ id: jobId });
          } catch (e) {}
          if (!jobDetails) {
            jobDetails = customJobs.find(j => j.id === jobId);
          }
        }
    
        resumeSessions.set(sessionId, {
          candidateName,
          jobId: jobId || jobDetails?.id || null,
          companyId: jobDetails?.companyId || null,
          jobRole: jobRole || jobDetails?.role || "General Role",
          companyDetails: jobDetails ? { name: jobDetails.companyName, description: jobDetails.companyDescription } : (companyName ? { name: companyName, description: companyDescription } : null),
          candidateRequirements: jobDetails?.requirements?.join(", ") || candidateRequirements || "",
          extraInstructions: jobDetails?.extraInstructions || extraInstructions || "",
          resumeText: resumeText.slice(0, config.maxResumeTextChars),
          resumeSummary,
          resumeUrl,
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
