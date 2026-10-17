import express from "express";
import cors from "cors";
import http from "http";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import multer from "multer";
import { config, __dirname } from "./config.js";

import { evaluateTranscript, evaluationChecker } from "./controllers/evaluateTra.js";
import { resumeScraper } from "./controllers/resumeLogic.js";
import { handleSocket } from "./sockets/onConnection.js";
import { resumeSessions, completedEvaluations, customJobs } from "./state.js";
import { User, Job, Evaluation } from "./models.js";
import { generatePresignedUploadUrl, purgeOldB2Videos, verifyB2Connection, uploadBufferToB2 } from "./utils/b2Service.js";

dotenv.config();

// In-memory fallback stores
const memoryUsers = [];

// Connect to MongoDB Atlas if available
const mongoUri = process.env.MONGO_URI || config.mongoUri;
if (mongoUri) {
  mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 })
    .then(async () => {
      console.log("Connected to MongoDB Atlas successfully.");
      try {
        await User.syncIndexes();
      } catch (idxErr) {
        console.warn("Index sync notice:", idxErr.message);
      }
    })
    .catch((err) => console.warn("MongoDB Atlas connection warning (using in-memory fallback):", err.message));
}

export const port = config.port;
export const app = express();
export const server = http.createServer(app);
export const wss = new WebSocketServer({ server });

// Ensure public upload directories exist
const publicDir = path.join(__dirname, "public");
const videosDir = path.join(publicDir, "videos");
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true });

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", config.frontendOrigin);
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use(express.static(publicDir));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    mongoConnected: mongoose.connection.readyState === 1,
    deepgramConfigured: Boolean(config.deepgramApiKey),
  });
});

app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password, isCompany, companyName, companyDescription } = req.body || {};

    if (!name || !name.trim()) return res.status(400).json({ error: "Name is required." });
    if (!email || !email.trim()) return res.status(400).json({ error: "Email is required." });
    if (!password || password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters long." });

    const normalizedEmail = email.trim().toLowerCase();

    // Check DB first if connected
    if (mongoose.connection.readyState === 1) {
      try {
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
          return res.status(400).json({ error: "An account with this email already exists." });
        }

        const newUserObj = {
          name: name.trim(),
          email: normalizedEmail,
          password: password,
          isCompany: Boolean(isCompany),
        };

        if (isCompany) {
          newUserObj.companyName = companyName || name.trim();
          newUserObj.companyDescription = companyDescription || "";
        }

        const newUser = new User(newUserObj);

        try {
          await newUser.save();
        } catch (saveErr) {
          if (saveErr.code === 11000 || (saveErr.message && saveErr.message.includes("E11000"))) {
            const isEmailDup = saveErr.keyPattern?.email || (saveErr.message && saveErr.message.includes("email"));
            if (isEmailDup) {
              return res.status(400).json({ error: "An account with this email already exists." });
            }
            console.warn("Ignoring non-email duplicate key error during DB save:", saveErr.message);
          } else {
            throw saveErr;
          }
        }

        const userObj = {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          isCompany: newUser.isCompany,
          companyName: newUser.companyName,
          companyDescription: newUser.companyDescription
        };

        memoryUsers.push(userObj);

        return res.status(201).json({
          message: "User registered successfully.",
          user: userObj
        });
      } catch (dbErr) {
        console.warn("DB signup warning:", dbErr.message);
        const isEmailDup = dbErr.keyPattern?.email || (dbErr.message && dbErr.message.includes("email"));
        if (isEmailDup) {
          return res.status(400).json({ error: "An account with this email already exists." });
        }
      }
    }

    // In-memory fallback
    const existing = memoryUsers.find(u => u.email === normalizedEmail);
    if (existing) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    const memUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: normalizedEmail,
      password: password,
      isCompany: Boolean(isCompany),
      companyName: isCompany ? (companyName || name.trim()) : null,
      companyDescription: isCompany ? (companyDescription || "") : null,
    };
    memoryUsers.push(memUser);

    return res.status(201).json({
      message: "User registered successfully.",
      user: memUser
    });
  } catch (err) {
    console.error("Signup unhandled error:", err);
    res.status(500).json({ error: "Could not create user account." });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !email.trim()) return res.status(400).json({ error: "Email is required." });
    if (!password) return res.status(400).json({ error: "Password is required." });

    const normalizedEmail = email.trim().toLowerCase();

    if (mongoose.connection.readyState === 1) {
      try {
        const user = await User.findOne({ email: normalizedEmail });
        if (user && user.password === password) {
          return res.json({
            message: "Login successful.",
            user: {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              isCompany: user.isCompany,
              companyName: user.companyName,
              companyDescription: user.companyDescription
            }
          });
        }
      } catch (dbErr) {
        console.warn("DB login warning:", dbErr.message);
      }
    }

    // In-memory fallback
    const user = memoryUsers.find(u => u.email === normalizedEmail);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    return res.json({
      message: "Login successful.",
      user
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Could not authenticate user." });
  }
});

