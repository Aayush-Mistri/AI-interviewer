# 🤖 TalentAI: AI-Powered Technical Interviewer

TalentAI is a high-fidelity prototype of an automated technical hiring platform. It allows candidates to apply for specific job roles, upload their resumes, and undergo a real-time, voice-based technical screening conducted by an AI agent.

## 🏗️ System Architecture

The project follows a decoupled Client-Server architecture with a heavy reliance on real-time streaming and AI agents.

### 1. Frontend (React + Vite)
The frontend is a modern, single-page application (SPA) designed with a high-end, dark-themed UI (inspired by HeyGen).
- **Routing**: Uses `react-router-dom` to manage the flow from Job Listings $\rightarrow$ Application $\rightarrow$ Interview Room $\rightarrow$ Evaluation.
- **Audio Streaming**: Captures raw PCM audio from the user's microphone and streams it via WebSockets to the backend.
- **Playback**: Receives raw PCM audio from the server and plays it back in real-time using the Web Audio API.

### 2. Backend (Node.js + Express)
The backend acts as the orchestrator between the user and the AI services.
- **State Management**: Uses an in-memory state store (`state.js`) to track active `resumeSessions` and `completedEvaluations`, avoiding circular dependencies.
- **PDF Processing**: Uses `pdf-parse` to extract text from resumes, which is then cleaned and summarized.
- **WebSocket Gateway**: Manages the connection between the browser and the Deepgram Agent API, ensuring session persistence.
- **Evaluation Engine**: Post-interview, it computes a technical score based on transcript analysis and uses a local LLM (Ollama) for detailed qualitative feedback.
- **Data Export**: Saves all interview results and transcripts into an Excel file (`candidate-evaluations.xlsx`) using `exceljs`.

### 3. AI Stack
The project utilizes a multi-stage AI pipeline:
- **The Agent (Deepgram)**: Handles the real-time voice loop. It integrates:
    - **STT (Speech-to-Text)**: Nova-3 model for ultra-low latency transcription.
    - **LLM (The Brain)**: GPT-4o-mini, driven by a strict "Elite Interviewer" system prompt.
    - **TTS (Text-to-Speech)**: Aura-2-Thalia for natural-sounding voice output.
- **The Evaluator (Ollama)**: Uses `gemma3:4b` locally to analyze the final transcript and provide a fair, unbiased technical score.

---

## 🔄 The Interview Flow

1. **Job Selection**: User picks a role (e.g., AI Engineer). The role's requirements are locked into the session.
2. **Resume Verification**: User uploads a PDF. The system extracts text and associates it with the selected job role.
3. **Voice Connection**: A WebSocket is established. The backend sends a **Context-Injected Prompt** to the Deepgram Agent containing:
    - The Candidate's Name.
    - The full text of the Resume.
    - The specific requirements of the Job Role.
4. **Real-time Interaction**: The AI leads the interview, asking 3-4 targeted technical questions and probing for depth.
5. **Auto-Termination**: The interview ends at exactly 2 minutes or when the AI concludes the screening.
6. **Scoring**: The system analyzes the transcript and presents a final score (/100) and technical notes to the candidate.

---

## ❓ Does it use RAG?

**No, it does not use RAG (Retrieval-Augmented Generation).**

Instead, it uses **Context Injection**. 

**The Difference:**
- **RAG** is used when you have massive amounts of data (thousands of documents). You store them in a Vector Database and "retrieve" only the most relevant chunks to put into the prompt.
- **Context Injection** is used when the data (like a 1-2 page resume) is small enough to fit entirely within the LLM's context window. 

Because a resume is relatively short, we send the **entire text** of the resume and the job description directly into the system prompt. This is actually **more accurate** than RAG for this specific use case because the AI has a complete, holistic view of the candidate's background without risking "missing" a key detail during a retrieval step.

---

## 🛠️ Tech Stack Summary

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React, Vite, React Router, Web Audio API |
| **Backend** | Node.js, Express, WebSockets (ws) |
| **AI Voice** | Deepgram Agent API (Nova-3, GPT-4o-mini, Aura-2) |
| **AI Eval** | Ollama (Gemma-3) |
| **Data** | PDF-Parse, ExcelJS |
