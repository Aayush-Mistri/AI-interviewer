import express from "express";
import cors from "cors";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";
import dotenv from "dotenv";
import multer from "multer";
import ExcelJS from "exceljs";


import { evaluateTranscript, evaluationChecker } from "./controllers/evaluateTra.js";
import { resumeScraper } from "./controllers/resumeLogic.js";
import { handleSocket } from "./sockets/onConnection.js";


export const port = Number(process.env.PORT || 3001);
export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);
export const app = express();
export const server = http.createServer(app);
export const wss = new WebSocketServer({ server });
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});



export const resumeSessions = new Map();
export const completedEvaluations = new Map();





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

app.get("/evaluation/:sessionId", evaluationChecker);

app.use(express.static(path.join(__dirname, "public")));

wss.on("connection" , handleSocket);





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