app.get("/api/jobs", async (_req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const dbJobs = await Job.find().sort({ createdAt: -1 });
      if (dbJobs && dbJobs.length) return res.json({ jobs: [...dbJobs, ...customJobs] });
    }
    res.json({ jobs: customJobs });
  } catch (e) {
    res.json({ jobs: customJobs });
  }
});

app.post("/api/jobs", async (req, res) => {
  try {
    const { role, companyName, companyDescription, requirements, extraInstructions, companyId, postedBy } = req.body || {};

    if (!role || !role.trim()) return res.status(400).json({ error: "Role title is required." });

    const reqList = Array.isArray(requirements) ? requirements : (typeof requirements === 'string' ? requirements.split(',').map(s => s.trim()).filter(Boolean) : []);

    const newJobObj = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      role: role.trim(),
      companyName: companyName || "Partner Company",
      companyDescription: companyDescription || "",
      requirements: reqList,
      extraInstructions: extraInstructions || "",
      companyId: companyId || null,
      postedBy: postedBy || "Company"
    };

    if (mongoose.connection.readyState === 1) {
      const dbJob = new Job(newJobObj);
      await dbJob.save();
    }

    customJobs.push(newJobObj);

    res.status(201).json({
      message: "Job posted successfully.",
      job: newJobObj
    });
  } catch (err) {
    console.error("Job post error:", err);
    res.status(500).json({ error: "Could not publish job posting." });
  }
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    const { userEmail } = req.query;

    if (!userEmail) {
      return res.status(403).json({ error: "Unauthorized access. Leaderboard is strictly restricted to verified company accounts." });
    }

    let isCompany = false;
    let userId = null;

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email: userEmail.toLowerCase() });
      if (user && user.isCompany) {
        isCompany = true;
        userId = user._id.toString();
      }
    } else {
      const mem = memoryUsers.find(u => u.email === userEmail.toLowerCase());
      if (mem && mem.isCompany) {
        isCompany = true;
        userId = mem.id;
      }
    }

    if (!isCompany) {
      return res.status(403).json({ error: "Access Denied. Only registered hiring companies can view interview leaderboard candidate records." });
    }

    if (mongoose.connection.readyState === 1) {
      const evaluations = await Evaluation.find({ companyId: userId }).sort({ score: req.query.order === 'desc' ? -1 : 1 });
      if (evaluations && evaluations.length) return res.json({ leaderboard: evaluations });
    }

    const memoryList = Array.from(completedEvaluations.values());
    const sortOrder = req.query.order === 'desc' ? -1 : 1;
    memoryList.sort((a, b) => (a.score - b.score) * sortOrder);

    res.json({ leaderboard: memoryList });
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ error: "Could not fetch leaderboard." });
  }
});

