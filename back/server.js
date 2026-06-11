import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const port = Number(process.env.PORT || 3001);
const deepgramApiKey = process.env.DEEPGRAM_API_KEY?.trim();

const DEEPGRAM_URL = "wss://agent.deepgram.com/v1/agent/converse";

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    deepgramConfigured: Boolean(deepgramApiKey),
  });
});

app.use(express.static(path.join(__dirname, "public")));

wss.on("connection", (clientWs) => {
  console.log("Browser connected");

  if (!deepgramApiKey) {
    clientWs.send(JSON.stringify({
      type: "Error",
      message: "Missing DEEPGRAM_API_KEY in back/.env",
    }));
    clientWs.close(1011, "Server is missing DEEPGRAM_API_KEY");
    return;
  }

  const dgWs = new WebSocket(DEEPGRAM_URL, {
    headers: {
      Authorization: `Token ${deepgramApiKey}`,
    },
  });

  dgWs.on("open", () => {
    console.log("Connected to Deepgram");

    dgWs.send(JSON.stringify({
      type: "Settings",
      audio: {
        input: {
          encoding: "linear16",
          sample_rate: 16000
        },
        output: {
          encoding: "linear16",
          sample_rate: 24000,
          container: "none"
        }
      },
      agent: {
        greeting: "Hello, I am your AI interviewer. Please introduce yourself.",
        listen: {
          provider: {
            type: "deepgram",
            model: "nova-3",
            language: "en",
            smart_format: true
          }
        },
        think: {
          provider: {
            type: "open_ai",
            model: "gpt-4o-mini"
          },
          prompt: `
You are a polite professional AI interviewer.
Ask one question at a time.
Do not rush.
Be supportive.
Ask relevant follow-up questions.
Focus on understanding the candidate's technical knowledge, projects, reasoning, and practical experience.
Do not judge communication harshly.
Keep replies short and natural for voice conversation.
          `
        },
        speak: {
          provider: {
            type: "deepgram",
            model: "aura-2-thalia-en"
          }
        }
      }
    }));
  });

  clientWs.on("message", (data, isBinary) => {
    if (dgWs.readyState === WebSocket.OPEN && isBinary) {
      dgWs.send(data);
    }
  });

  dgWs.on("message", (data, isBinary) => {
    if (clientWs.readyState !== WebSocket.OPEN) return;

    if (isBinary) {
      clientWs.send(data, { binary: true });
    } else {
      clientWs.send(data.toString());
    }
  });

  clientWs.on("close", () => {
    console.log("Browser disconnected");
    dgWs.close();
  });

  dgWs.on("close", () => {
    console.log("Deepgram disconnected");
    clientWs.close();
  });

  dgWs.on("error", (error) => {
    console.error("Deepgram error:", error.message);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({
        type: "Error",
        message: "Deepgram connection failed. Check your API key and agent provider access.",
      }));
    }
  });

  clientWs.on("error", (error) => {
    console.error("Browser websocket error:", error.message);
  });
});

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
