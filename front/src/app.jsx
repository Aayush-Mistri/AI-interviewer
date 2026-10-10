import { useRef, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link } from "react-router-dom";

const AGENT_WS_URL = import.meta.env.VITE_AGENT_WS_URL || "ws://localhost:3001";
const API_URL = import.meta.env.VITE_API_URL || AGENT_WS_URL.replace(/^ws/, "http");

// Animated AI Agent GIF URL (High quality cyberpunk futuristic AI orb / agent)
const AI_AGENT_GIF = "https://cdn.dribbble.com/users/177029/screenshots/15916845/media/1d293f0b2f00735497ee3594f8ee96f4.gif";

// Default Job Openings
const DEFAULT_JOBS = [
  {
    id: "ai-eng",
    role: "AI Engineer",
    companyName: "VaadIn Core",
    companyDescription: "Building autonomous agentic workflows & LLM infrastructure.",
    description: "Develop cutting-edge RAG pipelines, fine-tune models, and optimize voice AI agent interaction.",
    requirements: ["PyTorch/TensorFlow", "LangChain/LlamaIndex", "Vector DBs", "Python"],
    extraInstructions: "Focus heavily on vector indexing speed, RAG evaluation metrics, and real-time streaming audio bottlenecks.",
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  },
  {
    id: "py-intern",
    role: "Python Intern",
    companyName: "Core Backend Systems",
    companyDescription: "High-throughput microservices and cloud APIs.",
    description: "Develop scalable backend REST/WebSocket microservices using FastAPI, Express, and Django.",
    requirements: ["Python", "FastAPI", "SQL", "Git"],
    extraInstructions: "Ask about async event loops, database indexing techniques, and clean API design principles.",
    gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
  },
  {
    id: "web-intern",
    role: "WebDev Intern",
    companyName: "PixelCraft Design Labs",
    companyDescription: "Next-gen glassmorphic user experiences.",
    description: "Craft responsive, animated, dark-themed UI architectures with React, Vite, and Web Audio API.",
    requirements: ["React", "Tailwind CSS", "TypeScript", "Next.js"],
    extraInstructions: "Evaluate component modularity, state management best practices, and WebSockets integration.",
    gradient: "linear-gradient(135deg, #ec4899 0%, #d946ef 100%)",
  },
];

