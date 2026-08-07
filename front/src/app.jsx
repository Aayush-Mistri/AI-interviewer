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
    gradient: "linear-gradient(135deg, #111 0%, #555 100%)",
  },
  {
    id: "py-intern",
    role: "Python Intern",
    description: "Develop backend services, automate workflows, and assist in API development using FastAPI and Django.",
    requirements: ["Python", "FastAPI", "SQL", "Git"],
    gradient: "linear-gradient(135deg, #222 0%, #777 100%)",
  },
  {
    id: "web-intern",
    role: "WebDev Intern",
    description: "Craft stunning user interfaces with React and Tailwind, and build scalable frontend architectures.",
    requirements: ["React", "Tailwind CSS", "TypeScript", "Next.js"],
    gradient: "linear-gradient(135deg, #333 0%, #999 100%)",
  },
];

// --- UI Components ---

const Button = ({ children, onClick, disabled, variant = "primary", style = {} }) => {
  const variants = {
    primary: { bg: "linear-gradient(135deg, #111 0%, #444 100%)", color: "#fff", hover: "#e5e5e5" },
    secondary: { bg: "rgba(255,255,255,0.55)", color: "#222", hover: "rgba(255,255,255,0.72)" },
    accent: { bg: "linear-gradient(135deg, #111 0%, #444 100%)", color: "#fff", hover: "#333" },
    danger: { bg: "#222", color: "#fff", hover: "#111" },
  };
  const v = variants[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "#444" : v.bg,
        color: disabled ? "#aaa" : v.color,
        border: variant === "secondary" ? "1px solid rgba(255,255,255,0.72)" : "1px solid rgba(255,255,255,0.36)",
        padding: "12px 24px",
        borderRadius: "999px",
        fontSize: "16px",
        fontWeight: "750",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s ease",
        boxShadow: disabled ? "none" : "0 14px 30px rgba(0, 0, 0, 0.15)",
        backdropFilter: "blur(12px)",
        ...style,
      }}
    >
      {children}
    </button>
  );
};

const Card = ({ children, style = {} }) => (
  <div style={{ background: "rgba(255, 255, 255, 0.52)", border: "1px solid rgba(255, 255, 255, 0.76)", borderRadius: "28px", padding: "26px", boxShadow: "0 18px 48px rgba(0, 0, 0, 0.12)", backdropFilter: "blur(22px)", ...style }}>
    {children}
  </div>
);

// --- Pages ---

