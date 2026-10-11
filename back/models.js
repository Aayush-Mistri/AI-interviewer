import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  isCompany: { type: Boolean, default: false },
  companyName: { type: String, default: null },
  companyDescription: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

const jobSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  role: { type: String, required: true },
  companyName: { type: String, default: "Company" },
  companyDescription: { type: String, default: "" },
  requirements: [String],
  extraInstructions: { type: String, default: "" },
  companyId: { type: String, default: null },
  postedBy: { type: String, default: "Company" },
  createdAt: { type: Date, default: Date.now }
});

const evaluationSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  candidateName: { type: String, default: "Candidate" },
  jobRole: { type: String, default: "Technical Screening" },
  jobId: { type: String, default: null },
  companyId: { type: String, default: null },
  companyName: { type: String, default: null },
  score: { type: Number, default: 0 },
  questionsAnswered: { type: Number, default: 0 },
  summary: { type: String, default: "" },
  strengths: [String],
  weaknesses: [String],
  improvementAdvice: { type: String, default: "" },
  transcript: { type: String, default: "" },
  videoUrl: { type: String, default: null },
  completedAt: { type: Date, default: Date.now }
});

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const Job = mongoose.models.Job || mongoose.model("Job", jobSchema);
export const Evaluation = mongoose.models.Evaluation || mongoose.model("Evaluation", evaluationSchema);