app.post("/api/upload-video", upload.single("video"), async (req, res) => {
  try {
    const { sessionId, b2FileUrl, b2Key } = req.body || {};

    // Handle direct Backblaze B2 notification (JSON payload)
    if (b2FileUrl) {
      if (sessionId) {
        if (completedEvaluations.has(sessionId)) {
          const evalData = completedEvaluations.get(sessionId);
          evalData.videoUrl = b2FileUrl;
          evalData.b2ObjectKey = b2Key;
          completedEvaluations.set(sessionId, evalData);
        }
        if (mongoose.connection.readyState === 1) {
          try { await Evaluation.updateOne({ sessionId }, { videoUrl: b2FileUrl, b2ObjectKey: b2Key }); } catch (e) {}
        }
      }
      return res.json({ message: "B2 video metadata recorded.", videoUrl: b2FileUrl });
    }

    if (!req.file) return res.status(400).json({ error: "No video file provided." });

    const filename = `interview_${sessionId || Date.now()}.webm`;

    // 1. Attempt direct server-side upload to Backblaze B2 bucket
    const b2Upload = await uploadBufferToB2(req.file.buffer, filename, "video/webm");

    let finalVideoUrl = "";
    let finalB2Key = null;

    if (b2Upload && b2Upload.fileUrl) {
      finalVideoUrl = b2Upload.fileUrl;
      finalB2Key = b2Upload.key;
      console.log(`🚀 [B2 Upload Success] Video saved to B2 bucket: ${finalVideoUrl}`);
    } else {
      // 2. Local disk fallback if B2 is not configured or fails
      const filePath = path.join(videosDir, filename);
      await fs.promises.writeFile(filePath, req.file.buffer);
      finalVideoUrl = `/videos/${filename}`;
      console.log(`📁 [Local Fallback] Video saved locally: ${finalVideoUrl}`);
    }

    if (sessionId) {
      if (completedEvaluations.has(sessionId)) {
        const evalData = completedEvaluations.get(sessionId);
        evalData.videoUrl = finalVideoUrl;
        if (finalB2Key) evalData.b2ObjectKey = finalB2Key;
        completedEvaluations.set(sessionId, evalData);
      }
      if (mongoose.connection.readyState === 1) {
        try {
          await Evaluation.updateOne(
            { sessionId },
            { videoUrl: finalVideoUrl, ...(finalB2Key ? { b2ObjectKey: finalB2Key } : {}) }
          );
        } catch (e) {}
      }
    }

    return res.json({ message: "Video uploaded successfully.", videoUrl: finalVideoUrl, b2Key: finalB2Key });
  } catch (err) {
    console.error("Upload video error:", err);
    return res.status(500).json({ error: "Could not upload video file." });
  }
});

// --- Backblaze B2 Presigned Upload URL Endpoint ---
app.post("/api/interviews/get-upload-url", async (req, res) => {
  try {
    const { sessionId, filename = "recording.webm", contentType = "video/webm" } = req.body || {};
    const effectiveFilename = `${sessionId || Date.now()}_${filename}`;

    const b2Data = await generatePresignedUploadUrl(effectiveFilename, contentType);
    if (b2Data) {
      return res.json({
        ok: true,
        provider: "backblaze_b2",
        uploadUrl: b2Data.uploadUrl,
        fileUrl: b2Data.fileUrl,
        key: b2Data.key,
      });
    }

    // Fallback: local endpoint if B2 credentials are not set
    const fallbackFilename = `interview_${sessionId || Date.now()}.webm`;
    return res.json({
      ok: true,
      provider: "local",
      uploadUrl: `${config.frontendOrigin === "*" ? "" : config.frontendOrigin}/api/upload-video`,
      fileUrl: `/videos/${fallbackFilename}`,
      key: fallbackFilename,
    });
  } catch (err) {
    console.error("Presigned URL error:", err);
    res.status(500).json({ error: "Could not generate upload URL." });
  }
});

// --- Recruiter / Company Multi-Tenancy Job Management Endpoints ---

// Get all jobs for a specific company
app.get("/api/company/jobs", async (req, res) => {
  try {
    const { companyId, userEmail } = req.query;
    if (!companyId && !userEmail) {
      return res.status(400).json({ error: "Company identification is required." });
    }

    let targetCompanyId = companyId;
    if (!targetCompanyId && userEmail) {
      if (mongoose.connection.readyState === 1) {
        const u = await User.findOne({ email: userEmail.toLowerCase() });
        if (u) targetCompanyId = u._id.toString();
      } else {
        const u = memoryUsers.find(x => x.email === userEmail.toLowerCase());
        if (u) targetCompanyId = u.id;
      }
    }

    let jobsList = [];
    if (mongoose.connection.readyState === 1 && targetCompanyId) {
      jobsList = await Job.find({ companyId: targetCompanyId }).sort({ createdAt: -1 });
    } else {
      jobsList = customJobs.filter(j => j.companyId === targetCompanyId);
    }

    return res.json({ ok: true, jobs: jobsList });
  } catch (err) {
    console.error("Fetch company jobs error:", err);
    res.status(500).json({ error: "Could not fetch company job listings." });
  }
});