function HomePage() {
  const navigate = useNavigate();
  return (
    <div style={{ ...styles.container, ...styles.homeContainer }}>
      <div style={styles.homeShell}>
        <nav style={styles.nav}>
          <h1 style={styles.logo}>AI Interviewer</h1>
          <span style={styles.navPill}>AI interview screening</span>
        </nav>

        <section style={styles.hero}>
          <div style={styles.heroCopy}>
            <span style={styles.eyebrow}>Minimal hiring workflow</span>
            <h2 style={styles.heroTitle}>Find your next role with a focused AI interview.</h2>
            <p style={styles.tagline}>
              Pick a position, upload your resume, and move into a guided technical interview in minutes.
            </p>
          </div>
          <div style={styles.heroPanel}>
            <div style={styles.heroMetric}>
              <span style={styles.metricValue}>3</span>
              <span style={styles.metricLabel}>open roles</span>
            </div>
            <div style={styles.heroMetric}>
              <span style={styles.metricValue}>2m</span>
              <span style={styles.metricLabel}>setup time</span>
            </div>
          </div>
        </section>

        <div style={styles.jobGrid}>
          {JOBS.map((job) => (
            <Card key={job.id} style={{...styles.jobCard, position: 'relative', overflow: 'hidden'}}>
              <div style={{...styles.gradientBar, background: job.gradient}} />
              <h2 style={styles.jobRole}>{job.role}</h2>
              <p style={styles.jobDesc}>{job.description}</p>
              <div style={styles.reqs}>
                {job.requirements.map(req => <span key={req} style={styles.reqBadge}>{req}</span>)}
              </div>
              <Button variant="primary" onClick={() => navigate(`/apply/${job.id}`)} style={{ marginTop: "auto", width: '100%' }}>
                Apply Now
              </Button>
            </Card>
          ))}
        </div>
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
    background: "#f7f7f7",
    color: "#222",
    fontFamily: "'Inter', system-ui, sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
  },
  homeContainer: {
    background:
      "radial-gradient(circle at 12% 18%, rgba(255, 255, 255, 0.74), transparent 28%), radial-gradient(circle at 88% 8%, rgba(0, 0, 0, 0.08), transparent 26%), linear-gradient(135deg, #fff 0%, #f4f4f4 46%, #e9e9e9 100%)",
    color: "#222",
    alignItems: "stretch",
    justifyContent: "flex-start",
  },
  homeShell: { width: "100%", maxWidth: "1120px", margin: "0 auto" },
  nav: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "58px",
  },
  navPill: {
    background: "rgba(255, 255, 255, 0.58)",
    border: "1px solid rgba(255, 255, 255, 0.76)",
    borderRadius: "999px",
    color: "#555",
    fontSize: "13px",
    fontWeight: "700",
    padding: "10px 16px",
    boxShadow: "0 12px 34px rgba(0, 0, 0, 0.08)",
    backdropFilter: "blur(18px)",
  },
  header: { textAlign: "center", marginBottom: "60px" },
  logo: { fontSize: "34px", fontWeight: "800", margin: 0, letterSpacing: "0" },
  hero: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
    alignItems: "stretch",
    marginBottom: "28px",
  },
  heroCopy: {
    background: "rgba(255, 255, 255, 0.56)",
    border: "1px solid rgba(255, 255, 255, 0.78)",
    borderRadius: "32px",
    padding: "32px",
    boxShadow: "0 24px 70px rgba(0, 0, 0, 0.12)",
    backdropFilter: "blur(22px)",
  },
  eyebrow: {
    color: "#666",
    fontSize: "13px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0",
  },
  heroTitle: {
    maxWidth: "760px",
    fontSize: "42px",
    lineHeight: "1.08",
    fontWeight: "850",
    margin: "18px 0 18px",
    letterSpacing: "0",
    color: "#111",
  },
  tagline: { color: "#555", fontSize: "18px", lineHeight: "1.7", margin: 0, maxWidth: "680px" },
  heroPanel: {
    display: "grid",
    gap: "16px",
  },
  heroMetric: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    background: "rgba(255, 255, 255, 0.52)",
    border: "1px solid rgba(255, 255, 255, 0.78)",
    borderRadius: "28px",
    padding: "28px",
    boxShadow: "0 18px 45px rgba(0, 0, 0, 0.1)",
    backdropFilter: "blur(20px)",
  },
  metricValue: { color: "#111", fontSize: "44px", lineHeight: 1, fontWeight: "850" },
  metricLabel: { color: "#666", fontSize: "14px", fontWeight: "700", marginTop: "8px" },
  jobGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px", width: "100%" },
  jobCard: {
    position: "relative",
    overflow: "hidden",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    minHeight: "300px",
    display: "flex",
    flexDirection: "column",
  },
  gradientBar: { height: "5px", width: "100%", position: "absolute", top: 0, left: 0, opacity: 0.78 },
  jobRole: { color: "#111", fontSize: "24px", fontWeight: "800", margin: "10px 0 12px 0", letterSpacing: "0" },
  jobDesc: { color: "#555", fontSize: "15px", lineHeight: "1.65", marginBottom: "20px" },
  reqs: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" },
  reqBadge: { background: "rgba(255,255,255,0.62)", border: "1px solid rgba(255,255,255,0.74)", padding: "7px 11px", borderRadius: "999px", fontSize: "12px", color: "#555", fontWeight: "700" },
  centerCard: { maxWidth: "500px", width: "100%", textAlign: "center" },
  title: { fontSize: "32px", fontWeight: "800", marginBottom: "8px" },
  subtitle: { color: "#777", marginBottom: "30px" },
  uploadBox: { display: "flex", flexDirection: "column", gap: "20px", marginBottom: "20px" },
  fileInput: { background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.2)", padding: "20px", borderRadius: "16px", color: "#fff", cursor: "pointer" },
  errorText: { color: "#111", fontSize: "14px", marginTop: "10px" },
  successText: { color: "#111", fontSize: "14px", marginTop: "10px" },
  readyState: { marginTop: "30px", padding: "20px", background: "rgba(0, 0, 0, 0.06)", borderRadius: "16px", border: "1px solid rgba(0, 0, 0, 0.14)" },
  interviewCard: { width: "100%", maxWidth: "900px", display: "flex", flexDirection: "column" },
  statusHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" },
  statusDot: { display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: "600", color: "#111" },
  dot: { width: "8px", height: "8px", background: "#111", borderRadius: "50%", boxShadow: "0 0 10px rgba(0, 0, 0, 0.45)" },
  timerText: { marginLeft: "10px", fontFamily: "monospace", color: "#fff", background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: "4px" },
  visualizer: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0" },
  aiAvatar: { position: "relative", width: "120px", height: "120px", display: "flex", justifyContent: "center", alignItems: "center" },
  aiCore: { width: "60px", height: "60px", background: "linear-gradient(135deg, #111, #555)", borderRadius: "50%", zIndex: 2, boxShadow: "0 0 30px rgba(0, 0, 0, 0.35)" },
  pulseRing: { position: "absolute", width: "100%", height: "100%", border: "2px solid #111", borderRadius: "50%", animation: "pulse 2s infinite" },
  visualizerText: { marginTop: "30px", fontSize: "20px", fontWeight: "500", color: "#777" },
  logBox: { background: "#000", padding: "20px", borderRadius: "16px", height: "200px", overflowY: "auto", fontSize: "13px", fontFamily: "monospace", border: "1px solid rgba(255,255,255,0.1)" },
  logEntry: { display: "flex", gap: "10px", marginBottom: "6px" },
  logTimestamp: { color: "#777" },
  logRole: { color: "#fff", fontWeight: "bold" },
  logMsg: { color: "#ddd" },
  emptyLog: { color: "#777", textAlign: "center", marginTop: "80px" },
  scoreCircle: { width: "150px", height: "150px", borderRadius: "50%", border: "8px solid #111", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", margin: "0 auto 30px", boxShadow: "0 0 30px rgba(0, 0, 0, 0.24)" },
  scoreValue: { fontSize: "48px", fontWeight: "800" },
  scoreMax: { fontSize: "18px", color: "#777" },
  evalDetails: { display: "flex", justifyContent: "center", gap: "20px", marginBottom: "20px" },
  evalItem: { background: "rgba(255,255,255,0.05)", padding: "10px 20px", borderRadius: "12px", fontSize: "14px" },
  notesText: { color: "#777", fontSize: "15px", lineHeight: "1.6", fontStyle: "italic" },
};
