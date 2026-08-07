import { appendFile, mkdir, writeFile } from "fs/promises";
import path from "path";
import { config } from "../config.js";

function safeFilePart(value) {
  return String(value || "Candidate")
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "Candidate";
}

function formatTimestamp(timestamp = new Date()) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "medium",
    hour12: true,
  }).format(timestamp);
}

export async function createConversationHistory({ sessionId, candidateName, jobRole }) {
  await mkdir(config.conversationHistoryDir, { recursive: true });

  const fileName = `${safeFilePart(candidateName)}-${sessionId}.txt`;
  const filePath = path.join(config.conversationHistoryDir, fileName);
  const header = [
    "AI Interviewer - Conversation History",
    `Candidate: ${candidateName}`,
    `Role: ${jobRole}`,
    `Session ID: ${sessionId}`,
    `Started: ${formatTimestamp()}`,
    "",
  ].join("\n");

  await writeFile(filePath, header, "utf8");
  return filePath;
}

export async function appendConversationLine(filePath, speaker, text) {
  if (!filePath || !text?.trim()) return;
  await appendFile(filePath, `${speaker}:${text.trim()}\n`, "utf8");
}

export async function finishConversationHistory(filePath, { reason, score } = {}) {
  if (!filePath) return;
  await appendFile(
    filePath,
    ["", `Interview ended: ${formatTimestamp()}`, `Reason: ${reason || "Completed"}`, `Score: ${score ?? "Pending"}`, ""].join("\n"),
    "utf8"
  );
}