// Edit / Update a job listing (Company only)
app.put("/api/company/jobs/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const { role, companyName, companyDescription, requirements, extraInstructions, status, companyId } = req.body;

    if (mongoose.connection.readyState === 1) {
      const job = await Job.findOne({ id: jobId });
      if (!job) return res.status(404).json({ error: "Job not found." });
      if (companyId && job.companyId && job.companyId !== companyId) {
        return res.status(403).json({ error: "Unauthorized access to job listing." });
      }

      if (role) job.role = role.trim();
      if (companyName) job.companyName = companyName;
      if (companyDescription !== undefined) job.companyDescription = companyDescription;
      if (requirements) job.requirements = Array.isArray(requirements) ? requirements : requirements.split(",").map(s => s.trim());
      if (extraInstructions !== undefined) job.extraInstructions = extraInstructions;
      if (status && ["active", "closed"].includes(status)) job.status = status;

      await job.save();
      return res.json({ ok: true, job });
    }

    // In-memory update
    const memJob = customJobs.find(j => j.id === jobId);
    if (!memJob) return res.status(404).json({ error: "Job not found." });
    if (role) memJob.role = role.trim();
    if (status) memJob.status = status;
    if (requirements) memJob.requirements = Array.isArray(requirements) ? requirements : requirements.split(",").map(s => s.trim());
    if (extraInstructions !== undefined) memJob.extraInstructions = extraInstructions;

    return res.json({ ok: true, job: memJob });
  } catch (err) {
    console.error("Update job error:", err);
    res.status(500).json({ error: "Could not update job listing." });
  }
});

// Close a job position
app.patch("/api/company/jobs/:jobId/status", async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status, companyId } = req.body;

    if (!["active", "closed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value." });
    }

    if (mongoose.connection.readyState === 1) {
      const job = await Job.findOne({ id: jobId });
      if (!job) return res.status(404).json({ error: "Job not found." });
      if (companyId && job.companyId && job.companyId !== companyId) {
        return res.status(403).json({ error: "Unauthorized." });
      }
      job.status = status;
      await job.save();
      return res.json({ ok: true, job });
    }

    const memJob = customJobs.find(j => j.id === jobId);
    if (memJob) memJob.status = status;
    return res.json({ ok: true, job: memJob });
  } catch (err) {
    console.error("Change status error:", err);
    res.status(500).json({ error: "Could not change job status." });
  }
});

// Get applicants for a specific job with strict Company tenant isolation
app.get("/api/company/jobs/:jobId/applicants", async (req, res) => {
  try {
    const { jobId } = req.params;
    const { companyId, userEmail } = req.query;

    let requestingCompanyId = companyId;
    if (!requestingCompanyId && userEmail) {
      if (mongoose.connection.readyState === 1) {
        const u = await User.findOne({ email: userEmail.toLowerCase() });
        if (u) requestingCompanyId = u._id.toString();
      } else {
        const u = memoryUsers.find(x => x.email === userEmail.toLowerCase());
        if (u) requestingCompanyId = u.id;
      }
    }

    if (!requestingCompanyId) {
      return res.status(403).json({ error: "Access Denied: Company identification is required." });
    }

    let applicants = [];
    if (mongoose.connection.readyState === 1) {
      // Find job first to verify company ownership
      const targetJob = await Job.findOne({ id: jobId });
      if (targetJob && targetJob.companyId && targetJob.companyId !== requestingCompanyId) {
        return res.status(403).json({ error: "Access Denied: You do not own this job listing." });
      }

      applicants = await Evaluation.find({ jobId, companyId: requestingCompanyId }).sort({ completedAt: -1 });
    } else {
      const allEvals = Array.from(completedEvaluations.values());
      applicants = allEvals.filter(ev => ev.jobId === jobId && ev.companyId === requestingCompanyId);
    }

    return res.json({ ok: true, applicants });
  } catch (err) {
    console.error("Fetch job applicants error:", err);
    res.status(500).json({ error: "Could not fetch applicants for job." });
  }
});

app.post("/api/evaluate-local", evaluateTranscript);
app.post("/resume", upload.single("resume"), resumeScraper);
app.get("/evaluation/:sessionId", evaluationChecker);

wss.on("connection", handleSocket);

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use.`);
    process.exit(1);
  }
  process.exit(1);
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);

  // Verify Backblaze B2 Bucket Connection in terminal on startup
  verifyB2Connection();

  // Schedule daily auto-purge for videos older than 3 days in Backblaze B2
  const runAutoPurge = async () => {
    try {
      const purged = await purgeOldB2Videos(3);
      if (purged > 0) {
        console.log(`Auto-purge: Removed ${purged} interview recording(s) older than 3 days from B2.`);
      }
    } catch (e) {
      console.warn("Auto-purge warning:", e.message);
    }
  };

  runAutoPurge();
  setInterval(runAutoPurge, 24 * 60 * 60 * 1000);
});
