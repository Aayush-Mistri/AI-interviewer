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

dotenv.config();

// In-memory fallback stores
const memoryUsers = [];

// Connect to MongoDB Atlas if available
const mongoUri = process.env.MONGO_URI || config.mongoUri;
if (mongoUri) {
  mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 })
    .then(() => console.log("Connected to MongoDB Atlas successfully."))
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
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) return res.status(400).json({ error: "An account with this email already exists." });

      const newUser = new User({
        name: name.trim(),
        email: normalizedEmail,
        password: password,
        isCompany: Boolean(isCompany),
        companyName: isCompany ? (companyName || name.trim()) : null,
        companyDescription: isCompany ? (companyDescription || "") : null,
      });

      await newUser.save();

      return res.status(201).json({
        message: "User registered successfully.",
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          isCompany: newUser.isCompany,
          companyName: newUser.companyName,
          companyDescription: newUser.companyDescription
        }
      });
    }

    // In-memory fallback
    const existing = memoryUsers.find(u => u.email === normalizedEmail);
    if (existing) return res.status(400).json({ error: "An account with this email already exists." });

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

    res.status(201).json({
      message: "User registered successfully.",
      user: memUser
    });
  } catch (err) {
    console.error("Signup error:", err);
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
      const user = await User.findOne({ email: normalizedEmail });
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

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

    // In-memory fallback
    const user = memoryUsers.find(u => u.email === normalizedEmail);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    res.json({
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

app.delete("/api/jobs/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Delete from in-memory array
    const memoryIdx = customJobs.findIndex(j => j.id === id);
    if (memoryIdx !== -1) {
      customJobs.splice(memoryIdx, 1);
    }

    // Delete from MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      await Job.deleteOne({ id });
    }

    res.json({ message: "Job post deleted successfully.", id });
  } catch (err) {
    console.error("Delete job error:", err);
    res.status(500).json({ error: "Could not delete job post." });
  }
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    const { userEmail } = req.query;

    if (!userEmail) {
      return res.status(403).json({ error: "Unauthorized access. Leaderboard is strictly restricted to verified company accounts." });
    }

    const normalizedEmail = String(userEmail).trim().toLowerCase();
    let isCompany = false;
    let userId = null;
    let companyName = null;

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email: normalizedEmail });
      if (user && user.isCompany) {
        isCompany = true;
        userId = user._id.toString();
        companyName = user.companyName;
      }
    }

    if (!isCompany) {
      const mem = memoryUsers.find(u => u.email === normalizedEmail);
      if (mem && mem.isCompany) {
        isCompany = true;
        userId = mem.id;
        companyName = mem.companyName;
      }
    }

    if (!isCompany) {
      return res.status(403).json({ error: "Access Denied. Only registered hiring companies can view interview leaderboard candidate records." });
    }

    const sortOrder = req.query.order === 'desc' ? -1 : 1;

    if (mongoose.connection.readyState === 1) {
      // Find evaluations matching companyId or companyName or return all evaluations if company created default jobs
      const queryFilter = {
        $or: [
          { companyId: userId },
          { companyName: companyName },
          { companyId: null }
        ]
      };
      const evaluations = await Evaluation.find(queryFilter).sort({ score: sortOrder });
      return res.json({ leaderboard: evaluations || [] });
    }

    const memoryList = Array.from(completedEvaluations.values()).filter(ev => {
      return !ev.companyId || ev.companyId === userId || ev.companyName === companyName;
    });
    memoryList.sort((a, b) => ((a.score || 0) - (b.score || 0)) * sortOrder);

    res.json({ leaderboard: memoryList });
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ error: "Could not fetch leaderboard." });
  }
});

app.post("/api/upload-video", upload.single("video"), async (req, res) => {
  const { sessionId } = req.body;

  if (!req.file) return res.status(400).json({ error: "No video file provided." });

  const filename = `interview_${sessionId || Date.now()}.webm`;
  const filePath = path.join(videosDir, filename);

  fs.writeFile(filePath, req.file.buffer, async (err) => {
    if (err) return res.status(500).json({ error: "Could not save video file." });

    const videoUrl = `/videos/${filename}`;

    if (sessionId) {
      if (completedEvaluations.has(sessionId)) {
        const evalData = completedEvaluations.get(sessionId);
        evalData.videoUrl = videoUrl;
        completedEvaluations.set(sessionId, evalData);
      }
      if (mongoose.connection.readyState === 1) {
        try { await Evaluation.updateOne({ sessionId }, { videoUrl }); } catch (e) {}
      }
    }

    res.json({ message: "Video uploaded successfully.", videoUrl });
  });
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
});
