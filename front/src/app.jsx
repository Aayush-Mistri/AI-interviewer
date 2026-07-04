import { useRef, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link } from "react-router-dom";

const AGENT_WS_URL = import.meta.env.VITE_AGENT_WS_URL || "ws://localhost:3001";
const API_URL = import.meta.env.VITE_API_URL || AGENT_WS_URL.replace(/^ws/, "http");

// --- Hardcoded Jobs ---
const JOBS = [
  {
    id: "ai-eng",
    role: "AI Engineer",
    description: "Build next-gen LLM applications, optimize RAG pipelines, and implement cutting-edge agentic workflows.",
    requirements: ["PyTorch/TensorFlow", "LangChain/LlamaIndex", "Vector DBs", "Python"],
    gradient: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
  },
  {
    id: "py-intern",
    role: "Python Intern",
    description: "Develop backend services, automate workflows, and assist in API development using FastAPI and Django.",
    requirements: ["Python", "FastAPI", "SQL", "Git"],
    gradient: "linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)",
  },
  {
    id: "web-intern",
    role: "WebDev Intern",
    description: "Craft stunning user interfaces with React and Tailwind, and build scalable frontend architectures.",
    requirements: ["React", "Tailwind CSS", "TypeScript", "Next.js"],
    gradient: "linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)",
  },
];

// --- UI Components ---

const Button = ({ children, onClick, disabled, variant = "primary", style = {} }) => {
  const variants = {
    primary: { bg: "#fff", color: "#000", hover: "#e5e7eb" },
    secondary: { bg: "rgba(255,255,255,0.1)", color: "#fff", hover: "rgba(255,255,255,0.2)" },
    accent: { bg: "#6366f1", color: "#fff", hover: "#4f46e5" },
    danger: { bg: "#ef4444", color: "#fff", hover: "#dc2626" },
  };
  const v = variants[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "#334155" : v.bg,
        color: disabled ? "#94a3b8" : v.color,
        border: "none",
        padding: "12px 24px",
        borderRadius: "12px",
        fontSize: "16px",
        fontWeight: "600",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s ease",
        ...style,
      }}
    >
      {children}
    </button>
  );
};

const Card = ({ children, style = {} }) => (
  <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "24px", padding: "24px", backdropFilter: "blur(10px)", ...style }}>
    {children}
  </div>
);

// --- Pages ---