const getStoredUser = () => {
  try {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

// --- Custom Reusable Components ---

const Button = ({ children, onClick, disabled, variant = "primary", style = {}, type = "button" }) => {
  const variants = {
    primary: { bg: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", color: "#ffffff", border: "1px solid rgba(59, 130, 246, 0.4)", shadow: "0 0 20px rgba(59, 130, 246, 0.35)" },
    secondary: { bg: "rgba(30, 41, 59, 0.8)", color: "#f8fafc", border: "1px solid rgba(255, 255, 255, 0.12)", shadow: "none" },
    accent: { bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#ffffff", border: "1px solid rgba(16, 185, 129, 0.4)", shadow: "0 0 20px rgba(16, 185, 129, 0.35)" },
    danger: { bg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", color: "#ffffff", border: "none", shadow: "0 0 20px rgba(239, 68, 68, 0.35)" },
  };
  const v = variants[variant] || variants.primary;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "#334155" : v.bg,
        color: disabled ? "#94a3b8" : v.color,
        border: v.border,
        padding: "11px 24px",
        borderRadius: "12px",
        fontSize: "14px",
        fontWeight: "700",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: disabled ? "none" : v.shadow,
        backdropFilter: "blur(12px)",
        letterSpacing: "0.2px",
        ...style,
      }}
    >
      {children}
    </button>
  );
};

const Card = ({ children, style = {} }) => (
  <div style={{
    background: "rgba(15, 23, 42, 0.75)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 20px 50px -10px rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(20px)",
    ...style
  }}>
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
      <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
        <Link to="/" style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={styles.logoPulse} />
            <h1 style={styles.logo}>Vaad<span style={{ color: "#38bdf8" }}>In</span></h1>
          </div>
        </Link>
        <div style={{ display: "flex", gap: "18px", alignItems: "center" }}>
          <Link to="/" style={styles.navLink}>Jobs</Link>
          {user?.isCompany && (
            <>
              <Link to="/leaderboard" style={styles.navLinkHighlight}>Company Leaderboard 🏆</Link>
              <Link to="/post-job" style={styles.navLinkAccent}>+ Post Job Position</Link>
            </>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#f8fafc", background: "rgba(255,255,255,0.06)", padding: "6px 14px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.12)" }}>
              {user.isCompany ? `🏢 ${user.companyName || user.name}` : `👤 ${user.name}`}
            </span>
            <Button variant="secondary" onClick={handleLogout} style={{ padding: "8px 16px", fontSize: "12px" }}>
              Logout
            </Button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "10px" }}>
            <Button variant="secondary" onClick={() => navigate("/login")} style={{ padding: "8px 18px", fontSize: "13px" }}>
              Login
            </Button>
            <Button variant="primary" onClick={() => navigate("/signup")} style={{ padding: "8px 18px", fontSize: "13px" }}>
              Sign Up
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}

// --- Pages ---

// Deepgram Voice Agent API inspired Landing Page for unauthenticated visitors
function LandingPage() {
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
        console.error(e);
      }
    }
    fetchJobs();
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.homeShell}>
        <Header />

        {/* Hero Section inspired by Deepgram Voice Agent API */}
        <section style={styles.dgHeroSection}>
          <div style={styles.heroBadge}>
            ⚡ Powered by Deepgram Voice Agent API
          </div>
          <h1 style={styles.dgHeroTitle}>
            Enterprise-Ready, Real-Time Voice AI Technical Screening
          </h1>
          <p style={styles.dgHeroSubtitle}>
            A unified conversational Voice AI engine that eliminates manual phone screens. Combines real-time Speech-to-Text (Nova-3), LLM Orchestration, and Text-to-Speech (Aura-2) with custom company rules and automated candidate scoring.
          </p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap", marginTop: "28px" }}>
            <Button variant="primary" onClick={() => navigate("/signup")} style={{ padding: "14px 32px", fontSize: "16px" }}>
              Sign Up Free 🚀
            </Button>
            <Button variant="secondary" onClick={() => navigate("/login")} style={{ padding: "14px 28px", fontSize: "16px" }}>
              Log In
            </Button>
          </div>

          <div style={styles.dgMetricsStrip}>
            <div style={styles.dgMetricItem}>
              <span style={styles.dgMetricNumber}>&lt; 300ms</span>
              <span style={styles.dgMetricLabel}>Voice Agent Latency</span>
            </div>
            <div style={styles.dgMetricItem}>
              <span style={styles.dgMetricNumber}>Nova-3 + Aura-2</span>
              <span style={styles.dgMetricLabel}>Full Stack STT / TTS</span>
            </div>
            <div style={styles.dgMetricItem}>
              <span style={styles.dgMetricNumber}>100%</span>
              <span style={styles.dgMetricLabel}>Custom AI Prompt Control</span>
            </div>
            <div style={styles.dgMetricItem}>
              <span style={{ ...styles.dgMetricNumber, color: "#10b981" }}>Live</span>
              <span style={styles.dgMetricLabel}>Split-Screen & Video Capture</span>
            </div>
          </div>
        </section>

        {/* Feature Cards Grid (Inspired by Deepgram product page) */}
        <div style={{ margin: "60px 0 40px" }}>
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: "900", color: "#f8fafc" }}>Voice Agent API Capabilities</h2>
            <p style={{ color: "#94a3b8", fontSize: "16px" }}>Built for low latency, high audio quality, and precision candidate evaluation.</p>
          </div>

          <div style={styles.dgFeatureGrid}>
            <Card style={styles.dgFeatureCard}>
              <div style={styles.dgFeatureIcon}>🎙️</div>
              <h3 style={styles.dgFeatureTitle}>Unified Voice Agent API</h3>
              <p style={styles.dgFeatureDesc}>One API that combines speech recognition, LLM reasoning, and natural voice synthesis in real-time, delivering seamless sub-second interviews.</p>
            </Card>

            <Card style={styles.dgFeatureCard}>
              <div style={styles.dgFeatureIcon}>⚙️</div>
              <h3 style={styles.dgFeatureTitle}>Custom AI Instruction Injection</h3>
              <p style={styles.dgFeatureDesc}>Hiring companies can configure role-specific requirements and custom prompt guidelines injected straight into the interviewer's system prompt.</p>
            </Card>

            <Card style={styles.dgFeatureCard}>
              <div style={styles.dgFeatureIcon}>📹</div>
              <h3 style={styles.dgFeatureTitle}>Split-Screen Camera & Audio Recording</h3>
              <p style={styles.dgFeatureDesc}>Includes an animated AI agent avatar, live candidate camera feed, and floating Netflix-style real-time subtitles stored as lightweight WebM videos.</p>
            </Card>

            <Card style={styles.dgFeatureCard}>
              <div style={styles.dgFeatureIcon}>🏆</div>
              <h3 style={styles.dgFeatureTitle}>Restricted Company Leaderboards</h3>
              <p style={styles.dgFeatureDesc}>Recruiters and hiring managers get an exclusive dashboard with candidate evaluation scores, full transcripts, and video review controls.</p>
            </Card>
          </div>
        </div>

        {/* Job Positions Direct Access Showcase */}
        <div style={{ margin: "50px 0 20px" }}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Featured Voice AI Screenings</h3>
            <span style={styles.sectionSubtitle}>Select a job position below to take an AI voice screening</span>
          </div>

          <div style={styles.jobGrid}>
            {allJobs.map((job) => (
              <Card key={job.id} style={styles.jobCard}>
                <div style={{ ...styles.cardGlow, background: job.gradient || "linear-gradient(135deg, #3b82f6, #1d4ed8)" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <h3 style={styles.jobRole}>{job.role}</h3>
                    <span style={styles.companyNameText}>🏢 {job.companyName || job.companyDetails?.name || "Partner Company"}</span>
                  </div>
                  <span style={styles.liveTag}>AI Ready</span>
                </div>
                <p style={styles.jobDesc}>{job.description}</p>

                <div style={styles.reqs}>
                  {(Array.isArray(job.requirements) ? job.requirements : [job.requirements]).map(req => (
                    <span key={req} style={styles.reqBadge}>{req}</span>
                  ))}
                </div>

                <Button variant="primary" onClick={() => navigate(`/apply/${job.id}`)} style={{ marginTop: "auto", width: '100%' }}>
                  Apply & Take Interview →
                </Button>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const [allJobs, setAllJobs] = useState(DEFAULT_JOBS);
  const user = getStoredUser();

  async function fetchJobs() {
    try {
      const res = await fetch(`${API_URL}/api/jobs`);
      const data = await res.json();
      if (data?.jobs?.length) {
        setAllJobs([...data.jobs, ...DEFAULT_JOBS]);
      } else {
        setAllJobs(DEFAULT_JOBS);
      }
    } catch (e) {
      console.error("Could not fetch custom jobs", e);
    }
  }

  useEffect(() => {
    fetchJobs();
  }, []);

  async function handleDeleteJob(jobId) {
    if (!window.confirm("Are you sure you want to delete this job posting?")) return;
    try {
      const res = await fetch(`${API_URL}/api/jobs/${jobId}`, { method: "DELETE" });
      if (res.ok) {
        setAllJobs(prev => prev.filter(j => j.id !== jobId));
      }
    } catch (e) {
      console.error("Failed to delete job", e);
    }
  }

  // If user is not logged in, show the Deepgram-inspired Landing Page!
  if (!user) {
    return <LandingPage />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.homeShell}>
        <Header />

        <section style={styles.hero}>
          <div style={styles.heroCopy}>
            <div style={styles.heroBadge}>⚡ Candidate & Company Dashboard</div>
            <h2 style={styles.heroTitle}>Autonomous Voice-Led Technical Screening.</h2>
            <p style={styles.tagline}>
              Companies configure custom role criteria and AI instructions. Candidates upload resumes and engage in a live split-screen voice interview evaluated in real-time.
            </p>
          </div>

          <div style={styles.heroPanel}>
            <div style={styles.metricCard}>
              <span style={styles.metricValue}>{allJobs.length}</span>
              <span style={styles.metricLabel}>Active Job Listings</span>
            </div>
            <div style={styles.metricCard}>
              <span style={{ ...styles.metricValue, color: "#10b981" }}>Live</span>
              <span style={styles.metricLabel}>Deepgram Agent Loop</span>
            </div>
          </div>
        </section>

        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Available Job Positions</h3>
          <span style={styles.sectionSubtitle}>Select a role to start your AI voice screening</span>
        </div>

        <div style={styles.jobGrid}>
          {allJobs.map((job) => (
            <Card key={job.id} style={styles.jobCard}>
              <div style={{ ...styles.cardGlow, background: job.gradient || "linear-gradient(135deg, #3b82f6, #1d4ed8)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <h3 style={styles.jobRole}>{job.role}</h3>
                  <span style={styles.companyNameText}>🏢 {job.companyName || job.companyDetails?.name || "Partner Company"}</span>
                </div>
                <span style={styles.liveTag}>AI Ready</span>
              </div>
              <p style={styles.jobDesc}>{job.description}</p>

              <div style={styles.reqs}>
                {(Array.isArray(job.requirements) ? job.requirements : [job.requirements]).map(req => (
                  <span key={req} style={styles.reqBadge}>{req}</span>
                ))}
              </div>

              {job.extraInstructions && (
                <div style={styles.aiInstructionSnippet}>
                  🤖 <b>Custom AI Prompt:</b> "{job.extraInstructions.slice(0, 80)}..."
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
                <Button variant="primary" onClick={() => navigate(`/apply/${job.id}`)} style={{ flex: 1 }}>
                  Apply & Take Interview →
                </Button>
                {user?.isCompany && (
                  <Button variant="danger" onClick={() => handleDeleteJob(job.id)} style={{ padding: "11px 16px" }} title="Delete Job Post">
                    🗑️
                  </Button>
                )}
              </div>
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
      navigate(data.user.isCompany ? "/leaderboard" : "/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <Button variant="secondary" onClick={() => navigate("/")} style={{ marginBottom: 24 }}>
        ← Back to Home
      </Button>
      <Card style={styles.authCard}>
        <h2 style={styles.authTitle}>Account Login</h2>
        <p style={styles.authSubtitle}>Access your VaadIn candidate or company portal.</p>
        <form onSubmit={handleLogin} style={styles.formBox}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.darkInput}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.darkInput}
            required
          />
          {error && <p style={styles.errorText}>{error}</p>}
          <Button variant="primary" onClick={handleLogin} disabled={loading} style={{ width: "100%", marginTop: "10px" }}>
            {loading ? "Authenticating..." : "Login"}
          </Button>
        </form>
        <p style={{ marginTop: "20px", fontSize: "14px", color: "#94a3b8" }}>
          Don't have an account? <Link to="/signup" style={{ color: "#38bdf8", fontWeight: "bold" }}>Sign up</Link>
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
      <Button variant="secondary" onClick={() => navigate("/")} style={{ marginBottom: 24 }}>
        ← Back to Home
      </Button>
      <Card style={{ ...styles.authCard, maxWidth: "560px" }}>
        <h2 style={styles.authTitle}>Create Account</h2>
        <p style={styles.authSubtitle}>Join VaadIn to take interviews or recruit top candidates.</p>

        <div style={styles.companyToggleCard}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>🏢</span>
            <div>
              <h4 style={{ margin: 0, fontSize: "14px", color: "#f8fafc" }}>Are you a hiring company?</h4>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#94a3b8" }}>Post positions, give custom AI instructions, & view candidate leaderboards.</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={isCompany}
            onChange={(e) => setIsCompany(e.target.checked)}
            style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "#3b82f6" }}
          />
        </div>

        <form onSubmit={handleSignup} style={styles.formBox}>
          <input
            type="text"
            placeholder={isCompany ? "Contact Person Name" : "Full Candidate Name"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.darkInput}
            required
          />
          <input
            type="email"
            placeholder="Work / Personal Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.darkInput}
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.darkInput}
            required
          />

          {isCompany && (
            <div style={styles.companyFieldsBox}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#38bdf8" }}>🏢 Company Profile</span>
              <input
                type="text"
                placeholder="Company / Organization Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                style={styles.darkInput}
                required
              />
              <textarea
                placeholder="Brief company overview or domain..."
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                style={{ ...styles.darkInput, height: "70px", resize: "none" }}
              />
            </div>
          )}

          {error && <p style={styles.errorText}>{error}</p>}
          <Button variant="accent" onClick={handleSignup} disabled={loading} style={{ width: "100%", marginTop: "10px" }}>
            {loading ? "Registering..." : isCompany ? "Sign Up as Hiring Company" : "Sign Up as Candidate"}
          </Button>
        </form>
        <p style={{ marginTop: "20px", fontSize: "14px", color: "#94a3b8" }}>
          Already registered? <Link to="/login" style={{ color: "#38bdf8", fontWeight: "bold" }}>Login</Link>
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
  const [extraInstructions, setExtraInstructions] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmitJob(e) {
    if (e) e.preventDefault();
    setError("");
    setNotice("");

    if (!role.trim()) {
      setError("Please enter a job title.");
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
          extraInstructions,
          companyId: user?.id,
          postedBy: user?.name || "Company"
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not post job.");

      setNotice("Job position published! The AI Agent is now configured with your custom guidelines.");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <Button variant="secondary" onClick={() => navigate("/")} style={{ marginBottom: 24 }}>
        ← Back to Jobs
      </Button>
      <Card style={{ ...styles.authCard, maxWidth: "650px", textAlign: "left" }}>
        <h2 style={{ ...styles.authTitle, textAlign: "center" }}>Post Job Position</h2>
        <p style={{ ...styles.authSubtitle, textAlign: "center" }}>
          Define role requirements and specific instructions for the AI Interviewer Agent.
        </p>

        <form onSubmit={handleSubmitJob} style={styles.formBox}>
          <div>
            <label style={styles.fieldLabel}>Job Title *</label>
            <input
              type="text"
              placeholder="e.g. Lead AI Engineer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={styles.darkInput}
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
              style={styles.darkInput}
            />
          </div>

          <div>
            <label style={styles.fieldLabel}>Target Candidate Skills & Criteria (Comma-separated)</label>
            <textarea
              placeholder="e.g. PyTorch, Distributed Training, WebSockets, CUDA, High-Throughput APIs"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              style={{ ...styles.darkInput, height: "70px", resize: "none" }}
            />
          </div>

          <div>
            <label style={{ ...styles.fieldLabel, color: "#38bdf8" }}>
              🤖 Extra Instructions for the AI Interviewer Agent
            </label>
            <textarea
              placeholder="e.g. Ask the candidate how they handle high concurrency in Node.js, probe into their resume's microservices project, test their knowledge on WebSocket heartbeat reconnections."
              value={extraInstructions}
              onChange={(e) => setExtraInstructions(e.target.value)}
              style={{ ...styles.darkInput, height: "100px", resize: "none", border: "1px solid rgba(56, 189, 248, 0.4)" }}
            />
            <span style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px", display: "block" }}>
              💡 These instructions will be directly injected into the live AI Agent's system prompt during candidate screenings.
            </span>
          </div>

          {error && <p style={styles.errorText}>{error}</p>}
          {notice && <p style={styles.successText}>{notice}</p>}

          <Button variant="accent" onClick={handleSubmitJob} disabled={loading} style={{ width: "100%", marginTop: "12px" }}>
            {loading ? "Publishing..." : "Publish Job & AI Configuration"}
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
    async function loadJob() {
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
    loadJob();
  }, [jobId]);

  async function uploadResume() {
    setError("");
    setNotice("");
    if (!resumeFile) {
      setError("Please select a PDF resume.");
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
      setNotice(`Resume verified for ${data.candidateName}. Ready for voice interview.`);
    } catch (err) {
      setError(err.message || "Could not upload resume.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={styles.container}>
      <Button variant="secondary" onClick={() => navigate("/")} style={{ marginBottom: 24 }}>← Back to Jobs</Button>
      <Card style={styles.authCard}>
        <h2 style={styles.authTitle}>Apply for {selectedJob?.role || "Position"}</h2>
        <p style={styles.authSubtitle}>Upload your PDF resume to start the AI technical voice screening.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "16px" }}>
          <input type="file" accept="application/pdf" onChange={(e) => setResumeFile(e.target.files[0])} style={styles.fileUploadInput} />
          <Button variant="accent" onClick={uploadResume} disabled={!resumeFile || uploading}>
            {uploading ? "Parsing Resume PDF..." : "Verify & Prepare AI Interview"}
          </Button>
        </div>
        {error && <p style={styles.errorText}>{error}</p>}
        {notice && <p style={styles.successText}>{notice}</p>}
        {resumeSession && (
          <div style={styles.verifiedBox}>
            <p style={{ margin: 0 }}>✅ Candidate Verified: <strong>{resumeSession.candidateName}</strong></p>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
              🎥 Camera & Microphone stream will be active during the interview.
            </p>
            <Button variant="primary" onClick={() => navigate(`/interview/${resumeSession.sessionId}`)} style={{ marginTop: 16, width: '100%' }}>
              Launch AI Interview Room 🚀
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
  const [timeLeft, setTimeLeft] = useState(120);
  const [stopping, setStopping] = useState(false);
  const [latestSubtitle, setLatestSubtitle] = useState({ speaker: "AI", text: "Initializing AI Interviewer Agent connection..." });

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
        setLatestSubtitle({ speaker: "SYS", text: err.message || "Microphone / Camera access denied." });
        ws.close();
      }
    };

    ws.onmessage = async (event) => {
      if (typeof event.data === "string") {
        const msg = safeParseEvent(event.data);

        if (msg.type === "ConversationText" && msg.content) {
          setLatestSubtitle({
            speaker: msg.role === "assistant" ? "AI Interviewer" : "You",
            text: msg.content
          });
        }

        if (msg.type === "EvaluationSaved") {
          evaluationRef.current = msg;
          await uploadVideoBlob();
          navigate(`/evaluation/${sessionId}`);
        }
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
      console.error(e);
    }
  }

  async function uploadVideoBlob() {
    if (!videoChunksRef.current.length) return;
    const videoBlob = new Blob(videoChunksRef.current, { type: "video/webm" });
    const formData = new FormData();
    formData.append("video", videoBlob, `interview_${sessionId}.webm`);
    formData.append("sessionId", sessionId);

    try {
      await fetch(`${API_URL}/api/upload-video`, { method: "POST", body: formData });
    } catch (err) {
      console.error("Video upload error:", err);
    }
  }

  function safeParseEvent(data) {
    try { return JSON.parse(data); } catch { return { type: "Message", message: data }; }
  }

  async function startMediaCapture() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: { width: { max: 320 }, height: { max: 240 }, frameRate: { max: 15 } }
    });
    streamRef.current = stream;

    if (videoElementRef.current) {
      videoElementRef.current.srcObject = stream;
    }

    try {
      videoChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 100000 // ultra lightweight footprint
      });
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) videoChunksRef.current.push(e.data);
      };
      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
    } catch (e) {
      console.warn("Fallback recorder", e);
    }

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
    <div style={styles.fullscreenInterviewContainer}>
      {/* Top Floating Control Bar */}
      <div style={styles.interviewTopBar}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={styles.liveRecordingDot} />
          <span style={{ fontSize: "14px", fontWeight: "800", color: "#f8fafc", letterSpacing: "0.5px" }}>
            LIVE INTERVIEW &nbsp;|&nbsp; TIME LEFT: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
        </div>
        <Button variant="danger" onClick={stopInterview} disabled={stopping} style={{ padding: "8px 20px" }}>
          {stopping ? "Calculating Evaluation..." : "End Interview"}
        </Button>
      </div>

      {/* 50/50 Split Screen Stage */}
      <div style={styles.splitStage}>
        {/* Left 50%: AI Agent Avatar GIF */}
        <div style={styles.agentScreen}>
          <div style={styles.agentAvatarContainer}>
            <img src={AI_AGENT_GIF} alt="AI Agent" style={styles.agentGifImage} />
            <div style={styles.agentAudioGlow} />
          </div>
          <span style={styles.screenLabel}>🤖 AI Technical Interviewer Agent</span>
        </div>

        {/* Right 50%: Live Candidate Camera */}
        <div style={styles.candidateScreen}>
          <video ref={videoElementRef} autoPlay muted playsInline style={styles.candidateVideoFeed} />
          <span style={styles.screenLabel}>👤 You (Candidate Camera)</span>
        </div>
      </div>

      {/* Netflix-Style Floating Subtitle Box at Bottom Center */}
      <div style={styles.netflixSubtitleContainer}>
        <div style={styles.netflixSubtitleBox}>
          <span style={{ color: latestSubtitle.speaker === "You" ? "#38bdf8" : "#10b981", fontWeight: "800", marginRight: "8px" }}>
            [{latestSubtitle.speaker}]
          </span>
          <span>{latestSubtitle.text}</span>
        </div>
      </div>
    </div>
  );
}

function EvaluationPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const user = getStoredUser();
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

  if (loading || !evaluation) return <div style={styles.container}>Evaluating your technical interview...</div>;

  return (
    <div style={styles.container}>
      <Card style={{ ...styles.authCard, maxWidth: "700px" }}>
        <div style={styles.scoreCircle}>
          <span style={styles.scoreValue}>{evaluation?.score || 0}</span>
          <span style={styles.scoreMax}>/ 100</span>
        </div>

        <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#f8fafc", margin: "0 0 6px" }}>Interview Evaluation Complete</h2>
        <p style={{ color: "#94a3b8", fontSize: "14px", margin: "0 0 20px" }}>Overall candidate performance & score summary</p>

        {evaluation.summary && <p style={styles.evalSummaryText}>{evaluation.summary}</p>}

        {evaluation.videoUrl && (
          <div style={{ margin: "20px 0", textAlign: "center" }}>
            <h4 style={{ fontSize: "13px", color: "#38bdf8", marginBottom: "8px" }}>📹 Interview Video Recording</h4>
            <video src={`${API_URL}${evaluation.videoUrl}`} controls style={{ width: "100%", maxWidth: "380px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.12)" }} />
          </div>
        )}

        {evaluation.scoreBreakdown && (
          <div style={styles.breakdownBox}>
            {Object.entries(evaluation.scoreBreakdown).map(([label, value]) => (
              <div key={label} style={styles.breakdownRow}>
                <span>{label.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())}</span>
                <span style={{ color: "#38bdf8", fontWeight: "800" }}>{value}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: "14px", marginTop: "28px" }}>
          <Button variant="secondary" onClick={() => navigate("/")} style={{ flex: 1 }}>
            Return to Home
          </Button>
          {user?.isCompany && (
            <Button variant="accent" onClick={() => navigate("/leaderboard")} style={{ flex: 1 }}>
              View Leaderboard 🏆
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function LeaderboardPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      if (!user?.isCompany) {
        setError("Access Restricted: Only verified company accounts can view candidate evaluation records.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/leaderboard?userEmail=${encodeURIComponent(user.email)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not fetch leaderboard.");
        setLeaderboard(data?.leaderboard || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [user]);

  if (!user?.isCompany) {
    return (
      <div style={styles.container}>
        <Card style={{ ...styles.authCard, textAlign: "center", padding: "50px 20px" }}>
          <span style={{ fontSize: "40px" }}>🔒</span>
          <h2 style={{ color: "#f8fafc", fontSize: "24px", margin: "16px 0 8px" }}>Restricted Company Leaderboard</h2>
          <p style={{ color: "#94a3b8", fontSize: "14px", margin: "0 0 24px" }}>
            The candidate evaluation leaderboard is exclusively accessible to registered hiring company accounts.
          </p>
          <Button variant="primary" onClick={() => navigate("/")}>
            Return to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.homeShell}>
        <Header />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <div>
            <h2 style={{ fontSize: "32px", fontWeight: "800", color: "#f8fafc", margin: 0 }}>
              Company Candidate Leaderboard 🏆
            </h2>
            <p style={{ color: "#94a3b8", margin: "6px 0 0" }}>
              Evaluation results & interview recordings for <strong>{user.companyName || user.name}</strong> candidates.
            </p>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "#94a3b8", padding: "40px" }}>Loading candidate evaluations...</p>
        ) : error ? (
          <Card style={{ textAlign: "center", padding: "40px" }}><p style={{ color: "#ef4444" }}>{error}</p></Card>
        ) : leaderboard.length === 0 ? (
          <Card style={{ textAlign: "center", padding: "60px 20px" }}>
            <h3 style={{ color: "#f8fafc", margin: "0 0 10px" }}>No Candidate Interviews Recorded Yet</h3>
            <p style={{ color: "#94a3b8", margin: 0 }}>Post a position and have candidates complete an interview to view evaluations.</p>
          </Card>
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            {leaderboard.map((item, index) => (
              <Card key={item.sessionId || index} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", color: "#fff", width: "38px", height: "38px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "15px" }}>
                      #{index + 1}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#f8fafc" }}>{item.candidateName}</h3>
                      <span style={{ fontSize: "13px", color: "#94a3b8" }}>Role: <strong>{item.jobRole}</strong></span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "24px", fontWeight: "900", color: "#10b981" }}>{item.score}</span>
                      <span style={{ fontSize: "12px", color: "#94a3b8" }}> / 100 Marks</span>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => setSelectedCandidate(selectedCandidate?.sessionId === item.sessionId ? null : item)}
                      style={{ padding: "8px 16px", fontSize: "13px" }}
                    >
                      {selectedCandidate?.sessionId === item.sessionId ? "Hide Data" : "View Candidate Data & Video"}
                    </Button>
                  </div>
                </div>

                {selectedCandidate?.sessionId === item.sessionId && (
                  <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "grid", gridTemplateColumns: "1fr 280px", gap: "24px" }}>
                    <div>
                      <h4 style={{ margin: "0 0 8px", fontSize: "14px", color: "#38bdf8" }}>Evaluation Notes & Feedback</h4>
                      <p style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: "1.6" }}>{item.summary || "Automated evaluation completed."}</p>

                      <h4 style={{ margin: "16px 0 8px", fontSize: "14px", color: "#38bdf8" }}>Full Transcript</h4>
                      <div style={{ background: "#020617", color: "#f8fafc", padding: "14px", borderRadius: "12px", maxHeight: "180px", overflowY: "auto", fontSize: "12px", fontFamily: "monospace", border: "1px solid rgba(255,255,255,0.1)" }}>
                        {item.transcript || "No transcript recorded."}
                      </div>
                    </div>

                    <div style={{ textAlign: "center" }}>
                      <h4 style={{ margin: "0 0 8px", fontSize: "14px", color: "#38bdf8" }}>Recorded Interview Video</h4>
                      {item.videoUrl ? (
                        <video src={`${API_URL}${item.videoUrl}`} controls style={{ width: "100%", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.12)", background: "#000" }} />
                      ) : (
                        <div style={{ background: "rgba(255,255,255,0.04)", padding: "30px 10px", borderRadius: "12px", color: "#64748b", fontSize: "12px" }}>
                          No Video Recording Saved
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
    background: "#020617", // Ultra sleek dark theme
    color: "#f8fafc",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "36px 20px",
    backgroundImage: "radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.08), transparent 50%), radial-gradient(circle at 100% 100%, rgba(16, 185, 129, 0.05), transparent 50%)",
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
  logoPulse: { width: "12px", height: "12px", background: "#38bdf8", borderRadius: "50%", boxShadow: "0 0 12px #38bdf8" },
  logo: { fontSize: "26px", fontWeight: "900", margin: 0, letterSpacing: "-0.5px", color: "#f8fafc" },
  navLink: { color: "#94a3b8", textDecoration: "none", fontSize: "14px", fontWeight: "600", transition: "color 0.2s ease" },
  navLinkHighlight: { color: "#f59e0b", textDecoration: "none", fontSize: "14px", fontWeight: "700" },
  navLinkAccent: { color: "#38bdf8", textDecoration: "none", fontSize: "14px", fontWeight: "700" },
  hero: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
    alignItems: "stretch",
    marginBottom: "40px",
  },
  heroCopy: {
    background: "rgba(15, 23, 42, 0.75)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "28px",
    padding: "36px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(20px)",
  },
  heroBadge: { display: "inline-block", background: "rgba(56, 189, 248, 0.12)", color: "#38bdf8", fontSize: "12px", fontWeight: "800", padding: "6px 14px", borderRadius: "999px", marginBottom: "14px", border: "1px solid rgba(56, 189, 248, 0.25)" },
  heroTitle: { fontSize: "36px", lineHeight: "1.15", fontWeight: "900", color: "#f8fafc", margin: "0 0 16px", letterSpacing: "-0.5px" },
  tagline: { color: "#94a3b8", fontSize: "15px", lineHeight: "1.65", margin: 0 },
  heroPanel: { display: "grid", gap: "16px" },
  metricCard: { display: "flex", flexDirection: "column", justifyContent: "center", background: "rgba(15, 23, 42, 0.75)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "24px", padding: "26px", boxShadow: "0 15px 30px rgba(0, 0, 0, 0.4)" },
  metricValue: { fontSize: "38px", fontWeight: "900", color: "#f8fafc" },
  metricLabel: { fontSize: "13px", fontWeight: "700", color: "#64748b", marginTop: "6px" },
  sectionHeader: { marginBottom: "20px" },
  sectionTitle: { fontSize: "22px", fontWeight: "800", color: "#f8fafc", margin: 0 },
  sectionSubtitle: { fontSize: "14px", color: "#94a3b8", margin: "4px 0 0" },
  jobGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", width: "100%" },
  jobCard: { position: "relative", overflow: "hidden", minHeight: "300px", display: "flex", flexDirection: "column" },
  cardGlow: { height: "4px", width: "100%", position: "absolute", top: 0, left: 0 },
  jobRole: { fontSize: "20px", fontWeight: "800", color: "#f8fafc", margin: 0 },
  companyNameText: { fontSize: "12px", color: "#38bdf8", fontWeight: "700", marginTop: "4px", display: "block" },
  liveTag: { background: "rgba(16, 185, 129, 0.15)", color: "#10b981", fontSize: "11px", fontWeight: "800", padding: "4px 10px", borderRadius: "999px", border: "1px solid rgba(16, 185, 129, 0.3)" },
  jobDesc: { color: "#cbd5e1", fontSize: "14px", lineHeight: "1.6", margin: "14px 0" },
  reqs: { display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" },
  reqBadge: { background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", color: "#cbd5e1", fontWeight: "600" },
  aiInstructionSnippet: { background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.2)", padding: "10px", borderRadius: "12px", fontSize: "12px", color: "#38bdf8", marginBottom: "18px" },
  authCard: { maxWidth: "480px", width: "100%", textAlign: "center" },
  authTitle: { fontSize: "28px", fontWeight: "850", color: "#f8fafc", margin: "0 0 6px" },
  authSubtitle: { color: "#94a3b8", fontSize: "14px", marginBottom: "24px" },
  formBox: { display: "flex", flexDirection: "column", gap: "14px", margin: "16px 0" },
  fieldLabel: { display: "block", fontSize: "13px", fontWeight: "700", color: "#cbd5e1", marginBottom: "6px", textAlign: "left" },
  darkInput: { width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.12)", background: "#090d16", fontSize: "14px", color: "#f8fafc", outline: "none", boxSizing: "border-box" },
  companyToggleCard: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.04)", padding: "14px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "16px", textAlign: "left" },
  companyFieldsBox: { display: "flex", flexDirection: "column", gap: "12px", background: "rgba(56, 189, 248, 0.05)", padding: "16px", borderRadius: "16px", border: "1px solid rgba(56, 189, 248, 0.2)" },
  fileUploadInput: { background: "#090d16", border: "2px dashed rgba(255,255,255,0.2)", padding: "20px", borderRadius: "16px", color: "#f8fafc", cursor: "pointer" },
  errorText: { color: "#ef4444", fontSize: "13px", marginTop: "4px" },
  successText: { color: "#10b981", fontSize: "13px", marginTop: "4px", fontWeight: "600" },
  verifiedBox: { marginTop: "20px", padding: "16px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "16px", border: "1px solid rgba(16, 185, 129, 0.3)" },

  // Fullscreen Split Interview Layout
  fullscreenInterviewContainer: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#020617", zIndex: 9999, display: "flex", flexDirection: "column" },
  interviewTopBar: { padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(15, 23, 42, 0.9)", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" },
  liveRecordingDot: { width: "12px", height: "12px", background: "#ef4444", borderRadius: "50%", boxShadow: "0 0 12px #ef4444" },
  splitStage: { flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", background: "#0f172a" },
  agentScreen: { position: "relative", background: "#020617", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRight: "1px solid rgba(255,255,255,0.1)" },
  agentAvatarContainer: { position: "relative", width: "220px", height: "220px", display: "flex", justifyContent: "center", alignItems: "center" },
  agentGifImage: { width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", zIndex: 2, border: "2px solid #38bdf8", boxShadow: "0 0 40px rgba(56, 189, 248, 0.4)" },
  agentAudioGlow: { position: "absolute", width: "100%", height: "100%", borderRadius: "50%", background: "radial-gradient(circle, rgba(56, 189, 248, 0.4), transparent 70%)" },
  candidateScreen: { position: "relative", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" },
  candidateVideoFeed: { width: "100%", height: "100%", objectFit: "cover" },
  screenLabel: { position: "absolute", top: "16px", left: "16px", background: "rgba(0, 0, 0, 0.6)", color: "#f8fafc", fontSize: "12px", fontWeight: "700", padding: "6px 14px", borderRadius: "999px", backdropFilter: "blur(8px)", border: "1px solid rgba(255, 255, 255, 0.12)" },

  // Netflix Subtitles
  netflixSubtitleContainer: { position: "absolute", bottom: "32px", left: "50%", transform: "translateX(-50%)", zIndex: 10000, width: "90%", maxWidth: "800px", textAlign: "center", pointerEvents: "none" },
  netflixSubtitleBox: { display: "inline-block", background: "rgba(0, 0, 0, 0.82)", color: "#ffffff", padding: "12px 24px", borderRadius: "12px", fontSize: "17px", fontWeight: "600", border: "1px solid rgba(255, 255, 255, 0.15)", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.8)", backdropFilter: "blur(12px)" },

  scoreCircle: { width: "130px", height: "130px", borderRadius: "50%", border: "6px solid #38bdf8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 0 30px rgba(56, 189, 248, 0.3)" },
  scoreValue: { fontSize: "42px", fontWeight: "900", color: "#f8fafc" },
  scoreMax: { fontSize: "14px", color: "#64748b" },
  evalSummaryText: { color: "#cbd5e1", fontSize: "14px", lineHeight: "1.65", background: "rgba(255, 255, 255, 0.04)", padding: "16px", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)" },
  breakdownBox: { display: "grid", gap: "8px", marginTop: "16px", padding: "16px", background: "#090d16", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "16px", textAlign: "left" },
  breakdownRow: { display: "flex", justifyContent: "space-between", gap: "16px", color: "#cbd5e1", fontSize: "13px" },

  // Deepgram Landing Page Styles
  dgHeroSection: { textAlign: "center", padding: "40px 20px 20px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "32px", border: "1px solid rgba(255, 255, 255, 0.1)", backdropFilter: "blur(20px)", boxShadow: "0 20px 50px rgba(0,0,0,0.6)" },
  dgHeroTitle: { fontSize: "42px", fontWeight: "900", color: "#f8fafc", margin: "16px 0", lineHeight: "1.15", letterSpacing: "-1px" },
  dgHeroSubtitle: { fontSize: "16px", color: "#94a3b8", maxWidth: "800px", margin: "0 auto", lineHeight: "1.6" },
  dgMetricsStrip: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginTop: "40px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "24px" },
  dgMetricItem: { display: "flex", flexDirection: "column", alignItems: "center" },
  dgMetricNumber: { fontSize: "24px", fontWeight: "900", color: "#38bdf8" },
  dgMetricLabel: { fontSize: "12px", color: "#64748b", marginTop: "4px" },
  dgFeatureGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" },
  dgFeatureCard: { textAlign: "left", display: "flex", flexDirection: "column", gap: "8px" },
  dgFeatureIcon: { fontSize: "32px", marginBottom: "8px" },
  dgFeatureTitle: { fontSize: "18px", fontWeight: "800", color: "#f8fafc", margin: 0 },
  dgFeatureDesc: { fontSize: "13px", color: "#94a3b8", lineHeight: "1.5", margin: 0 },
};
