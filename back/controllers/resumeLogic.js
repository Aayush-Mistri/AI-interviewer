import {extractPdfText , normalizeText , extractCandidateName , summarizeResume , extractResumeKeywords} from "../utils/pdfScrap.js"
import { randomUUID } from "crypto";
import {resumeSessions, customJobs} from "../state.js"
import { config } from "../config.js";

export const resumeScraper = async(req , res) => {
    try {
        const { jobRole, jobId, companyName, companyDescription, candidateRequirements } = req.body;

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

        // Check if there are associated custom job details
        let jobDetails = null;
        if (jobId) {
          jobDetails = customJobs.find(j => j.id === jobId);
        }
    
        resumeSessions.set(sessionId, {
          candidateName,
          jobRole: jobRole || jobDetails?.role || "General Role",
          companyDetails: jobDetails?.companyDetails || (companyName ? { name: companyName, description: companyDescription } : null),
          candidateRequirements: jobDetails?.requirements || candidateRequirements || "",
          resumeText: resumeText.slice(0, config.maxResumeTextChars),
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
