import { useRef, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link } from "react-router-dom";

const AGENT_WS_URL = import.meta.env.VITE_AGENT_WS_URL || "ws://localhost:3001";
const API_URL = import.meta.env.VITE_API_URL || AGENT_WS_URL.replace(/^ws/, "http");

// --- Default Hardcoded Jobs ---
const DEFAULT_JOBS = [
  {
    id: "ai-eng",
    role: "AI Engineer",
    companyName: "TalentAI Labs",
    description: "Build next-gen LLM applications, optimize RAG pipelines, and implement cutting-edge agentic workflows.",
    requirements: ["PyTorch/TensorFlow", "LangChain/LlamaIndex", "Vector DBs", "Python"],
    gradient: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
  },
  {
    id: "py-intern",
    role: "Python Intern",
    companyName: "Core Backend Systems",
    description: "Develop backend services, automate workflows, and assist in API development using FastAPI and Django.",
    requirements: ["Python", "FastAPI", "SQL", "Git"],
    gradient: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)",
  },
  {
    id: "web-intern",
    role: "WebDev Intern",
    companyName: "PixelCraft UI",
    description: "Craft stunning user interfaces with React and Tailwind, and build scalable frontend architectures.",
    requirements: ["React", "Tailwind CSS", "TypeScript", "Next.js"],
    gradient: "linear-gradient(135deg, #064e3b 0%, #047857 100%)",
  },
];