function HomePage() {
  const navigate = useNavigate();
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logo}>Talent<span style={{color: '#6366f1'}}>AI</span></h1>
        <p style={styles.tagline}>The future of technical hiring is here.</p>
      </header>
      <div style={styles.jobGrid}>
        {JOBS.map((job) => (
          <Card key={job.id} style={{...styles.jobCard, position: 'relative', overflow: 'hidden'}}>
            <div style={{...styles.gradientBar, background: job.gradient}} />
            <h2 style={styles.jobRole}>{job.role}</h2>
            <p style={styles.jobDesc}>{job.description}</p>
            <div style={styles.reqs}>
              {job.requirements.map(req => <span key={req} style={styles.reqBadge}>{req}</span>)}
            </div>
            <Button variant="primary" onClick={() => navigate(`/apply/${job.id}`)} style={{ marginTop: 20, width: '100%' }}>
              Apply Now
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function UploadPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [resumeFile, setResumeFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resumeSession, setResumeSession] = useState(null);

  const selectedJob = JOBS.find(j => j.id === jobId);

  async function uploadResume() {
    setError("");
    setNotice("");
    if (!resumeFile) {
      setError("Please choose a PDF resume first.");
      return;
    }
    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jobRole", selectedJob.role);

    try {
      setUploading(true);
      const response = await fetch(`${API_URL}/resume`, { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not process resume.");
      setResumeSession(data);
      setNotice(`Resume processed for ${data.candidateName}.`);
    } catch (err) {
      setError(err.message || "Could not upload resume.");
    } finally {
      setUploading(false);
    }
  }

  if (!selectedJob) return <div style={styles.container}>Job not found.</div>;

  return (
    <div style={styles.container}>
      <Button variant="secondary" onClick={() => navigate("/")} style={{marginBottom: 20}}>← Back to Jobs</Button>
      <Card style={styles.centerCard}>
        <h2 style={styles.title}>Apply for {selectedJob.role}</h2>
        <p style={styles.subtitle}>Upload your resume to start the AI-powered interview.</p>
        <div style={styles.uploadBox}>
          <input type="file" accept="application/pdf" onChange={(e) => setResumeFile(e.target.files[0])} style={styles.fileInput} />
          <Button variant="accent" onClick={uploadResume} disabled={!resumeFile || uploading}>
            {uploading ? "Processing..." : "Verify Resume"}
          </Button>
        </div>
        {error && <p style={styles.errorText}>{error}</p>}
        {notice && <p style={styles.successText}>{notice}</p>}
        {resumeSession && (
          <div style={styles.readyState}>
            <p>✅ Resume verified for <strong>{resumeSession.candidateName}</strong></p>
            <Button variant="primary" onClick={() => navigate(`/interview/${resumeSession.sessionId}`)} style={{marginTop: 20, width: '100%'}}>
              Enter Interview Room
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function InterviewPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const wsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const streamRef = useRef(null);
  const playTimeRef = useRef(0);
  const evaluationRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [timeLeft, setTimeLeft] = useState(120);
  const [stopping, setStopping] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const transcriptTurnsRef = useRef([]);

  // Find job via session (In a real app, this would come from backend)
  // For this prototype, we'll assume the session is associated with a job
  const [jobRole, setJobRole] = useState("General Role");

  useEffect(() => {
    let timer;
    if (connected && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && connected) {
      stopInterview();
    }
    return () => clearInterval(timer);
  }, [connected, timeLeft]);

  async function startInterview() {
    transcriptTurnsRef.current = [];
    setEvaluation(null);
    evaluationRef.current = null;
    setNotice("");
    setError("");
    setTimeLeft(120);

    const wsUrl = `${AGENT_WS_URL}${AGENT_WS_URL.includes("?") ? "&" : "?"}sessionId=${encodeURIComponent(sessionId)}`;
    const ws = new WebSocket(wsUrl);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = async () => {
      try {
        setConnected(true);
        await startMic();
      } catch (err) {
        setError(err.message || "Microphone access denied.");
        ws.close();
      }
    };

    ws.onmessage = async (event) => {
      if (typeof event.data === "string") {
        const msg = safeParseEvent(event.data);
        setEvents((prev) => [...prev.slice(-15), msg]);

        if (msg.type === "ConversationText" && msg.role && msg.content) {
          transcriptTurnsRef.current.push({ speaker: msg.role === "assistant" ? "Interviewer" : "You", text: msg.content });
        }

        if (msg.type === "EvaluationSaved") {
          setEvaluation(msg);
          evaluationRef.current = msg;
          // Automatically navigate to evaluation after a short delay if not already there
          setTimeout(() => navigate(`/evaluation/${sessionId}`), 2000);
        }

        if (msg.type === "Error") setError(msg.message);
      } else {
        playPCM(event.data);
      }
    };

    ws.onclose = async () => {
      setConnected(false);
      setStopping(false);
      stopMic();
      if (!evaluationRef.current) {
        await fetchEvaluation(sessionId);
      }
    };
  }

  async function fetchEvaluation(sid) {
    try {
      const res = await fetch(`${API_URL}/evaluation/${encodeURIComponent(sid)}`);
      const data = await res.json();
      if (res.ok) {
        setEvaluation(data);
        evaluationRef.current = data;
        navigate(`/evaluation/${sid}`);
      } else if (res.status === 404) {
        // Retry a few times if 404 (evaluation might still be processing)
        setTimeout(() => fetchEvaluation(sid), 2000);
      }
    } catch (e) {
      console.error("Fetch error", e);
    }
  }

  function safeParseEvent(data) {
    try { return JSON.parse(data); } catch { return { type: "Message", message: data }; }
  }

  async function startMic() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const audioCtx = new AudioContext({ sampleRate: 16000 });
    audioCtxRef.current = audioCtx;
    const source = audioCtx.createMediaStreamSource(stream);
    sourceRef.current = source;
    const processor = audioCtx.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;
    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const pcm16 = floatTo16BitPCM(input);
      if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(pcm16);
    };
    source.connect(processor);
    processor.connect(audioCtx.destination);
  }

  function floatTo16BitPCM(float32Array) {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }
    return buffer;
  }

  function playPCM(arrayBuffer) {
    const audioCtx = audioCtxRef.current || new AudioContext({ sampleRate: 24000 });
    const pcm16 = new Int16Array(arrayBuffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768;
    const audioBuffer = audioCtx.createBuffer(1, float32.length, 24000);
    audioBuffer.copyToChannel(float32, 0);
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    const startAt = Math.max(audioCtx.currentTime, playTimeRef.current);
    source.start(startAt);
    playTimeRef.current = startAt + audioBuffer.duration;
  }

  function stopMic() {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }

  function stopInterview() {
    setStopping(true);
    stopMic();
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "EndInterview" }));
    } else {
      wsRef.current?.close();
    }
  }

  useEffect(() => {
    startInterview();
  }, []);

  return (
    <div style={styles.container}>
      <Card style={styles.interviewCard}>
        <div style={styles.statusHeader}>
          <div style={styles.statusDot}>
            <span style={styles.dot} />
            <span>LIVE: {timeLeft > 0 ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}` : '0:00'}</span>
          </div>
          <Button variant="danger" onClick={stopInterview} disabled={stopping}>
            {stopping ? "Scoring..." : "End Interview"}
          </Button>
        </div>

        <div style={styles.visualizer}>
          <div style={styles.aiAvatar}>
            <div style={styles.pulseRing} />
            <div style={styles.aiCore} />
          </div>
          <h3 style={styles.visualizerText}>{stopping ? "Calculating score..." : "AI is listening..."}</h3>
        </div>

        <div style={styles.logBox}>
          {events.length > 0 ? (
            events.map((e, i) => {
              let msg = "System";
              let role = "SYS";
              if (typeof e === 'object') {
                if (e.type === 'ConversationText') {
                  msg = e.content;
                  role = e.role === 'assistant' ? 'AI' : 'YOU';
                } else {
                  msg = JSON.stringify(e);
                  role = 'EVENT';
                }
              } else {
                msg = e;
              }
              return (
                <div key={i} style={styles.logEntry}>
                  <span style={styles.logTimestamp}>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                  <span style={styles.logRole}>[{role}]</span>
                  <span style={styles.logMsg}>{msg}</span>
                </div>
              );
            })
          ) : (
            <p style={styles.emptyLog}>Waiting for conversation to begin...</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function EvaluationPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getEval() {
      try {
        const res = await fetch(`${API_URL}/evaluation/${encodeURIComponent(sessionId)}`);
        const data = await res.json();
        if (res.ok) {
          setEvaluation(data);
        } else if (res.status === 404) {
          setTimeout(getEval, 2000);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    getEval();
  }, [sessionId]);

  if (loading) return <div style={styles.container}>Loading evaluation...</div>;

  return (
    <div style={styles.container}>
      <Card style={styles.centerCard}>
        <div style={styles.scoreCircle}>
          <span style={styles.scoreValue}>{evaluation?.score || 0}</span>
          <span style={styles.scoreMax}>/ 100</span>
        </div>
        <h2 style={styles.title}>Interview Result</h2>
        <div style={styles.evalDetails}>
          <div style={styles.evalItem}><strong>Questions:</strong> {evaluation?.questionsAnswered}/5</div>
          <div style={styles.evalItem}><strong>Status:</strong> Complete</div>
        </div>
        {evaluation?.notes && <p style={styles.notesText}>{evaluation.notes}</p>}
        <Button variant="primary" onClick={() => navigate("/")} style={{marginTop: 30, width: '100%'}}>
          Return Home
        </Button>
      </Card>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/apply/:jobId" element={<UploadPage />} />
        <Route path="/interview/:sessionId" element={<InterviewPage />} />
        <Route path="/evaluation/:sessionId" element={<EvaluationPage />} />
      </Routes>
    </BrowserRouter>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#000",
    color: "#fff",
    fontFamily: "'Inter', system-ui, sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
  },
  header: { textAlign: "center", marginBottom: "60px" },
  logo: { fontSize: "48px", fontWeight: "800", margin: 0, letterSpacing: "-2px" },
  tagline: { color: "#94a3b8", fontSize: "20px", marginTop: "10px" },
  jobGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px", width: "100%", maxWidth: "1100px" },
  jobCard: { position: "relative", overflow: "hidden", transition: "transform 0.3s ease" },
  gradientBar: { height: "6px", width: "100%", position: "absolute", top: 0, left: 0 },
  jobRole: { fontSize: "24px", fontWeight: "700", margin: "0 0 12px 0" },
  jobDesc: { color: "#94a3b8", fontSize: "15px", lineHeight: "1.6", marginBottom: "20px" },
  reqs: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" },
  reqBadge: { background: "rgba(255,255,255,0.1)", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", color: "#cbd5e1" },
  centerCard: { maxWidth: "500px", width: "100%", textAlign: "center" },
  title: { fontSize: "32px", fontWeight: "800", marginBottom: "8px" },
  subtitle: { color: "#94a3b8", marginBottom: "30px" },
  uploadBox: { display: "flex", flexDirection: "column", gap: "20px", marginBottom: "20px" },
  fileInput: { background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.2)", padding: "20px", borderRadius: "16px", color: "#fff", cursor: "pointer" },
  errorText: { color: "#ef4444", fontSize: "14px", marginTop: "10px" },
  successText: { color: "#22c55e", fontSize: "14px", marginTop: "10px" },
  readyState: { marginTop: "30px", padding: "20px", background: "rgba(34, 197, 94, 0.1)", borderRadius: "16px", border: "1px solid rgba(34, 197, 94, 0.2)" },
  interviewCard: { width: "100%", maxWidth: "900px", display: "flex", flexDirection: "column" },
  statusHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" },
  statusDot: { display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: "600", color: "#22c55e" },
  dot: { width: "8px", height: "8px", background: "#22c55e", borderRadius: "50%", boxShadow: "0 0 10px #22c55e" },
  timerText: { marginLeft: "10px", fontFamily: "monospace", color: "#fff", background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: "4px" },
  visualizer: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0" },
  aiAvatar: { position: "relative", width: "120px", height: "120px", display: "flex", justifyContent: "center", alignItems: "center" },
  aiCore: { width: "60px", height: "60px", background: "linear-gradient(135deg, #6366f1, #a855f7)", borderRadius: "50%", zIndex: 2, boxShadow: "0 0 30px rgba(99, 102, 241, 0.6)" },
  pulseRing: { position: "absolute", width: "100%", height: "100%", border: "2px solid #6366f1", borderRadius: "50%", animation: "pulse 2s infinite" },
  visualizerText: { marginTop: "30px", fontSize: "20px", fontWeight: "500", color: "#94a3b8" },
  logBox: { background: "#000", padding: "20px", borderRadius: "16px", height: "200px", overflowY: "auto", fontSize: "13px", fontFamily: "monospace", border: "1px solid rgba(255,255,255,0.1)" },
  logEntry: { display: "flex", gap: "10px", marginBottom: "6px" },
  logTimestamp: { color: "#475569" },
  logRole: { color: "#6366f1", fontWeight: "bold" },
  logMsg: { color: "#cbd5e1" },
  emptyLog: { color: "#475569", textAlign: "center", marginTop: "80px" },
  scoreCircle: { width: "150px", height: "150px", borderRadius: "50%", border: "8px solid #6366f1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", margin: "0 auto 30px", boxShadow: "0 0 30px rgba(99, 102, 241, 0.3)" },
  scoreValue: { fontSize: "48px", fontWeight: "800" },
  scoreMax: { fontSize: "18px", color: "#94a3b8" },
  evalDetails: { display: "flex", justifyContent: "center", gap: "20px", marginBottom: "20px" },
  evalItem: { background: "rgba(255,255,255,0.05)", padding: "10px 20px", borderRadius: "12px", fontSize: "14px" },
  notesText: { color: "#94a3b8", fontSize: "15px", lineHeight: "1.6", fontStyle: "italic" },
};
