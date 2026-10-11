import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
  port: Number(process.env.PORT || 3001),
  mongoUri: process.env.MONGO_URI,
  deepgramApiKey: process.env.DEEPGRAM_API_KEY,
  frontendOrigin: process.env.FRONTEND_ORIGIN || "*",
  deepgramUrl: "wss://agent.deepgram.com/v1/agent/converse",
  interviewDurationMs: 2 * 60 * 1000,
  maxResumeTextChars: 6000,
  evaluationFile: path.join(__dirname, "candidate-evaluations.xlsx"),
  conversationHistoryDir: path.join(__dirname, "conversationHistory"),

  // Backblaze B2 S3 Configuration
  b2KeyId: process.env.B2_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
  b2ApplicationKey: process.env.B2_APPLICATION_KEY || process.env.AWS_SECRET_ACCESS_KEY,
  b2Endpoint: process.env.B2_ENDPOINT || "s3.us-west-004.backblazeb2.com",
  b2BucketName: process.env.B2_BUCKET_NAME || "vaadin-interview-recordings",
};

export { __filename, __dirname };
