import express from "express";
import cors from "cors";
import http from "http";
import path from "path";
import fs from "fs";
import { WebSocketServer } from "ws";
import multer from "multer";
import { config, __dirname } from "./config.js";

import { evaluateTranscript, evaluationChecker } from "./controllers/evaluateTra.js";
import { resumeScraper } from "./controllers/resumeLogic.js";
import { handleSocket } from "./sockets/onConnection.js";
import { resumeSessions, completedEvaluations, customJobs } from "./state.js";

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
    fileSize: 50 * 1024 * 1024 // 50MB max
  }
});

// In-memory users store
const users = [];

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
    deepgramConfigured: Boolean(config.deepgramApiKey),
  });
});

app.post("/api/signup", (req, res) => {
  const { name, email, password, isCompany, companyName, companyDescription } = req.body || {};

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name is required." });
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ error: "Email is required." });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long." });
  }

  const existingUser = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: "An account with this email already exists." });
  }

  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: password,
    isCompany: Boolean(isCompany),
    companyName: isCompany ? (companyName || name.trim()) : null,
    companyDescription: isCompany ? (companyDescription || "") : null,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);

  res.status(201).json({
    message: "User registered successfully.",
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      isCompany: newUser.isCompany,
      companyName: newUser.companyName,
      companyDescription: newUser.companyDescription
    }
  });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !email.trim()) {
    return res.status(400).json({ error: "Email is required." });
  }
  if (!password) {
    return res.status(400).json({ error: "Password is required." });
  }

  const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  res.json({
    message: "Login successful.",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isCompany: user.isCompany,
      companyName: user.companyName,
      companyDescription: user.companyDescription
    }
  });
});

// Company Jobs API
app.get("/api/jobs", (_req, res) => {
  res.json({ jobs: customJobs });
});

app.post("/api/jobs", (req, res) => {
  const { role, companyName, companyDescription, requirements, gradient, postedBy } = req.body || {};

  if (!role || !role.trim()) {
    return res.status(400).json({ error: "Role title is required." });
  }

  const newJob = {
    id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    role: role.trim(),
    companyDetails: {
      name: companyName || "Partner Company",
      description: companyDescription || ""
    },
    description: companyDescription || `Hiring for ${role.trim()} position.`,
    requirements: Array.isArray(requirements) ? requirements : (typeof requirements === 'string' ? requirements.split(',').map(s => s.trim()).filter(Boolean) : []),
    gradient: gradient || "linear-gradient(135deg, #1e293b 0%, #475569 100%)",
    postedBy: postedBy || "Company",
    createdAt: new Date().toISOString()
  };

  customJobs.push(newJob);

  res.status(201).json({
    message: "Job posted successfully.",
    job: newJob
  });
});

// Leaderboard API (Returns evaluations sorted by score ascending or descending)
app.get("/api/leaderboard", (_req, res) => {
  const list = Array.from(completedEvaluations.values()).map((item) => {
    return {
      sessionId: item.sessionId,
      candidateName: item.candidateName || "Candidate",
      jobRole: item.jobRole || "Technical Screening",
      score: item.score || 0,
      questionsAnswered: item.questionsAnswered || 0,
      summary: item.summary || "",
      strengths: item.strengths || [],
      weaknesses: item.weaknesses || [],
      transcript: item.transcript || "",
      videoUrl: item.videoUrl || null,
      completedAt: item.completedAt || new Date().toISOString()
    };
  });

  // Sort by score ascending / descending (let's sort ascending as requested, or support query parameter)
  const sortOrder = _req.query.order === 'asc' ? 1 : -1;
  list.sort((a, b) => (a.score - b.score) * sortOrder);

  res.json({ leaderboard: list });
});

// Interview Video Upload API
app.post("/api/upload-video", upload.single("video"), (req, res) => {
  const { sessionId } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: "No video file provided." });
  }

  const filename = `interview_${sessionId || Date.now()}.webm`;
  const filePath = path.join(videosDir, filename);

  fs.writeFile(filePath, req.file.buffer, (err) => {
    if (err) {
      console.error("Video save error:", err);
      return res.status(500).json({ error: "Could not save video file." });
    }

    const videoUrl = `/videos/${filename}`;

    // Attach videoUrl to completed evaluation if present
    if (sessionId && completedEvaluations.has(sessionId)) {
      const evalData = completedEvaluations.get(sessionId);
      evalData.videoUrl = videoUrl;
      completedEvaluations.set(sessionId, evalData);
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
    console.error(`Port ${port} is already in use. Stop the existing process or set PORT to another value in back/.env.`);
    process.exit(1);
  }

  console.error("Server error:", error);
  process.exit(1);
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