// Helper to get stored auth user
const getStoredUser = () => {
  try {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

// --- UI Components ---

const Button = ({ children, onClick, disabled, variant = "primary", style = {}, type = "button" }) => {
  const variants = {
    primary: { bg: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#f8fafc", border: "1px solid rgba(255,255,255,0.2)" },
    secondary: { bg: "rgba(255,255,255,0.75)", color: "#0f172a", border: "1px solid rgba(0,0,0,0.12)" },
    accent: { bg: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", color: "#ffffff", border: "none" },
    danger: { bg: "#dc2626", color: "#ffffff", border: "none" },
  };
  const v = variants[variant] || variants.primary;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "#94a3b8" : v.bg,
        color: disabled ? "#f1f5f9" : v.color,
        border: v.border,
        padding: "10px 22px",
        borderRadius: "999px",
        fontSize: "15px",
        fontWeight: "700",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: disabled ? "none" : "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
        backdropFilter: "blur(12px)",
        ...style,
      }}
    >
      {children}
    </button>
  );
};

const Card = ({ children, style = {} }) => (
  <div style={{ background: "rgba(255, 255, 255, 0.72)", border: "1px solid rgba(255, 255, 255, 0.85)", borderRadius: "24px", padding: "26px", boxShadow: "0 20px 50px -12px rgba(15, 23, 42, 0.08)", backdropFilter: "blur(24px)", ...style }}>
    {children}
  </div>
);

function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser());

  useEffect(() => {
    const handleStorage = () => setUser(getStoredUser());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    window.dispatchEvent(new Event("storage"));
    navigate("/");
  };

  return (
    <nav style={styles.nav}>
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
          <h1 style={styles.logo}>Talent<span style={{ color: "#2563eb" }}>AI</span></h1>
        </Link>
        <div style={{ display: "flex", gap: "16px" }}>
          <Link to="/" style={styles.navLink}>Jobs</Link>
          <Link to="/leaderboard" style={styles.navLink}>Leaderboard 🏆</Link>
          {user?.isCompany && (
            <Link to="/post-job" style={{ ...styles.navLink, color: "#2563eb", fontWeight: "700" }}>
              + Post a Job
            </Link>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
              {user.isCompany ? `🏢 ${user.companyName || user.name}` : `👤 ${user.name}`}
            </span>
            <Button variant="secondary" onClick={handleLogout} style={{ padding: "8px 16px", fontSize: "13px" }}>
              Logout
            </Button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "8px" }}>
            <Button variant="secondary" onClick={() => navigate("/login")} style={{ padding: "8px 16px", fontSize: "13px" }}>
              Login
            </Button>
            <Button variant="primary" onClick={() => navigate("/signup")} style={{ padding: "8px 16px", fontSize: "13px" }}>
              Sign Up
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}

// --- Pages ---

function HomePage() {
  const navigate = useNavigate();
  const [allJobs, setAllJobs] = useState(DEFAULT_JOBS);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch(`${API_URL}/api/jobs`);
        const data = await res.json();
        if (data?.jobs?.length) {
          setAllJobs([...data.jobs, ...DEFAULT_JOBS]);
        }
      } catch (e) {
        console.error("Could not fetch custom jobs", e);
      }
    }
    fetchJobs();
  }, []);

  return (
    <div style={{ ...styles.container, ...styles.homeContainer }}>
      <div style={styles.homeShell}>
        <Header />

        <section style={styles.hero}>
          <div style={styles.heroCopy}>
            <span style={styles.eyebrow}>AI-Powered Hiring & Screening Platform</span>
            <h2 style={styles.heroTitle}>Hire top 1% talent with automated, voice-led AI interviews.</h2>
            <p style={styles.tagline}>
              Companies post positions with candidate criteria. Candidates complete a 2-minute voice interview with live AI, and rankings appear on the verified candidate leaderboard.
            </p>
          </div>
          <div style={styles.heroPanel}>
            <div style={styles.heroMetric}>
              <span style={styles.metricValue}>{allJobs.length}</span>
              <span style={styles.metricLabel}>active job postings</span>
            </div>
            <div style={styles.heroMetric}>
              <span style={styles.metricValue}>100%</span>
              <span style={styles.metricLabel}>AI voice screening</span>
            </div>
          </div>
        </section>

        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Explore Open Positions</h3>
          <span style={styles.sectionSubtitle}>Select a job to start your instant screening session</span>
        </div>

        <div style={styles.jobGrid}>
          {allJobs.map((job) => (
            <Card key={job.id} style={styles.jobCard}>
              <div style={{ ...styles.gradientBar, background: job.gradient || "linear-gradient(135deg, #0f172a, #334155)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h2 style={styles.jobRole}>{job.role}</h2>
                <span style={styles.companyBadge}>{job.companyName || job.companyDetails?.name || "Company"}</span>
              </div>
              <p style={styles.jobDesc}>{job.description}</p>
              <div style={styles.reqs}>
                {(Array.isArray(job.requirements) ? job.requirements : [job.requirements]).map(req => (
                  <span key={req} style={styles.reqBadge}>{req}</span>
                ))}
              </div>
              <Button variant="primary" onClick={() => navigate(`/apply/${job.id}`)} style={{ marginTop: "auto", width: '100%' }}>
                Apply & Take Interview
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    if (e) e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed.");

      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("storage"));
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <Button variant="secondary" onClick={() => navigate("/")} style={{ marginBottom: 20 }}>
        ← Back to Home
      </Button>
      <Card style={styles.centerCard}>
        <h2 style={styles.title}>Welcome Back</h2>
        <p style={styles.subtitle}>Enter your credentials to access your TalentAI account.</p>
        <form onSubmit={handleLogin} style={styles.formBox}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          {error && <p style={styles.errorText}>{error}</p>}
          <Button variant="accent" onClick={handleLogin} disabled={loading} style={{ width: "100%", marginTop: "10px" }}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
        <p style={{ marginTop: "20px", fontSize: "14px", color: "#64748b" }}>
          Don't have an account? <Link to="/signup" style={{ color: "#2563eb", fontWeight: "bold" }}>Sign up</Link>
        </p>
      </Card>
    </div>
  );
}

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isCompany, setIsCompany] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e) {
    if (e) e.preventDefault();
    setError("");
    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (isCompany && !companyName) {
      setError("Company Name is required for company accounts.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, isCompany, companyName, companyDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed.");

      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("storage"));
      navigate(data.user.isCompany ? "/post-job" : "/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <Button variant="secondary" onClick={() => navigate("/")} style={{ marginBottom: 20 }}>
        ← Back to Home
      </Button>
      <Card style={{ ...styles.centerCard, maxWidth: "540px" }}>
        <h2 style={styles.title}>Create an Account</h2>
        <p style={styles.subtitle}>Join TalentAI as a candidate or a hiring company.</p>

        {/* Are you a company selector */}
        <div style={styles.roleToggleBox}>
          <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>Are you a company?</span>
          <label style={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={isCompany}
              onChange={(e) => setIsCompany(e.target.checked)}
              style={{ cursor: "pointer", width: "18px", height: "18px" }}
            />
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>
              Yes, I want to post jobs & hire talent
            </span>
          </label>
        </div>

        <form onSubmit={handleSignup} style={styles.formBox}>
          <input
            type="text"
            placeholder={isCompany ? "Contact Person Name" : "Full Name"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="email"
            placeholder="Work / Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />

          {isCompany && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "rgba(37, 99, 235, 0.05)", padding: "16px", borderRadius: "16px", border: "1px solid rgba(37, 99, 235, 0.15)" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#2563eb", textAlign: "left" }}>🏢 Company Profile Details</span>
              <input
                type="text"
                placeholder="Company / Organization Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                style={styles.input}
                required
              />
              <textarea
                placeholder="Brief description of your company & domain..."
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                style={{ ...styles.input, height: "70px", resize: "none" }}
              />
            </div>
          )}

          {error && <p style={styles.errorText}>{error}</p>}
          <Button variant="accent" onClick={handleSignup} disabled={loading} style={{ width: "100%", marginTop: "10px" }}>
            {loading ? "Creating Account..." : isCompany ? "Sign Up as Hiring Company" : "Sign Up as Candidate"}
          </Button>
        </form>
        <p style={{ marginTop: "20px", fontSize: "14px", color: "#64748b" }}>
          Already have an account? <Link to="/login" style={{ color: "#2563eb", fontWeight: "bold" }}>Login</Link>
        </p>
      </Card>
    </div>
  );
}

function CompanyJobPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [role, setRole] = useState("");
  const [companyName, setCompanyName] = useState(user?.companyName || "");
  const [companyDescription, setCompanyDescription] = useState(user?.companyDescription || "");
  const [requirements, setRequirements] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmitJob(e) {
    if (e) e.preventDefault();
    setError("");
    setNotice("");

    if (!role.trim()) {
      setError("Please enter a role title.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          companyName: companyName || user?.name || "Partner Company",
          companyDescription,
          requirements: requirements.split(",").map(s => s.trim()).filter(Boolean),
          postedBy: user?.name || "Company"
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not post job.");

      setNotice("Job posted successfully! AI will now use this candidate criteria during interviews.");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <Button variant="secondary" onClick={() => navigate("/")} style={{ marginBottom: 20 }}>
        ← Back to Jobs
      </Button>
      <Card style={{ ...styles.centerCard, maxWidth: "600px", textAlign: "left" }}>
        <h2 style={{ ...styles.title, textAlign: "center" }}>Post a Job Position</h2>
        <p style={{ ...styles.subtitle, textAlign: "center" }}>
          Define role requirements so the AI Interviewer asks targeted, correlation questions.
        </p>

        <form onSubmit={handleSubmitJob} style={styles.formBox}>
          <div>
            <label style={styles.fieldLabel}>Job / Role Title *</label>
            <input
              type="text"
              placeholder="e.g. Senior Frontend Engineer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div>
            <label style={styles.fieldLabel}>Company Name</label>
            <input
              type="text"
              placeholder="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.fieldLabel}>Company Details / Domain</label>
            <textarea
              placeholder="Describe company product, stack, or mission..."
              value={companyDescription}
              onChange={(e) => setCompanyDescription(e.target.value)}
              style={{ ...styles.input, height: "70px", resize: "none" }}
            />
          </div>

          <div>
            <label style={styles.fieldLabel}>Ideal Candidate Criteria & Skills (comma separated)</label>
            <textarea
              placeholder="e.g. React, WebSockets, State Management, High-performance UI, 3+ years experience"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              style={{ ...styles.input, height: "80px", resize: "none" }}
            />
            <span style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", display: "block" }}>
              💡 The AI will synthesize these requirements to probe candidates on these exact domains.
            </span>
          </div>

          {error && <p style={styles.errorText}>{error}</p>}
          {notice && <p style={styles.successText}>{notice}</p>}

          <Button variant="accent" onClick={handleSubmitJob} disabled={loading} style={{ width: "100%", marginTop: "10px" }}>
            {loading ? "Posting Job..." : "Publish Job Posting"}
          </Button>
        </form>
      </Card>
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

  const [selectedJob, setSelectedJob] = useState(() => DEFAULT_JOBS.find(j => j.id === jobId));

  useEffect(() => {
    async function loadJobDetails() {
      if (!selectedJob) {
        try {
          const res = await fetch(`${API_URL}/api/jobs`);
          const data = await res.json();
          const found = data?.jobs?.find(j => j.id === jobId);
          if (found) setSelectedJob(found);
        } catch (e) {
          console.error(e);
        }
      }
    }
    loadJobDetails();
  }, [jobId]);

  async function uploadResume() {
    setError("");
    setNotice("");
    if (!resumeFile) {
      setError("Please choose a PDF resume first.");
      return;
    }
    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jobRole", selectedJob?.role || "General Role");
    if (selectedJob?.id) formData.append("jobId", selectedJob.id);
    if (selectedJob?.companyName) formData.append("companyName", selectedJob.companyName);

    try {
      setUploading(true);
      const response = await fetch(`${API_URL}/resume`, { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not process resume.");
      setResumeSession(data);
      setNotice(`Resume processed for ${data.candidateName}. Camera and mic ready.`);
    } catch (err) {
      setError(err.message || "Could not upload resume.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={styles.container}>
      <Button variant="secondary" onClick={() => navigate("/")} style={{marginBottom: 20}}>← Back to Jobs</Button>
      <Card style={styles.centerCard}>
        <h2 style={styles.title}>Apply for {selectedJob?.role || "Position"}</h2>
        <p style={styles.subtitle}>Upload your PDF resume to start the AI technical voice screening.</p>
        <div style={styles.uploadBox}>
          <input type="file" accept="application/pdf" onChange={(e) => setResumeFile(e.target.files[0])} style={styles.fileInput} />
          <Button variant="accent" onClick={uploadResume} disabled={!resumeFile || uploading}>
            {uploading ? "Analyzing Resume..." : "Verify & Proceed"}
          </Button>
        </div>
        {error && <p style={styles.errorText}>{error}</p>}
        {notice && <p style={styles.successText}>{notice}</p>}
        {resumeSession && (
          <div style={styles.readyState}>
            <p>✅ Resume verified for <strong>{resumeSession.candidateName}</strong></p>
            <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
              🎥 Camera & Microphone will record during interview for evaluation export.
            </p>
            <Button variant="primary" onClick={() => navigate(`/interview/${resumeSession.sessionId}`)} style={{marginTop: 16, width: '100%'}}>
              Enter AI Interview Room
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
  const mediaRecorderRef = useRef(null);
  const videoChunksRef = useRef([]);
  const videoElementRef = useRef(null);
  const playTimeRef = useRef(0);
  const evaluationRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(120);
  const [stopping, setStopping] = useState(false);

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
    setEvents([]);
    setError("");
    setTimeLeft(120);

    const wsUrl = `${AGENT_WS_URL}${AGENT_WS_URL.includes("?") ? "&" : "?"}sessionId=${encodeURIComponent(sessionId)}`;
    const ws = new WebSocket(wsUrl);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = async () => {
      try {
        setConnected(true);
        await startMediaCapture();
      } catch (err) {
        setError(err.message || "Microphone / Camera access denied.");
        ws.close();
      }
    };

    ws.onmessage = async (event) => {
      if (typeof event.data === "string") {
        const msg = safeParseEvent(event.data);
        setEvents((prev) => [...prev.slice(-15), msg]);

        if (msg.type === "EvaluationSaved") {
          evaluationRef.current = msg;
          await uploadVideoBlob();
          navigate(`/evaluation/${sessionId}`);
        }

        if (msg.type === "Error") setError(msg.message);
      } else {
        playPCM(event.data);
      }
    };

    ws.onclose = async () => {
      setConnected(false);
      setStopping(false);
      stopMediaCapture();
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
        evaluationRef.current = data;
        await uploadVideoBlob();
        navigate(`/evaluation/${sid}`);
      } else if (res.status === 404) {
        setTimeout(() => fetchEvaluation(sid), 2000);
      }
    } catch (e) {
      console.error("Fetch evaluation error", e);
    }
  }

  async function uploadVideoBlob() {
    if (!videoChunksRef.current.length) return;
    const videoBlob = new Blob(videoChunksRef.current, { type: "video/webm" });
    const formData = new FormData();
    formData.append("video", videoBlob, `interview_${sessionId}.webm`);
    formData.append("sessionId", sessionId);

    try {
      await fetch(`${API_URL}/api/upload-video`, {
        method: "POST",
        body: formData,
      });
    } catch (err) {
      console.error("Video upload error:", err);
    }
  }

  function safeParseEvent(data) {
    try { return JSON.parse(data); } catch { return { type: "Message", message: data }; }
  }

  async function startMediaCapture() {
    // Request audio and video with compressed constraints (320x240, 15fps for minimal space)
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: { width: { max: 320 }, height: { max: 240 }, frameRate: { max: 15 } }
    });
    streamRef.current = stream;

    if (videoElementRef.current) {
      videoElementRef.current.srcObject = stream;
    }

    // Low bitrate MediaRecorder to ensure video is saved in least space possible
    try {
      videoChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 100000 // ~100 kbps for ultra lightweight video footprint
      });
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) videoChunksRef.current.push(e.data);
      };
      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
    } catch (e) {
      console.warn("Low bitrate media recorder fallback", e);
    }

    // Audio context for raw PCM sending
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

  function stopMediaCapture() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }

  function stopInterview() {
    setStopping(true);
    stopMediaCapture();
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "EndInterview" }));
      setTimeout(() => fetchEvaluation(sessionId), 1000);
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
            <span>LIVE INTERVIEW: {timeLeft > 0 ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}` : '0:00'}</span>
          </div>
          <Button variant="danger" onClick={stopInterview} disabled={stopping}>
            {stopping ? "Processing Video & Scoring..." : "End Interview"}
          </Button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: "20px", alignItems: "center", margin: "20px 0" }}>
          <div style={styles.visualizer}>
            <div style={styles.aiAvatar}>
              <div style={styles.pulseRing} />
              <div style={styles.aiCore} />
            </div>
            <h3 style={styles.visualizerText}>{stopping ? "Calculating evaluation..." : "AI Interviewer is speaking..."}</h3>
          </div>

          <div style={{ position: "relative", width: "180px", height: "135px", borderRadius: "16px", overflow: "hidden", background: "#000", border: "2px solid #2563eb" }}>
            <video ref={videoElementRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <span style={{ position: "absolute", bottom: "6px", left: "6px", background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: "10px", padding: "2px 6px", borderRadius: "4px" }}>
              REC 🔴 320p
            </span>
          </div>
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
            <p style={styles.emptyLog}>Initializing AI Interviewer connection...</p>
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
    let cancelled = false;
    let retryTimer;

    async function getEval() {
      try {
        const res = await fetch(`${API_URL}/evaluation/${encodeURIComponent(sessionId)}`);
        const data = await res.json();
        if (res.ok && !cancelled) {
          setEvaluation(data);
        } else if (res.status === 404) {
          retryTimer = setTimeout(getEval, 800);
        }
      } catch (e) {
        if (!cancelled) setLoading(false);
        return;
      }
      if (!cancelled) setLoading(false);
    }
    getEval();
    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
    };
  }, [sessionId]);

  if (loading || !evaluation) return <div style={styles.container}>Preparing your interview evaluation...</div>;

  return (
    <div style={styles.container}>
      <Card style={{ ...styles.centerCard, maxWidth: "680px" }}>
        <div style={styles.scoreCircle}>
          <span style={styles.scoreValue}>{evaluation?.score || 0}</span>
          <span style={styles.scoreMax}>/ 100</span>
        </div>
        <h2 style={styles.title}>Interview Result</h2>
        <div style={styles.evalDetails}>
          <div style={styles.evalItem}><strong>Questions Answered:</strong> {evaluation.questionsAnswered}/5</div>
          <div style={styles.evalItem}><strong>Status:</strong> Evaluated</div>
        </div>
        {evaluation.summary && <p style={styles.notesText}>{evaluation.summary}</p>}

        {evaluation.videoUrl && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <h4 style={{ fontSize: "14px", color: "#0f172a", marginBottom: "8px" }}>Recorded Interview Video</h4>
            <video src={`${API_URL}${evaluation.videoUrl}`} controls style={{ width: "100%", maxWidth: "360px", borderRadius: "12px", border: "1px solid #cbd5e1" }} />
          </div>
        )}

        {evaluation.scoreBreakdown && (
          <div style={styles.breakdown}>
            {Object.entries(evaluation.scoreBreakdown).map(([label, value]) => (
              <div key={label} style={styles.breakdownRow}>
                <span>{formatScoreLabel(label)}</span>
                <span style={styles.breakdownValue}>{value}</span>
              </div>
            ))}
          </div>
        )}

        <div style={styles.feedbackGrid}>
          <div style={styles.feedbackBlock}>
            <strong style={{ color: "#16a34a" }}>Key Strengths</strong>
            {evaluation.strengths?.map((item) => <p key={item}>• {item}</p>)}
          </div>
          <div style={styles.feedbackBlock}>
            <strong style={{ color: "#dc2626" }}>Areas to Focus</strong>
            {evaluation.weaknesses?.map((item) => <p key={item}>• {item}</p>)}
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "30px" }}>
          <Button variant="secondary" onClick={() => navigate("/")} style={{ flex: 1 }}>
            Return Home
          </Button>
          <Button variant="accent" onClick={() => navigate("/leaderboard")} style={{ flex: 1 }}>
            View Leaderboard 🏆
          </Button>
        </div>
      </Card>
    </div>
  );
}

function LeaderboardPage() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState("asc"); // Default ascending order as requested
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/leaderboard?order=${order}`);
        const data = await res.json();
        setLeaderboard(data?.leaderboard || []);
      } catch (e) {
        console.error("Leaderboard fetch error", e);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [order]);

  return (
    <div style={{ ...styles.container, ...styles.homeContainer }}>
      <div style={styles.homeShell}>
        <Header />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <div>
            <h2 style={{ fontSize: "32px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
              Candidate Evaluation Leaderboard 🏆
            </h2>
            <p style={{ color: "#64748b", margin: "6px 0 0" }}>
              Candidates who completed the AI interview sorted by evaluation score.
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center", background: "rgba(255,255,255,0.7)", padding: "6px 12px", borderRadius: "999px", border: "1px solid rgba(0,0,0,0.1)" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Sort Order:</span>
            <Button
              variant={order === "asc" ? "primary" : "secondary"}
              onClick={() => setOrder("asc")}
              style={{ padding: "4px 12px", fontSize: "12px" }}
            >
              Ascending Marks ↑
            </Button>
            <Button
              variant={order === "desc" ? "primary" : "secondary"}
              onClick={() => setOrder("desc")}
              style={{ padding: "4px 12px", fontSize: "12px" }}
            >
              Descending Marks ↓
            </Button>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Loading candidate evaluation records...</p>
        ) : leaderboard.length === 0 ? (
          <Card style={{ textAlign: "center", padding: "60px 20px" }}>
            <h3 style={{ fontSize: "20px", color: "#0f172a", margin: "0 0 10px" }}>No Candidate Interviews Recorded Yet</h3>
            <p style={{ color: "#64748b", margin: 0 }}>Apply for a position and complete an interview to appear on the leaderboard!</p>
          </Card>
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            {leaderboard.map((item, index) => (
              <Card key={item.sessionId} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ background: "#0f172a", color: "#fff", width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "15px" }}>
                      #{index + 1}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>{item.candidateName}</h3>
                      <span style={{ fontSize: "13px", color: "#64748b" }}>Role: <strong>{item.jobRole}</strong></span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "24px", fontWeight: "850", color: "#2563eb" }}>{item.score}</span>
                      <span style={{ fontSize: "12px", color: "#64748b" }}> / 100 Marks</span>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => setSelectedCandidate(selectedCandidate?.sessionId === item.sessionId ? null : item)}
                      style={{ padding: "8px 16px", fontSize: "13px" }}
                    >
                      {selectedCandidate?.sessionId === item.sessionId ? "Hide Details" : "View Candidate Data & Video"}
                    </Button>
                  </div>
                </div>

                {selectedCandidate?.sessionId === item.sessionId && (
                  <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(0,0,0,0.1)", display: "grid", gridTemplateColumns: "1fr 280px", gap: "24px" }}>
                    <div>
                      <h4 style={{ margin: "0 0 8px", fontSize: "14px", color: "#0f172a" }}>Evaluation Summary & Notes</h4>
                      <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.6" }}>{item.summary || "Evaluation score generated automatically."}</p>

                      <h4 style={{ margin: "16px 0 8px", fontSize: "14px", color: "#0f172a" }}>Interview Transcript & Log</h4>
                      <div style={{ background: "#0f172a", color: "#f8fafc", padding: "14px", borderRadius: "12px", maxHeight: "180px", overflowY: "auto", fontSize: "12px", fontFamily: "monospace" }}>
                        {item.transcript || "No readable transcript text."}
                      </div>
                    </div>

                    <div style={{ textAlign: "center" }}>
                      <h4 style={{ margin: "0 0 8px", fontSize: "14px", color: "#0f172a" }}>Recorded Video</h4>
                      {item.videoUrl ? (
                        <video src={`${API_URL}${item.videoUrl}`} controls style={{ width: "100%", borderRadius: "12px", border: "1px solid #cbd5e1", background: "#000" }} />
                      ) : (
                        <div style={{ background: "#f1f5f9", padding: "30px 10px", borderRadius: "12px", color: "#94a3b8", fontSize: "12px" }}>
                          No Video Recording Available
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatScoreLabel(label) {
  return label.replace(/([A-Z])/g, " $1").replace(/^./, (character) => character.toUpperCase());
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/post-job" element={<CompanyJobPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
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
    background: "#f8fafc",
    color: "#0f172a",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "36px 20px",
  },
  homeContainer: {
    background:
      "radial-gradient(circle at 10% 10%, rgba(37, 99, 235, 0.05), transparent 30%), radial-gradient(circle at 90% 90%, rgba(15, 23, 42, 0.04), transparent 30%), linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    alignItems: "stretch",
    justifyContent: "flex-start",
  },
  homeShell: { width: "100%", maxWidth: "1140px", margin: "0 auto" },
  nav: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "48px",
    flexWrap: "wrap",
    gap: "16px",
  },
  navLink: {
    color: "#334155",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "600",
    transition: "color 0.2s ease",
  },
  logo: { fontSize: "28px", fontWeight: "900", margin: 0, letterSpacing: "-0.5px", color: "#0f172a" },
  hero: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
    alignItems: "stretch",
    marginBottom: "40px",
  },
  heroCopy: {
    background: "rgba(255, 255, 255, 0.8)",
    border: "1px solid rgba(255, 255, 255, 0.9)",
    borderRadius: "28px",
    padding: "36px",
    boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.05)",
    backdropFilter: "blur(20px)",
  },
  eyebrow: {
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  heroTitle: {
    maxWidth: "760px",
    fontSize: "38px",
    lineHeight: "1.12",
    fontWeight: "850",
    margin: "14px 0 16px",
    color: "#0f172a",
    letterSpacing: "-0.5px",
  },
  tagline: { color: "#475569", fontSize: "16px", lineHeight: "1.65", margin: 0 },
  heroPanel: { display: "grid", gap: "16px" },
  heroMetric: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    background: "rgba(255, 255, 255, 0.75)",
    border: "1px solid rgba(255, 255, 255, 0.9)",
    borderRadius: "24px",
    padding: "26px",
    boxShadow: "0 15px 30px -10px rgba(15, 23, 42, 0.04)",
  },
  metricValue: { color: "#0f172a", fontSize: "40px", lineHeight: 1, fontWeight: "850" },
  metricLabel: { color: "#64748b", fontSize: "13px", fontWeight: "700", marginTop: "6px" },
  sectionHeader: { marginBottom: "20px" },
  sectionTitle: { fontSize: "22px", fontWeight: "800", color: "#0f172a", margin: 0 },
  sectionSubtitle: { fontSize: "14px", color: "#64748b", margin: "4px 0 0" },
  jobGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", width: "100%" },
  jobCard: {
    position: "relative",
    overflow: "hidden",
    minHeight: "280px",
    display: "flex",
    flexDirection: "column",
  },
  gradientBar: { height: "5px", width: "100%", position: "absolute", top: 0, left: 0, opacity: 0.9 },
  jobRole: { color: "#0f172a", fontSize: "22px", fontWeight: "800", margin: "10px 0 4px 0" },
  companyBadge: { background: "#e2e8f0", color: "#334155", fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "999px" },
  jobDesc: { color: "#475569", fontSize: "14px", lineHeight: "1.6", marginBottom: "18px" },
  reqs: { display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" },
  reqBadge: { background: "rgba(241, 245, 249, 0.9)", border: "1px solid #cbd5e1", padding: "5px 10px", borderRadius: "999px", fontSize: "12px", color: "#334155", fontWeight: "600" },
  centerCard: { maxWidth: "480px", width: "100%", textAlign: "center" },
  title: { fontSize: "28px", fontWeight: "850", color: "#0f172a", marginBottom: "6px" },
  subtitle: { color: "#64748b", fontSize: "14px", marginBottom: "24px" },
  formBox: { display: "flex", flexDirection: "column", gap: "14px", margin: "16px 0" },
  fieldLabel: { display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px", textAlign: "left" },
  input: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    fontSize: "14px",
    color: "#0f172a",
    outline: "none",
    boxSizing: "border-box",
  },
  roleToggleBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#f1f5f9",
    padding: "14px",
    borderRadius: "14px",
    marginBottom: "16px",
    border: "1px solid #e2e8f0",
  },
  toggleLabel: { display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" },
  uploadBox: { display: "flex", flexDirection: "column", gap: "16px", marginBottom: "16px" },
  fileInput: { background: "#ffffff", border: "2px dashed #cbd5e1", padding: "20px", borderRadius: "16px", color: "#0f172a", cursor: "pointer" },
  errorText: { color: "#dc2626", fontSize: "13px", marginTop: "4px" },
  successText: { color: "#16a34a", fontSize: "13px", marginTop: "4px", fontWeight: "600" },
  readyState: { marginTop: "20px", padding: "16px", background: "#f0fdf4", borderRadius: "16px", border: "1px solid #bbf7d0" },
  interviewCard: { width: "100%", maxWidth: "860px", display: "flex", flexDirection: "column" },
  statusHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  statusDot: { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "700", color: "#0f172a" },
  dot: { width: "10px", height: "10px", background: "#dc2626", borderRadius: "50%", boxShadow: "0 0 10px #dc2626" },
  visualizer: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0" },
  aiAvatar: { position: "relative", width: "100px", height: "100px", display: "flex", justifyContent: "center", alignItems: "center" },
  aiCore: { width: "50px", height: "50px", background: "linear-gradient(135deg, #0f172a, #2563eb)", borderRadius: "50%", zIndex: 2, boxShadow: "0 0 25px rgba(37, 99, 235, 0.4)" },
  pulseRing: { position: "absolute", width: "100%", height: "100%", border: "2px solid #2563eb", borderRadius: "50%", animation: "pulse 2s infinite" },
  visualizerText: { marginTop: "24px", fontSize: "18px", fontWeight: "600", color: "#475569" },
  logBox: { background: "#0f172a", padding: "16px", borderRadius: "14px", height: "180px", overflowY: "auto", fontSize: "12px", fontFamily: "monospace", border: "1px solid #1e293b" },
  logEntry: { display: "flex", gap: "8px", marginBottom: "6px" },
  logTimestamp: { color: "#64748b" },
  logRole: { color: "#38bdf8", fontWeight: "bold" },
  logMsg: { color: "#f8fafc" },
  emptyLog: { color: "#64748b", textAlign: "center", marginTop: "70px" },
  scoreCircle: { width: "130px", height: "130px", borderRadius: "50%", border: "6px solid #2563eb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 0 25px rgba(37, 99, 235, 0.2)" },
  scoreValue: { fontSize: "42px", fontWeight: "900", color: "#0f172a" },
  scoreMax: { fontSize: "14px", color: "#64748b" },
  evalDetails: { display: "flex", justifyContent: "center", gap: "16px", marginBottom: "16px" },
  evalItem: { background: "#f1f5f9", padding: "8px 16px", borderRadius: "10px", fontSize: "13px", color: "#334155" },
  notesText: { color: "#475569", fontSize: "14px", lineHeight: "1.6", fontStyle: "italic" },
  feedbackGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", textAlign: "left", marginTop: "20px" },
  feedbackBlock: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "14px", color: "#334155", fontSize: "13px", lineHeight: "1.5" },
  breakdown: { display: "grid", gap: "6px", marginTop: "16px", padding: "14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", textAlign: "left" },
  breakdownRow: { display: "flex", justifyContent: "space-between", gap: "16px", color: "#475569", fontSize: "13px" },
  breakdownValue: { color: "#0f172a", fontWeight: "800" },
};
