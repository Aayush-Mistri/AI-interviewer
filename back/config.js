import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
  port: Number(process.env.PORT || 3001),
  deepgramApiKey: process.env.DEEPGRAM_API_KEY,
  frontendOrigin: process.env.FRONTEND_ORIGIN || "*",
  deepgramUrl: "wss://agent.deepgram.com/v1/agent/converse",
  interviewDurationMs: 2 * 60 * 1000,
  maxResumeTextChars: 6000,
  evaluationFile: path.join(__dirname, "candidate-evaluations.xlsx"),
  conversationHistoryDir: path.join(__dirname, "conversationHistory"),
};

export { __filename, __dirname };
