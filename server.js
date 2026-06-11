import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = app.listen(process.env.PORT || 3001, () => {
  console.log("Server running");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (clientSocket) => {
  const dgSocket = new WebSocket("wss://agent.deepgram.com/v1/agent/converse", {
    headers: {
      Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
    },
  });

  dgSocket.on("open", () => {
    dgSocket.send(JSON.stringify({
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
        listen: {
          provider: {
            type: "deepgram",
            model: "nova-3"
          }
        },
        think: {
          provider: {
            type: "open_ai",
            model: "gpt-4o-mini"
          },
          prompt: "You are a polite AI interviewer. Ask one question at a time. Be supportive, professional, and conversational."
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

  clientSocket.on("message", (audioChunk) => {
    if (dgSocket.readyState === WebSocket.OPEN) {
      dgSocket.send(audioChunk);
    }
  });

  dgSocket.on("message", (data, isBinary) => {
    if (clientSocket.readyState === WebSocket.OPEN) {
      clientSocket.send(data, { binary: isBinary });
    }
  });

  clientSocket.on("close", () => dgSocket.close());
  dgSocket.on("close", () => clientSocket.close());
});