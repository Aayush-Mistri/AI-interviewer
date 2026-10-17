import React, { useRef, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link, Navigate } from "react-router-dom";

const AGENT_WS_URL = import.meta.env.VITE_AGENT_WS_URL || "ws://localhost:3001";
const API_URL = import.meta.env.VITE_API_URL || AGENT_WS_URL.replace(/^ws/, "http");

// High quality futuristic AI interviewer avatar visualizer
const AI_AGENT_GIF = "https://cdn.dribbble.com/users/177029/screenshots/15916845/media/1d293f0b2f00735497ee3594f8ee96f4.gif";

// Real Project Default Technical Roles
const DEFAULT_JOBS = [
  {
    id: "ai-eng",
    role: "AI Engineer",
    companyName: "VaadIn AI Core",
    companyDescription: "Autonomous voice agents, streaming audio pipelines & LLM orchestration.",
    description: "Develop cutting-edge real-time audio pipelines, fine-tune voice models, and optimize low-latency LLM agent orchestration.",
    requirements: ["PyTorch/TensorFlow", "LangChain/LlamaIndex", "Vector DBs", "Python", "WebSockets"],
    extraInstructions: "Focus heavily on vector indexing speed, RAG evaluation metrics, and real-time streaming audio bottlenecks.",
    gradient: "linear-gradient(135deg, #00f5a0 0%, #00b4d8 100%)",
  },
  {
    id: "py-intern",
    role: "Python Backend Intern",
    companyName: "Core Systems Architecture",
    companyDescription: "High-throughput microservices and streaming cloud APIs.",
    description: "Develop scalable backend REST/WebSocket microservices using FastAPI, Express, and Django with event-driven queues.",
    requirements: ["Python", "FastAPI", "SQL", "Git", "AsyncIO"],
    extraInstructions: "Ask about async event loops, database indexing techniques, and clean API design principles.",
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
  },
  {
    id: "web-intern",
    role: "WebDev & UI/UX Intern",
    companyName: "PixelCraft Design Labs",
    companyDescription: "Next-gen glassmorphic and hyper-responsive user interfaces.",
    description: "Craft responsive, animated, dark-themed UI architectures with React, Vite, and real-time Web Audio API streaming.",
    requirements: ["React", "JavaScript/TypeScript", "CSS Modules", "Web Audio API"],
    extraInstructions: "Evaluate component modularity, state management best practices, and WebSockets integration.",
    gradient: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)",
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

// --- SVG Icons ---
function SearchIcon({ size = 18, color = "#9ca3af" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );
}

function ArrowRightIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  );
}

function ChevronDownIcon({ size = 14, color = "#9ca3af" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );
}

function CloseIcon({ size = 16, color = "#ffffff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}

function SparklesIcon({ size = 18, color = "#00f5a0" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
  );
}

// Social Icons
function GithubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#9ca3af">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  );
}

function TwitterXIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#9ca3af">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="#9ca3af">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.69 1.69 0 1 0 0-3.38 1.69 1.69 0 0 0 0 3.38m1.4 9.74V9.95H5.06v8.55h2.8z"/>
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="#9ca3af">
      <path d="M21.58 7.19a2.5 2.5 0 0 0-1.76-1.77C18.26 5 12 5 12 5s-6.26 0-7.82.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.41 4.81c.23.86.91 1.54 1.77 1.77C5.74 19 12 19 12 19s6.26 0 7.82-.42c.86-.23 1.54-.91 1.76-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM9.75 15.02V8.98L15 12l-5.25 3.02z"/>
    </svg>
  );
}

// Glowing Neon Swirl Ribbon SVG
function NeonSwirlRibbon() {
  return (
    <div style={{ position: "relative", width: "160px", height: "110px", margin: "0 auto 24px" }}>
      <svg width="160" height="110" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="neonGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f5a0" />
            <stop offset="50%" stopColor="#00b4d8" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
          <linearGradient id="neonGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e879f9" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#00f5a0" />
          </linearGradient>
          <filter id="swirlGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M 30,70 C 30,30 90,20 120,40 C 150,60 170,100 130,115 C 90,130 50,110 30,70 Z"
          stroke="url(#neonGradient1)"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          opacity="0.35"
          filter="url(#swirlGlow)"
        />
        <path
          d="M 28,72 C 26,38 80,26 126,42 C 165,56 178,98 136,112 C 92,126 50,114 30,70"
          stroke="url(#neonGradient1)"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 32,68 C 34,42 86,30 122,46 C 160,62 168,96 130,110 C 96,122 56,110 36,66"
          stroke="url(#neonGradient2)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 36,70 C 38,46 90,34 118,48 C 150,64 158,92 124,106"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
      </svg>
    </div>
  );
}

// 1. Top Announcement Bar (Configured for India & Global Tech Teams, No San Francisco, No Date)
function AnnouncementBanner({ onDismiss }) {
  return (
    <div style={styles.announcementBar}>
      <div style={styles.announcementContent}>
        <div style={styles.announcementLeft}>
          <span style={styles.announcementBrand}>VaadIn</span>
          <span style={styles.announcementText}>
            The future of technical hiring is conversational. <span style={styles.announcementDivider}>//</span> Built for Tech Hiring in India & Worldwide
          </span>
        </div>
        <div style={styles.announcementRight}>
          <a href="#jobs-section" style={styles.announcementLink}>
            Try AI Screening <span style={{ marginLeft: "4px" }}>→</span>
          </a>
          <button onClick={onDismiss} style={styles.announcementClose} aria-label="Dismiss banner">
            <CloseIcon size={14} color="#ffffff" />
          </button>
        </div>
      </div>
    </div>
  );
}

// 2. Navigation Bar
function Navbar({ user, onLogout, onOpenContact, onOpenSearch, onOpenPostJob, isDashboard = false }) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(null);

  return (
    <nav style={styles.navbar}>
      <div style={styles.navContainer}>
        {/* Left: Brand Logo & Navigation Links */}
        <div style={styles.navLeft}>
          <Link to={user ? "/home" : "/"} style={styles.navLogoLink}>
            <span style={styles.brandLogo}>VaadIn</span>
            <span style={styles.brandDot}></span>
          </Link>

          {!isDashboard ? (
            <div style={styles.navLinks}>
              {/* How It Works */}
              <a href="#how-it-works" style={styles.navLinkAnchor}>
                How It Works
              </a>

              {/* Core Features */}
              <a href="#features-section" style={styles.navLinkAnchor}>
                AI Interviewer Features
              </a>

              {/* Available Roles */}
              <a href="#jobs-section" style={styles.navLinkAnchor}>
                Active Roles
              </a>

              {/* Technical Architecture Dropdown */}
              <div
                style={styles.navItemWithDropdown}
                onMouseEnter={() => setDropdownOpen("tech")}
                onMouseLeave={() => setDropdownOpen(null)}
              >
                <button style={styles.navLinkButton}>
                  AI Architecture <ChevronDownIcon />
                </button>
                {dropdownOpen === "tech" && (
                  <div style={styles.dropdownMenu}>
                    <div style={styles.dropdownItem} onClick={() => navigate("/")}>
                      <div style={styles.dropdownTitle}>Context Injection (No RAG Loss)</div>
                      <div style={styles.dropdownDesc}>Full resume tokens injected directly into prompt</div>
                    </div>
                    <div style={styles.dropdownItem} onClick={() => navigate("/")}>
                      <div style={styles.dropdownTitle}>Real-Time Audio Loop</div>
                      <div style={styles.dropdownDesc}>Nova-3 STT + GPT-4o Brain + Aura-2 TTS</div>
                    </div>
                    <div style={styles.dropdownItem} onClick={() => navigate("/")}>
                      <div style={styles.dropdownTitle}>Qualitative Scoring Rubrics</div>
                      <div style={styles.dropdownDesc}>Automated technical feedback out of 100</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            user?.isCompany && (
              <div style={styles.navLinks}>
                <Link to="/leaderboard" style={styles.navCompanyLink}>
                  Leaderboard 🏆
                </Link>
                <button
                  onClick={onOpenPostJob ? onOpenPostJob : () => navigate("/post-job")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#00f5a0",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer",
                    padding: "6px 0",
                  }}
                >
                  + Post Role
                </button>
              </div>
            )
          )}
        </div>

        {/* Right: Search, Contact Us, Login, Sign Up */}
        <div style={styles.navRight}>
          <button style={styles.searchIconButton} onClick={onOpenSearch} aria-label="Search">
            <SearchIcon />
          </button>

          <button style={styles.contactUsButton} onClick={onOpenContact}>
            Contact Us
          </button>

          {user ? (
            <div style={styles.userProfileSection}>
              <span style={styles.userBadge}>
                {user.isCompany ? `🏢 ${user.companyName || user.name}` : `👤 ${user.name}`}
              </span>
              <button style={styles.loginPillButton} onClick={onLogout}>
                Log Out
              </button>
            </div>
          ) : (
            <>
              <button style={styles.loginPillButton} onClick={() => navigate("/login")}>
                Log In
              </button>
              <button style={styles.signUpPillButton} onClick={() => navigate("/signup")}>
                Sign Up Free
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// 3. Contact Us Modal
function ContactModal({ isOpen, onClose }) {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Contact VaadIn Team</h3>
          <button onClick={onClose} style={styles.modalCloseButton}><CloseIcon size={16} /></button>
        </div>
        {submitted ? (
          <div style={styles.modalSuccessBox}>
            <span style={{ fontSize: "36px" }}>✅</span>
            <h4>Thank you!</h4>
            <p style={{ color: "#9ca3af", fontSize: "14px" }}>We will get back to you with platform access details.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
            <p style={{ fontSize: "13px", color: "#9ca3af", margin: 0 }}>
              Connect with us for enterprise technical screening, university campus drives, or custom role configurations.
            </p>
            <input
              type="text"
              placeholder="Your Full Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.modalInput}
            />
            <input
              type="email"
              placeholder="Work / Personal Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.modalInput}
            />
            <textarea
              placeholder="Tell us about your screening volume & requirements..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ ...styles.modalInput, resize: "none" }}
            />
            <button type="submit" style={styles.modalSubmitButton}>
              Send Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// 4. Search Modal
function SearchModal({ isOpen, onClose, jobs = [] }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  if (!isOpen) return null;

  const filtered = jobs.filter(
    (j) =>
      j.role?.toLowerCase().includes(query.toLowerCase()) ||
      j.description?.toLowerCase().includes(query.toLowerCase()) ||
      j.requirements?.some?.((r) => r.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={{ ...styles.modalDialog, maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.searchBarBox}>
          <SearchIcon size={20} color="#00f5a0" />
          <input
            type="text"
            placeholder="Search roles (e.g. AI Engineer, Python, WebDev)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={styles.searchInputField}
            autoFocus
          />
          <button onClick={onClose} style={styles.modalCloseButton}><CloseIcon size={16} /></button>
        </div>

        <div style={styles.searchResultsList}>
          {filtered.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
              No matching positions found. Try "AI", "Python", or "Intern".
            </div>
          ) : (
            filtered.map((j) => (
              <div
                key={j.id}
                style={styles.searchResultItem}
                onClick={() => {
                  onClose();
                  navigate(`/apply/${j.id}`);
                }}
              >
                <div>
                  <div style={{ fontWeight: "700", color: "#ffffff", fontSize: "15px" }}>{j.role}</div>
                  <div style={{ fontSize: "12px", color: "#00f5a0", marginTop: "2px" }}>
                    🏢 {j.companyName || "VaadIn Partner"}
                  </div>
                </div>
                <button style={styles.searchApplyButton}>Take Screening →</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// 5. How It Works - The 4-Step Screening Flow
function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "Select Job Role",
      desc: "Choose from open software engineering positions or custom company openings.",
      icon: "🎯",
    },
    {
      num: "02",
      title: "Upload PDF Resume",
      desc: "Our engine extracts candidate experience & injects full context into the interviewer's prompt.",
      icon: "📄",
    },
    {
      num: "03",
      title: "2-Min Voice Screening",
      desc: "Engage in a live split-screen voice interview with our AI agent, probing depth and real projects.",
      icon: "🎙️",
    },
    {
      num: "04",
      title: "Instant Scoring & Video",
      desc: "Receive an objective score /100, question breakdown, video recording replay, and qualitative feedback.",
      icon: "📊",
    },
  ];

  return (
    <section id="how-it-works" style={styles.howItWorksSection}>
      <div style={styles.featuresInner}>
        <div style={styles.sectionHeaderCentered}>
          <div style={styles.badgeNeon}>🚀 STREAMLINED TECHNICAL HIRING LOOP</div>
          <h2 style={styles.featuresHeadline}>How VaadIn Works</h2>
          <p style={styles.featuresSubtitle}>
            A high-signal, voice-first screening pipeline that eliminates manual recruiter screening fatigue.
          </p>
        </div>

        <div style={styles.stepsGrid}>
          {steps.map((s) => (
            <div key={s.num} style={styles.stepCard}>
              <div style={styles.stepNumberBadge}>{s.num}</div>
              <div style={{ fontSize: "32px", margin: "16px 0 10px" }}>{s.icon}</div>
              <h3 style={styles.stepTitle}>{s.title}</h3>
              <p style={styles.stepDesc}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 6. Resources & Technical Insights Section
function ResourcesSection() {
  const resources = [
    {
      id: 1,
      badge1: "RESEARCH",
      badge2: "ARCHITECTURE",
      title: "Context Injection vs RAG in Resume Screening: Why Full Context Outperforms Vector DBs",
      author: "VaadIn AI Team",
      date: "Engineering Whitepaper",
      image: "/giff/473262431784525.jpg",
      active: true, // highlighted card
    },
    {
      id: 2,
      badge1: "TECH DEEP DIVE",
      badge2: "STREAMING",
      title: "Sub-300ms Audio Latency: WebSocket PCM16 Streaming for Human-like Interview Turn-Taking",
      author: "Audio Systems Lab",
      date: "System Architecture",
      image: "/giff/1597.jpg",
      active: false,
    },
    {
      id: 3,
      badge1: "HIRING INTELLIGENCE",
      badge2: "BENCHMARKS",
      title: "Eliminating Interviewer Bias: How Objective LLM Rubrics Rate Problem-Solving Depth",
      author: "Talent AI Research",
      date: "Hiring Report",
      image: "/giff/473262431784525.jpg",
      active: false,
    },
  ];

  return (
    <section style={styles.resourcesSection}>
      <div style={styles.sectionHeaderCentered}>
        <h2 style={styles.resourcesHeading}>
          Engineering Intelligence. <br />
          Built for modern technical hiring.
        </h2>
      </div>

      <div style={styles.carouselWrapper}>
        <div style={styles.carouselCardsGrid}>
          {resources.map((item) => {
            const isHighlight = item.active;
            return (
              <div
                key={item.id}
                style={{
                  ...styles.resourceCard,
                  ...(isHighlight ? styles.resourceCardHighlighted : {}),
                }}
              >
                <div style={styles.resourceCardVisual}>
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", opacity: 0.35 }}
                    />
                  )}
                  <div style={styles.resourceCardWatermark}>VaadIn</div>
                  <div style={styles.resourceCardBadgeOverlay}>
                    <span style={styles.launchTag}>⚡ AI INTERVIEWER CORE</span>
                  </div>
                  <div style={styles.resourceCardGlowSweep} />
                </div>

                <div style={styles.resourceCardBody}>
                  <div style={styles.resourceBadgesRow}>
                    <span style={styles.badgePink}>/{item.badge1}</span>
                    <span style={styles.badgeGray}>{item.badge2}</span>
                  </div>

                  <h3 style={styles.resourceCardTitle}>{item.title}</h3>

                  <div style={styles.resourceAuthorRow}>
                    <img src={item.avatar} alt={item.author} style={styles.resourceAuthorAvatar} />
                    <div>
                      <div style={styles.resourceAuthorName}>{item.author}</div>
                      <div style={styles.resourceDate}>{item.date}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// 7. CTA Section with Glowing Ribbon
function CtaBannerSection({ onAction }) {
  return (
    <section style={styles.ctaSection}>
      <div style={styles.ctaContainer}>
        <NeonSwirlRibbon />

        <h2 style={styles.ctaHeading}>Start conducting autonomous voice technical interviews</h2>
        <p style={styles.ctaSubtitle}>
          Screen candidates with natural conversations, instant scoring, synchronized video recordings,
          and custom role criteria—tailored for fast-growing engineering teams.
        </p>

        <div style={styles.ctaButtonsRow}>
          <a href="#jobs-section" style={styles.ctaPrimaryButton}>
            Take Practice Interview
          </a>
          <button style={styles.ctaSecondaryButton} onClick={onAction}>
            Hiring Company Sign Up <ArrowRightIcon />
          </button>
        </div>
      </div>
    </section>
  );
}

// 8. Footer (Configured for VaadIn AI Interviewer)
function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setTimeout(() => {
      setEmail("");
      setSubmitted(false);
    }, 3000);
  };

  return (
    <footer style={styles.footer}>
      <div style={styles.footerContainer}>
        {/* Top Split Section: Logo + Socials on Left, Newsletter on Right */}
        <div style={styles.footerTopSplit}>
          <div style={styles.footerBrandBlock}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={styles.footerLogo}>VaadIn</span>
              <span style={styles.brandDot}></span>
            </div>
            <p style={{ color: "#9ca3af", fontSize: "14px", margin: 0, maxWidth: "340px", lineHeight: "1.6" }}>
              Autonomous Voice-First AI Technical Interviewer platform. Built with passion in India 🇮🇳 for global engineering teams.
            </p>
            <div style={styles.footerSocialsRow}>
              <a href="https://github.com" target="_blank" rel="noreferrer" style={styles.socialLink} aria-label="GitHub"><GithubIcon /></a>
              <a href="https://x.com" target="_blank" rel="noreferrer" style={styles.socialLink} aria-label="X / Twitter"><TwitterXIcon /></a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" style={styles.socialLink} aria-label="LinkedIn"><LinkedinIcon /></a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" style={styles.socialLink} aria-label="YouTube"><YoutubeIcon /></a>
            </div>
          </div>

          <div style={styles.footerNewsletterBlock}>
            <h4 style={styles.newsletterHeading}>Stay updated on AI Interviewing updates.</h4>
            <form onSubmit={handleSubscribe} style={styles.newsletterForm}>
              <input
                type="email"
                placeholder="Enter your email*"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.newsletterInput}
                required
              />
              <button type="submit" style={styles.newsletterSubmitButton}>
                {submitted ? "Joined ✓" : "Subscribe"}
              </button>
            </form>
            <p style={styles.newsletterDisclaimer}>
              By subscribing, you agree to our <a href="#privacy" style={{ color: "#00f5a0", textDecoration: "none" }}>Privacy Policy</a>. No spam, ever.
            </p>
          </div>
        </div>

        {/* Multi-Column Navigation Links */}
        <div style={styles.footerColumnsGrid}>
          <div style={styles.footerCol}>
            <h5 style={styles.footerColTitle}>AI Platform</h5>
            <ul style={styles.footerList}>
              <li><a href="#how-it-works" style={styles.footerLink}>Voice Interview Room</a></li>
              <li><a href="#features-section" style={styles.footerLink}>Resume Context Injection</a></li>
              <li><a href="#features-section" style={styles.footerLink}>Instant Technical Scoring</a></li>
              <li><a href="#features-section" style={styles.footerLink}>Session Video Archiving</a></li>
            </ul>
          </div>

          <div style={styles.footerCol}>
            <h5 style={styles.footerColTitle}>For Candidates</h5>
            <ul style={styles.footerList}>
              <li><a href="#jobs-section" style={styles.footerLink}>Browse Open Positions</a></li>
              <li><a href="#jobs-section" style={styles.footerLink}>AI Engineer Screening</a></li>
              <li><a href="#jobs-section" style={styles.footerLink}>Python Backend Screening</a></li>
              <li><a href="#jobs-section" style={styles.footerLink}>WebDev Frontend Screening</a></li>
            </ul>
          </div>

          <div style={styles.footerCol}>
            <h5 style={styles.footerColTitle}>For Companies</h5>
            <ul style={styles.footerList}>
              <li><Link to="/company/jobs" style={styles.footerLink}>Company Jobs Dashboard 💼</Link></li>
              <li><Link to="/signup" style={styles.footerLink}>Company Registration</Link></li>
              <li><Link to="/post-job" style={styles.footerLink}>Post Custom AI Roles</Link></li>
              <li><Link to="/leaderboard" style={styles.footerLink}>Candidate Leaderboard 🏆</Link></li>
            </ul>
          </div>

          <div style={styles.footerCol}>
            <h5 style={styles.footerColTitle}>Architecture</h5>
            <ul style={styles.footerList}>
              <li><a href="#features-section" style={styles.footerLink}>Deepgram Voice Agent API</a></li>
              <li><a href="#features-section" style={styles.footerLink}>Nova-3 Speech Recognition</a></li>
              <li><a href="#features-section" style={styles.footerLink}>GPT-4o Technical Brain</a></li>
              <li><a href="#features-section" style={styles.footerLink}>Aura-2 Voice Synthesis</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={styles.footerBottomBar}>
          <div style={styles.footerLegalLinks}>
            <span style={{ color: "#9ca3af", fontSize: "13px" }}>India & Global Tech Talent</span>
            <span style={{ color: "#374151" }}>|</span>
            <a href="#terms" style={styles.footerLegalItem}>Terms</a>
            <span style={{ color: "#374151" }}>|</span>
            <a href="#privacy" style={styles.footerLegalItem}>Privacy</a>
          </div>
          <div style={styles.footerCopyrightText}>
            Copyright © 2026 VaadIn. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}

// Post Job Modal directly on Home Page
function PostJobModal({ isOpen, onClose, onJobCreated, user }) {
  const [role, setRole] = useState("");
  const [companyName, setCompanyName] = useState(user?.companyName || user?.name || "");
  const [companyDescription, setCompanyDescription] = useState(user?.companyDescription || "");
  const [requirements, setRequirements] = useState("");
  const [extraInstructions, setExtraInstructions] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

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
          companyName: companyName || user?.name || "VaadIn Partner",
          companyDescription,
          requirements: requirements.split(",").map((s) => s.trim()).filter(Boolean),
          extraInstructions,
          companyId: user?.id,
          postedBy: user?.name || "Company",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not post job.");

      setNotice("Role published! The AI interviewer is now live on the home page.");
      if (onJobCreated) {
        onJobCreated({
          id: `custom-${Date.now()}`,
          role,
          companyName: companyName || user?.name || "VaadIn Partner",
          description: companyDescription || `Live technical screening for ${role} with AI interviewer.`,
          requirements: requirements.split(",").map((s) => s.trim()).filter(Boolean),
          extraInstructions,
          gradient: "linear-gradient(135deg, #00f5a0 0%, #00b4d8 100%)",
        });
      }
      setTimeout(() => {
        onClose();
        setNotice("");
        setRole("");
        setRequirements("");
        setExtraInstructions("");
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={{ ...styles.modalDialog, maxWidth: "620px" }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Post Role to VaadIn Home Page</h3>
          <button onClick={onClose} style={styles.modalCloseButton}><CloseIcon size={16} /></button>
        </div>
        <form onSubmit={handleSubmitJob} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Role Title *</label>
            <input
              type="text"
              placeholder="e.g. Lead Voice AI Infrastructure Engineer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={styles.modalInput}
              required
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Company Name</label>
            <input
              type="text"
              placeholder="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              style={styles.modalInput}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Key Skills & Criteria (Comma separated)</label>
            <textarea
              placeholder="e.g. WebRTC, Node.js, WebSockets, Deepgram, PyTorch"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              style={{ ...styles.modalInput, height: "60px", resize: "none" }}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={{ ...styles.inputLabel, color: "#00f5a0" }}>
              🤖 Injected AI Interviewer Instructions
            </label>
            <textarea
              placeholder="e.g. Probe the candidate on handling audio buffer underruns, examine how they handle WebSocket packet loss..."
              value={extraInstructions}
              onChange={(e) => setExtraInstructions(e.target.value)}
              style={{ ...styles.modalInput, height: "80px", resize: "none", borderColor: "rgba(0, 245, 160, 0.4)" }}
            />
          </div>
          {error && <p style={styles.errorMessage}>{error}</p>}
          {notice && <p style={styles.successMessage}>{notice}</p>}
          <button type="submit" disabled={loading} style={styles.modalSubmitButton}>
            {loading ? "Publishing..." : "Publish Role to Home Page"}
          </button>
        </form>
      </div>
    </div>
  );
}

// 5. Features Grid Section (Specifically for our AI Interviewer)
function FeaturesSection() {
  return (
    <section id="features-section" style={styles.featuresSection}>
      <div style={styles.featuresInner}>
        <div style={styles.sectionHeaderCentered}>
          <div style={styles.badgeNeon}>⚡ CORE PLATFORM CAPABILITIES</div>
          <h2 style={styles.featuresHeadline}>Features Designed for AI Technical Interviewing</h2>
          <p style={styles.featuresSubtitle}>
            Built from the ground up for technical evaluations, our voice agent stack delivers
            unmatched screening precision, objective scoring, and complete recruiter visibility.
          </p>
        </div>

        <div style={styles.featuresGrid}>
          <div style={styles.featureCard}>
            <div style={styles.featureIconBox}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00f5a0" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <h3 style={styles.featureTitle}>Resume Context Injection</h3>
            <p style={styles.featureDesc}>
              Rather than generic chatbot quizzes, the candidate's parsed PDF resume is directly injected
              into the AI interviewer's system prompt to probe real projects, tools, and technical decisions.
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIconBox}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00f5a0" strokeWidth="2">
                <path d="M12 2v20M17 5v14M7 9v6M22 10v4M2 10v4" />
              </svg>
            </div>
            <h3 style={styles.featureTitle}>Real-Time Conversational Voice</h3>
            <p style={styles.featureDesc}>
              Microphone audio streams through WebSockets to a synchronized STT and TTS voice loop.
              Built-in barge-in handling and rapid turn-taking feel like speaking to a real engineering manager.
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIconBox}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00f5a0" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <h3 style={styles.featureTitle}>Video & Audio Session Archival</h3>
            <p style={styles.featureDesc}>
              Captures candidate camera video and audio simultaneously. Hiring managers can review full
              session recordings alongside time-synced transcripts directly inside the candidate portal.
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIconBox}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00f5a0" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3 style={styles.featureTitle}>Instant Objective Rubric Scoring</h3>
            <p style={styles.featureDesc}>
              Post-interview analysis calculates a fair score out of 100 based on technical depth,
              problem-solving clarity, and resume verification—eliminating unconscious interviewer bias.
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIconBox}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00f5a0" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <h3 style={styles.featureTitle}>Custom Company Rubrics & Probes</h3>
            <p style={styles.featureDesc}>
              Hiring teams can post openings with special prompt guidelines—instructing the AI on specific
              frameworks, concurrency questions, or architecture challenges to grill candidates on.
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIconBox}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00f5a0" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <h3 style={styles.featureTitle}>Recruiter Leaderboards & Excel Export</h3>
            <p style={styles.featureDesc}>
              Rank candidates automatically by overall score marks. Review candidate summaries, examine
              full conversation transcripts, and export evaluation data into spreadsheets effortlessly.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// Marketing Landing Page (Unauthenticated)
// ==========================================
function LandingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser());
  const [showBanner, setShowBanner] = useState(true);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [allJobs, setAllJobs] = useState(DEFAULT_JOBS);

  useEffect(() => {
    const handleStorage = () => setUser(getStoredUser());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (user) {
      navigate("/home", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch(`${API_URL}/api/jobs`);
        const data = await res.json();
        if (data?.jobs?.length) {
          const merged = [...data.jobs, ...DEFAULT_JOBS];
          const uniqueMap = new Map();
          merged.forEach((j) => {
            if (j.id && !uniqueMap.has(j.id)) {
              uniqueMap.set(j.id, j);
            }
          });
          setAllJobs(Array.from(uniqueMap.values()));
        }
      } catch (e) {
        console.error("Could not fetch custom jobs", e);
      }
    }
    fetchJobs();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    window.dispatchEvent(new Event("storage"));
  };

  if (user) return null;

  return (
    <div style={styles.pageContainer}>
      {showBanner && <AnnouncementBanner onDismiss={() => setShowBanner(false)} />}

      <Navbar
        user={null}
        onLogout={handleLogout}
        onOpenContact={() => setIsContactOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Hero Section */}
      <section style={styles.heroSection}>
        <div style={styles.heroInner}>
          <div style={styles.heroBadgeTop}>
            <SparklesIcon size={14} color="#00f5a0" />
            <span>AUTONOMOUS VOICE-FIRST TECHNICAL SCREENING</span>
          </div>

          <h1 style={styles.heroHeadline}>
            VaadIn: AI-Powered Voice Technical Screening
          </h1>

          <p style={styles.heroSubtitle}>
            A high-signal, real-time voice interview platform for hiring teams and candidates.
            Upload a resume, experience context-injected technical probing, and receive objective scores
            with video archives in just two minutes. No screening fatigue. Zero interviewer bias.
          </p>

          <div style={styles.heroActionButtons}>
            <button
              style={styles.heroPrimaryButton}
              onClick={() => navigate("/signup")}
            >
              Get Started Free →
            </button>
            <button
              style={styles.heroSecondaryButton}
              onClick={() => navigate("/login")}
            >
              Sign In to Account
            </button>
          </div>

          {/* Quick Metrics Ticker */}
          <div style={styles.heroStatsRow}>
            <div style={styles.heroStatItem}>
              <div style={styles.heroStatVal}>2 Min</div>
              <div style={styles.heroStatLbl}>Focused Voice Screening</div>
            </div>
            <div style={styles.heroStatDivider} />
            <div style={styles.heroStatItem}>
              <div style={styles.heroStatVal}>100%</div>
              <div style={styles.heroStatLbl}>Resume Context-Injected</div>
            </div>
            <div style={styles.heroStatDivider} />
            <div style={styles.heroStatItem}>
              <div style={styles.heroStatVal}>Instant</div>
              <div style={styles.heroStatLbl}>Scoring & Video Replay</div>
            </div>
            <div style={styles.heroStatDivider} />
            <div style={styles.heroStatItem}>
              <div style={styles.heroStatVal}>Zero</div>
              <div style={styles.heroStatLbl}>Manual Scheduling Lag</div>
            </div>
          </div>
        </div>
      </section>

      <HowItWorksSection />
      <FeaturesSection />

      {/* Roles Preview Section for Unauthenticated Users */}
      <section id="jobs-section" style={styles.jobsSection}>
        <div style={styles.jobsInner}>
          <div style={styles.sectionHeaderCentered}>
            <div style={styles.badgeNeon}>🎯 OPEN TECHNICAL ROLES</div>
            <h2 style={styles.jobsHeadline}>Explore Live Positions</h2>
            <p style={styles.jobsSubtitle}>
              Sign up or log in to take automated AI voice technical screening for any role below.
            </p>
          </div>

          <div style={styles.jobCardsGrid}>
            {allJobs.map((job) => (
              <div key={job.id} style={styles.jobCardItem}>
                <div style={{ ...styles.jobCardTopGlow, background: job.gradient || "linear-gradient(135deg, #00f5a0, #00b4d8)" }} />
                <div style={styles.jobCardHeader}>
                  <div>
                    <h3 style={styles.jobRoleName}>{job.role}</h3>
                    <span style={styles.jobCompanyTag}>
                      🏢 {job.companyName || job.companyDetails?.name || "VaadIn Partner"}
                    </span>
                  </div>
                  <span style={styles.jobLivePill}>AI Ready</span>
                </div>

                <p style={styles.jobDescriptionText}>{job.description}</p>

                <div style={styles.jobReqsWrap}>
                  {(Array.isArray(job.requirements) ? job.requirements : [job.requirements]).map((req) => (
                    <span key={req} style={styles.jobReqTag}>
                      {req}
                    </span>
                  ))}
                </div>

                <button
                  style={styles.jobApplyBtn}
                  onClick={() => navigate("/signup")}
                >
                  Sign Up to Take Screening →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ResourcesSection />
      <CtaBannerSection onAction={() => navigate("/signup")} />
      <Footer />

      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} jobs={allJobs} />
    </div>
  );
}

// ==========================================
// Authenticated Home Page (User Dashboard)
// ==========================================
function HomePage() {
  const navigate = useNavigate();
  const [allJobs, setAllJobs] = useState(DEFAULT_JOBS);
  const [showBanner, setShowBanner] = useState(true);
  const [user, setUser] = useState(getStoredUser());
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);

  useEffect(() => {
    const handleStorage = () => setUser(getStoredUser());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    window.dispatchEvent(new Event("storage"));
    navigate("/");
  };

  const handleJobCreated = (newJob) => {
    setAllJobs((prev) => [newJob, ...prev]);
  };

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

  if (!user) return null;

  return (
    <div style={styles.pageContainer}>
      <Navbar
        user={user}
        onLogout={handleLogout}
        onOpenContact={() => setIsContactOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenPostJob={() => setIsPostJobOpen(true)}
        isDashboard={true}
      />

      <section style={{ ...styles.jobsSection, paddingTop: "40px", minHeight: "80vh" }}>
        <div style={styles.jobsInner}>
          {/* User Command Center */}
          <div style={styles.userCommandCenter}>
            <div style={styles.userCommandHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={styles.userCommandAvatar}>
                  {user.isCompany ? "🏢" : "👤"}
                </div>
                <div>
                  <div style={styles.userCommandTitle}>
                    {user.isCompany ? (user.companyName || user.name) : user.name}
                    <span style={styles.userRoleTag}>
                      {user.isCompany ? "Hiring Company Portal" : "Candidate Account"}
                    </span>
                  </div>
                  <div style={styles.userCommandSub}>
                    {user.isCompany
                      ? "Active company recruiter account. You can post roles with custom prompt rubrics, review live submissions, and view candidate leaderboard marks."
                      : "Candidate account. Choose any technical role below to upload your PDF resume and begin your 2-minute voice screening."}
                  </div>
                </div>
              </div>

              <div style={styles.userCommandActions}>
                {user.isCompany ? (
                  <>
                    <button
                      style={styles.postJobCommandBtn}
                      onClick={() => navigate("/company/jobs")}
                    >
                      Jobs Dashboard 💼
                    </button>
                    <button
                      style={styles.postJobCommandBtn}
                      onClick={() => setIsPostJobOpen(true)}
                    >
                      + Post New Role
                    </button>
                    <button
                      style={styles.leaderboardCommandBtn}
                      onClick={() => navigate("/leaderboard")}
                    >
                      Candidate Leaderboard 🏆
                    </button>
                  </>
                ) : (
                  <button
                    style={styles.postJobCommandBtn}
                    onClick={() => setIsSearchOpen(true)}
                  >
                    🔍 Search Roles
                  </button>
                )}
              </div>
            </div>
          </div>

          <div style={styles.sectionHeaderCentered}>
            <div style={styles.badgeNeon}>🎯 LIVE APPLICATION ROLES</div>
            <h2 style={styles.jobsHeadline}>Available Technical Positions</h2>
            <p style={styles.jobsSubtitle}>
              Select a position below to upload your resume and experience VaadIn's autonomous voice screening live.
            </p>
          </div>

          <div style={styles.jobCardsGrid}>
            {allJobs.map((job) => (
              <div key={job.id} style={styles.jobCardItem}>
                <div style={{ ...styles.jobCardTopGlow, background: job.gradient || "linear-gradient(135deg, #00f5a0, #00b4d8)" }} />
                <div style={styles.jobCardHeader}>
                  <div>
                    <h3 style={styles.jobRoleName}>{job.role}</h3>
                    <span style={styles.jobCompanyTag}>
                      🏢 {job.companyName || job.companyDetails?.name || "VaadIn Partner"}
                    </span>
                  </div>
                  <span style={styles.jobLivePill}>AI Ready</span>
                </div>

                <p style={styles.jobDescriptionText}>{job.description}</p>

                <div style={styles.jobReqsWrap}>
                  {(Array.isArray(job.requirements) ? job.requirements : [job.requirements]).map((req) => (
                    <span key={req} style={styles.jobReqTag}>
                      {req}
                    </span>
                  ))}
                </div>

                {job.extraInstructions && (
                  <div style={styles.jobCustomPromptSnippet}>
                    🤖 <b>Injected AI Instructions:</b> "{job.extraInstructions.slice(0, 95)}..."
                  </div>
                )}

                <button
                  style={styles.jobApplyBtn}
                  onClick={() => navigate(`/apply/${job.id}`)}
                >
                  Apply & Take Voice Screening →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} jobs={allJobs} />
      <PostJobModal
        isOpen={isPostJobOpen}
        onClose={() => setIsPostJobOpen(false)}
        onJobCreated={handleJobCreated}
        user={user}
      />
    </div>
  );
}


function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getStoredUser()) {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

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
      navigate("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.authContainer}>
      <div style={styles.authTopHeader}>
        <Link to="/" style={styles.navLogoLink}>
          <span style={styles.brandLogo}>VaadIn</span>
          <span style={styles.brandDot}></span>
        </Link>
        <button style={styles.backButton} onClick={() => navigate("/")}>
          ← Back to Platform
        </button>
      </div>

      <div style={styles.authCardBox}>
        <h2 style={styles.authTitleText}>Account Log In</h2>
        <p style={styles.authDescText}>Access your candidate profile or company recruiter portal.</p>

        <form onSubmit={handleLogin} style={styles.authForm}>
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.authInputField}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.authInputField}
              required
            />
          </div>

          {error && <p style={styles.errorMessage}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.authSubmitBtn}>
            {loading ? "Authenticating..." : "Log In to VaadIn"}
          </button>
        </form>

        <p style={styles.authFooterLinkText}>
          Don't have an account yet?{" "}
          <Link to="/signup" style={{ color: "#00f5a0", fontWeight: "700", textDecoration: "none" }}>
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}

// ==========================================
// Authentication: Signup Page
// ==========================================
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

  useEffect(() => {
    if (getStoredUser()) {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

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
      navigate("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.authContainer}>
      <div style={styles.authTopHeader}>
        <Link to="/" style={styles.navLogoLink}>
          <span style={styles.brandLogo}>VaadIn</span>
          <span style={styles.brandDot}></span>
        </Link>
        <button style={styles.backButton} onClick={() => navigate("/")}>
          ← Back to Platform
        </button>
      </div>

      <div style={{ ...styles.authCardBox, maxWidth: "560px" }}>
        <h2 style={styles.authTitleText}>Create VaadIn Account</h2>
        <p style={styles.authDescText}>
          Join VaadIn to take verified voice technical screenings or configure autonomous recruiting pipelines.
        </p>

        {/* Company switch toggle */}
        <div style={styles.companyToggleBox}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "22px" }}>🏢</span>
            <div>
              <div style={{ fontWeight: "700", color: "#ffffff", fontSize: "14px" }}>
                Hiring Organization / Company Account
              </div>
              <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                Post custom roles, define AI interviewer probe guidelines, and view ranked candidate scoreboards.
              </div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={isCompany}
            onChange={(e) => setIsCompany(e.target.checked)}
            style={styles.toggleCheckbox}
          />
        </div>

        <form onSubmit={handleSignup} style={styles.authForm}>
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>{isCompany ? "Contact Representative Name" : "Full Candidate Name"}</label>
            <input
              type="text"
              placeholder="e.g. Aayush Mistri"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.authInputField}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.authInputField}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Password (Min 6 Characters)</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.authInputField}
              required
            />
          </div>

          {isCompany && (
            <div style={styles.companyExpandedBox}>
              <div style={{ fontWeight: "700", color: "#00f5a0", fontSize: "13px" }}>
                🏢 Company Profile
              </div>
              <input
                type="text"
                placeholder="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                style={styles.authInputField}
                required
              />
              <textarea
                placeholder="Brief company overview or engineering focus..."
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                style={{ ...styles.authInputField, height: "70px", resize: "none" }}
              />
            </div>
          )}

          {error && <p style={styles.errorMessage}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.authSubmitBtn}>
            {loading ? "Creating Account..." : isCompany ? "Register as Hiring Company" : "Sign Up as Candidate"}
          </button>
        </form>

        <p style={styles.authFooterLinkText}>
          Already registered?{" "}
          <Link to="/login" style={{ color: "#00f5a0", fontWeight: "700", textDecoration: "none" }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

// ==========================================
// Company Job Poster Page
// ==========================================
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
          companyName: companyName || user?.name || "VaadIn Partner",
          companyDescription,
          requirements: requirements.split(",").map((s) => s.trim()).filter(Boolean),
          extraInstructions,
          companyId: user?.id,
          postedBy: user?.name || "Company",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not post job.");

      setNotice("Role successfully published! Custom prompt instructions injected into the AI interviewer.");
      setTimeout(() => navigate("/home"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.authContainer}>
      <div style={styles.authTopHeader}>
        <Link to="/" style={styles.navLogoLink}>
          <span style={styles.brandLogo}>VaadIn</span>
          <span style={styles.brandDot}></span>
        </Link>
        <button style={styles.backButton} onClick={() => navigate("/")}>
          ← Back to Roles
        </button>
      </div>

      <div style={{ ...styles.authCardBox, maxWidth: "680px" }}>
        <h2 style={styles.authTitleText}>Post Role & Configure AI Interviewer</h2>
        <p style={styles.authDescText}>
          Define target candidate skills and inject custom probe instructions directly into the live AI agent's system prompt.
        </p>

        <form onSubmit={handleSubmitJob} style={styles.authForm}>
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Job Title *</label>
            <input
              type="text"
              placeholder="e.g. Lead Machine Learning Engineer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={styles.authInputField}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Hiring Company Name</label>
            <input
              type="text"
              placeholder="e.g. Acme Tech India"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              style={styles.authInputField}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Required Skills (Comma separated)</label>
            <textarea
              placeholder="e.g. PyTorch, Distributed Training, WebSockets, CUDA, High-Throughput APIs"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              style={{ ...styles.authInputField, height: "70px", resize: "none" }}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={{ ...styles.inputLabel, color: "#00f5a0" }}>
              🤖 Injected AI Interviewer System Prompt Instructions
            </label>
            <textarea
              placeholder="e.g. Ask the candidate how they handle high concurrency in Node.js, probe deeply into their resume's microservices project, and evaluate their distributed locks implementation."
              value={extraInstructions}
              onChange={(e) => setExtraInstructions(e.target.value)}
              style={{
                ...styles.authInputField,
                height: "100px",
                resize: "none",
                borderColor: "rgba(0, 245, 160, 0.4)",
              }}
            />
            <span style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px", display: "block" }}>
              💡 These instructions will be directly injected into the live AI agent's system prompt during candidate screenings.
            </span>
          </div>

          {error && <p style={styles.errorMessage}>{error}</p>}
          {notice && <p style={styles.successMessage}>{notice}</p>}

          <button type="submit" disabled={loading} style={styles.authSubmitBtn}>
            {loading ? "Publishing Role..." : "Deploy Role & Configure AI Interviewer"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// Candidate Resume Upload & Session Launcher
// ==========================================
function UploadPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [resumeFile, setResumeFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resumeSession, setResumeSession] = useState(null);
  const [selectedJob, setSelectedJob] = useState(() => DEFAULT_JOBS.find((j) => j.id === jobId));

  useEffect(() => {
    async function loadJob() {
      if (!selectedJob) {
        try {
          const res = await fetch(`${API_URL}/api/jobs`);
          const data = await res.json();
          const found = data?.jobs?.find((j) => j.id === jobId);
          if (found) setSelectedJob(found);
        } catch (e) {
          console.error(e);
        }
      }
    }
    loadJob();
  }, [jobId, selectedJob]);

  async function uploadResume() {
    setError("");
    setNotice("");
    if (!resumeFile) {
      setError("Please select a PDF resume file.");
      return;
    }
    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jobRole", selectedJob?.role || "General Technical Role");
    if (selectedJob?.id) formData.append("jobId", selectedJob.id);
    if (selectedJob?.companyName) formData.append("companyName", selectedJob.companyName);

    try {
      setUploading(true);
      const response = await fetch(`${API_URL}/resume`, { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not parse candidate resume.");
      setResumeSession(data);
      setNotice(`Resume successfully verified for ${data.candidateName}. Ready for voice screening.`);
    } catch (err) {
      setError(err.message || "Could not upload resume.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={styles.authContainer}>
      <div style={styles.authTopHeader}>
        <Link to="/" style={styles.navLogoLink}>
          <span style={styles.brandLogo}>VaadIn</span>
          <span style={styles.brandDot}></span>
        </Link>
        <button style={styles.backButton} onClick={() => navigate("/")}>
          ← Back to Roles
        </button>
      </div>

      <div style={styles.authCardBox}>
        <h2 style={styles.authTitleText}>Apply for {selectedJob?.role || "Position"}</h2>
        <p style={styles.authDescText}>
          Upload your PDF resume. VaadIn extracts your projects and skills to conduct a personalized, context-injected technical voice screening.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "16px" }}>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setResumeFile(e.target.files[0])}
            style={styles.fileInput}
          />
          <button
            onClick={uploadResume}
            disabled={!resumeFile || uploading}
            style={styles.authSubmitBtn}
          >
            {uploading ? "Extracting Resume Context..." : "Verify Resume & Prepare Interview"}
          </button>
        </div>

        {error && <p style={styles.errorMessage}>{error}</p>}
        {notice && <p style={styles.successMessage}>{notice}</p>}

        {resumeSession && (
          <div style={styles.verifiedCandidateBox}>
            <p style={{ margin: 0, fontWeight: "700", color: "#00f5a0", fontSize: "15px" }}>
              ✅ Candidate Verified: {resumeSession.candidateName}
            </p>
            <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "6px" }}>
              🎥 Camera & Microphone stream will be active during the interview for evaluation archiving.
            </p>
            <button
              onClick={() => navigate(`/interview/${resumeSession.sessionId}`)}
              style={styles.launchInterviewBtn}
            >
              Launch Live AI Interview Room 🚀
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// Live Split-Screen Interview Room
// ==========================================
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
  const isUploadingVideoRef = useRef(false);

  const [connected, setConnected] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [stopping, setStopping] = useState(false);
  const [latestSubtitle, setLatestSubtitle] = useState({
    speaker: "AI",
    text: "Connecting to VaadIn Voice Agent...",
  });

  useEffect(() => {
    let timer;
    if (connected && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
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
            speaker: msg.role === "assistant" ? "VaadIn AI" : "You",
            text: msg.content,
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
    if (isUploadingVideoRef.current) return;
    isUploadingVideoRef.current = true;

    // Ensure all mediaRecorder chunks are flushed
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      await new Promise((resolve) => {
        mediaRecorderRef.current.onstop = resolve;
        mediaRecorderRef.current.stop();
      });
    }

    if (!videoChunksRef.current.length) {
      isUploadingVideoRef.current = false;
      return;
    }

    const videoBlob = new Blob(videoChunksRef.current, { type: "video/webm" });

    try {
      // Send video file directly to backend API (/api/upload-video)
      // Node.js server uploads directly to Backblaze B2 without browser CORS blocking
      const formData = new FormData();
      formData.append("video", videoBlob, `interview_${sessionId}.webm`);
      formData.append("sessionId", sessionId);

      const response = await fetch(`${API_URL}/api/upload-video`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      console.log("Uploaded video response:", data);
    } catch (err) {
      console.error("Video upload error:", err);
    } finally {
      isUploadingVideoRef.current = false;
    }
  }

  function safeParseEvent(data) {
    try {
      return JSON.parse(data);
    } catch {
      return { type: "Message", message: data };
    }
  }

  async function startMediaCapture() {
    // 360p resolution capture (640x360, 24fps)
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 24 } },
    });
    streamRef.current = stream;

    if (videoElementRef.current) {
      videoElementRef.current.srcObject = stream;
    }

    try {
      videoChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus") ? "video/webm;codecs=vp8,opus" : "video/webm",
        videoBitsPerSecond: 250000, // optimized for 360p quality
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
    <div style={styles.interviewScreenContainer}>
      {/* Top Floating Control Bar */}
      <div style={styles.interviewTopBar}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={styles.interviewBrand}>VaadIn Live Interview</span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={styles.recordingRedDot} />
            <span style={styles.recordingStatusText}>
              STREAMING &nbsp;|&nbsp; TIME LEFT: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
            </span>
          </div>
        </div>

        <button
          onClick={stopInterview}
          disabled={stopping}
          style={styles.endInterviewBtn}
        >
          {stopping ? "Calculating Score..." : "End Interview"}
        </button>
      </div>

      {/* 50/50 Split Screen Stage */}
      <div style={styles.splitStage}>
        {/* Left 50%: AI Agent Visualizer Screen */}
        <div style={styles.aiScreenPanel}>
          <div style={styles.aiVisualizerOrbWrapper}>
            <img src={AI_AGENT_GIF} alt="VaadIn AI Agent" style={styles.aiOrbImage} />
            <div style={styles.aiOrbPulseRing} />
          </div>
          <span style={styles.stageLabel}>🤖 VaadIn AI Technical Interviewer</span>
        </div>

        {/* Right 50%: Live Candidate Camera */}
        <div style={styles.candidateScreenPanel}>
          <video ref={videoElementRef} autoPlay muted playsInline style={styles.candidateVideoElem} />
          <span style={styles.stageLabel}>👤 Candidate Camera (You)</span>
        </div>
      </div>

      {/* Netflix-Style Subtitle Overlay at Bottom */}
      <div style={styles.subtitlesFloatingWrapper}>
        <div style={styles.subtitlesPillBox}>
          <span
            style={{
              color: latestSubtitle.speaker === "You" ? "#38bdf8" : "#00f5a0",
              fontWeight: "800",
              marginRight: "8px",
            }}
          >
            [{latestSubtitle.speaker}]
          </span>
          <span>{latestSubtitle.text}</span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Candidate Evaluation Page
// ==========================================
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

  if (loading || !evaluation) {
    return (
      <div style={styles.authContainer}>
        <div style={styles.evalLoadingCard}>
          <div style={styles.evalSpinner} />
          <h3 style={{ color: "#ffffff", marginTop: "16px" }}>Analyzing Candidate Technical Response...</h3>
          <p style={{ color: "#9ca3af", fontSize: "14px" }}>
            VaadIn evaluator is processing your transcript, technical depth & evidence.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.authContainer}>
      <div style={styles.authTopHeader}>
        <Link to="/" style={styles.navLogoLink}>
          <span style={styles.brandLogo}>VaadIn</span>
          <span style={styles.brandDot}></span>
        </Link>
        <button style={styles.backButton} onClick={() => navigate("/")}>
          ← Return to Home
        </button>
      </div>

      <div style={{ ...styles.authCardBox, maxWidth: "720px" }}>
        {/* Glowing Score Ring */}
        <div style={styles.evalScoreCircle}>
          <span style={styles.evalScoreNumber}>{evaluation?.score || 0}</span>
          <span style={styles.evalScoreLabel}>/ 100 Marks</span>
        </div>

        <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#ffffff", margin: "0 0 6px" }}>
          Technical Interview Complete
        </h2>
        <p style={{ color: "#9ca3af", fontSize: "14px", margin: "0 0 20px" }}>
          Objective evaluation summary & qualitative feedback computed by VaadIn AI.
        </p>

        {evaluation.summary && (
          <div style={styles.evalSummaryBox}>
            <h4 style={{ margin: "0 0 8px", fontSize: "14px", color: "#00f5a0" }}>Evaluation Notes & Feedback</h4>
            <p style={{ margin: 0, fontSize: "14px", color: "#cbd5e1", lineHeight: "1.65" }}>
              {evaluation.summary}
            </p>
          </div>
        )}

        <div style={{ margin: "16px 0", padding: "12px", backgroundColor: "rgba(255, 255, 255, 0.04)", borderRadius: "10px", fontSize: "13px", color: "#cbd5e1", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "10px" }}>
          <span>⏱️ <b>Start:</b> {evaluation.startedAt ? new Date(evaluation.startedAt).toLocaleTimeString() : "N/A"}</span>
          <span>⌛ <b>End:</b> {evaluation.endedAt ? new Date(evaluation.endedAt).toLocaleTimeString() : "N/A"}</span>
          {evaluation.resumeUrl && (
            <a
              href={evaluation.resumeUrl.startsWith("http") ? evaluation.resumeUrl : `${API_URL}${evaluation.resumeUrl}`}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#00f5a0", fontWeight: "700", textDecoration: "none" }}
            >
              📄 View Resume PDF
            </a>
          )}
        </div>

        {evaluation.videoUrl && (
          <div style={{ margin: "20px 0", textAlign: "center" }}>
            <h4 style={{ fontSize: "13px", color: "#38bdf8", marginBottom: "8px" }}>
              📹 Synchronized Video Recording
            </h4>
            <video
              src={evaluation.videoUrl.startsWith("http") ? evaluation.videoUrl : `${API_URL}${evaluation.videoUrl}`}
              controls
              style={styles.evalVideoPlayer}
            />
            <div style={{ marginTop: "10px" }}>
              <a
                href={evaluation.videoUrl.startsWith("http") ? evaluation.videoUrl : `${API_URL}${evaluation.videoUrl}`}
                download={`interview_${sessionId}.webm`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  backgroundColor: "rgba(0, 245, 160, 0.15)",
                  border: "1px solid rgba(0, 245, 160, 0.3)",
                  color: "#00f5a0",
                  padding: "6px 16px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "700",
                  textDecoration: "none"
                }}
              >
                ⬇️ Download Video Recording
              </a>
            </div>
          </div>
        )}

        {evaluation.scoreBreakdown && (
          <div style={styles.evalBreakdownGrid}>
            {Object.entries(evaluation.scoreBreakdown).map(([label, value]) => (
              <div key={label} style={styles.evalBreakdownRow}>
                <span style={{ color: "#9ca3af" }}>
                  {label.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                </span>
                <span style={{ color: "#00f5a0", fontWeight: "800" }}>{value}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: "14px", marginTop: "28px" }}>
          <button style={styles.secondaryActionBtn} onClick={() => navigate("/")}>
            Return to Home
          </button>
          {user?.isCompany && (
            <button style={styles.primaryActionBtn} onClick={() => navigate("/leaderboard")}>
              View Company Leaderboard 🏆
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Company Jobs Dashboard (`/company/jobs`)
// ==========================================
function CompanyJobsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser());
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);

  useEffect(() => {
    const handleStorage = () => setUser(getStoredUser());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const userId = user?.id;
  const userEmail = user?.email;
  const isCompany = user?.isCompany;

  useEffect(() => {
    async function fetchCompanyJobs() {
      if (!isCompany || (!userId && !userEmail)) {
        setError("Access Restricted: Only verified company accounts can access the recruiter jobs dashboard.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/company/jobs?companyId=${encodeURIComponent(userId || "")}&userEmail=${encodeURIComponent(userEmail || "")}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not fetch company jobs.");
        setJobs(data.jobs || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCompanyJobs();
  }, [userId, userEmail, isCompany]);

  async function handleToggleJobStatus(jobId, currentStatus) {
    const nextStatus = currentStatus === "closed" ? "active" : "closed";
    try {
      const res = await fetch(`${API_URL}/api/company/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, companyId: user?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update status.");
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: nextStatus } : j)));
    } catch (e) {
      alert(e.message);
    }
  }

  if (!user?.isCompany) {
    return (
      <div style={styles.authContainer}>
        <div style={styles.authCardBox}>
          <span style={{ fontSize: "40px" }}>🔒</span>
          <h2 style={{ color: "#ffffff", margin: "16px 0 8px" }}>Company Recruiter Access Only</h2>
          <p style={{ color: "#9ca3af", fontSize: "14px", margin: "0 0 24px" }}>
            The job management suite is strictly restricted to registered company recruiters.
          </p>
          <button style={styles.authSubmitBtn} onClick={() => navigate("/")}>
            Return to Platform
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <Navbar
        user={user}
        onLogout={() => {
          localStorage.removeItem("user");
          navigate("/");
        }}
        onOpenContact={() => {}}
        onOpenSearch={() => {}}
        isDashboard={true}
      />

      <div style={styles.leaderboardShell}>
        <div style={styles.leaderboardHeader}>
          <div>
            <h2 style={styles.leaderboardTitle}>Company Job Management Dashboard 💼</h2>
            <p style={{ color: "#9ca3af", margin: "6px 0 0", fontSize: "14px" }}>
              Manage active software engineering roles, edit AI interview rubrics, and inspect applicant recordings for <strong>{user.companyName || user.name}</strong>.
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button style={styles.postJobSmallBtn} onClick={() => setIsPostJobOpen(true)}>
              + Post New Role
            </button>
            <button style={{ ...styles.postJobSmallBtn, backgroundColor: "rgba(255,255,255,0.1)", color: "#fff" }} onClick={() => navigate("/leaderboard")}>
              View Overall Scoreboard 🏆
            </button>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: "60px" }}>
            Loading job listings...
          </p>
        ) : error ? (
          <div style={styles.errorCard}><p style={{ color: "#ef4444", margin: 0 }}>{error}</p></div>
        ) : jobs.length === 0 ? (
          <div style={styles.emptyLeaderboardBox}>
            <h3 style={{ color: "#ffffff", margin: "0 0 10px" }}>No Roles Posted Yet</h3>
            <p style={{ color: "#9ca3af", margin: "0 0 20px", fontSize: "14px" }}>
              Create your first AI-screened technical job listing to start receiving candidates.
            </p>
            <button style={styles.authSubmitBtn} onClick={() => setIsPostJobOpen(true)}>
              + Post First Role
            </button>
          </div>
        ) : (
          <div style={styles.jobCardsGrid}>
            {jobs.map((job) => (
              <div key={job.id} style={styles.jobCardItem}>
                <div style={{ ...styles.jobCardTopGlow, background: job.status === "closed" ? "#6b7280" : "linear-gradient(135deg, #00f5a0, #00b4d8)" }} />
                <div style={styles.jobCardHeader}>
                  <div>
                    <h3 style={styles.jobRoleName}>{job.role}</h3>
                    <span style={styles.jobCompanyTag}>
                      🏢 {job.companyName || user.companyName}
                    </span>
                  </div>
                  <span
                    style={{
                      ...styles.jobLivePill,
                      backgroundColor: job.status === "closed" ? "rgba(239,68,68,0.15)" : "rgba(0, 245, 160, 0.15)",
                      color: job.status === "closed" ? "#ef4444" : "#00f5a0",
                      borderColor: job.status === "closed" ? "rgba(239,68,68,0.3)" : "rgba(0, 245, 160, 0.3)",
                    }}
                  >
                    {job.status === "closed" ? "Closed" : "Active AI Screening"}
                  </span>
                </div>

                <div style={{ ...styles.jobReqsWrap, margin: "14px 0" }}>
                  {(Array.isArray(job.requirements) ? job.requirements : [job.requirements]).map((req) => (
                    <span key={req} style={styles.jobReqTag}>{req}</span>
                  ))}
                </div>

                {job.extraInstructions && (
                  <div style={styles.jobCustomPromptSnippet}>
                    🤖 <b>Prompt Injected:</b> "{job.extraInstructions.slice(0, 85)}..."
                  </div>
                )}

                <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
                  <button
                    style={{ ...styles.jobApplyBtn, backgroundColor: "#00f5a0", color: "#000000" }}
                    onClick={() => navigate(`/company/jobs/${job.id}/applicants`)}
                  >
                    View Applicants 👥
                  </button>
                  <button
                    style={{ ...styles.jobApplyBtn, backgroundColor: "rgba(255,255,255,0.08)", color: "#ffffff", width: "auto" }}
                    onClick={() => handleToggleJobStatus(job.id, job.status)}
                  >
                    {job.status === "closed" ? "Reopen" : "Close Role"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PostJobModal
        isOpen={isPostJobOpen}
        onClose={() => setIsPostJobOpen(false)}
        onJobCreated={(newJ) => setJobs((prev) => [newJ, ...prev])}
        user={user}
      />
      <Footer />
    </div>
  );
}

// ==========================================
// Company Job Applicants Evaluation Page (`/company/jobs/:jobId/applicants`)
// ==========================================
function JobApplicantsPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser());
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    const handleStorage = () => setUser(getStoredUser());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const userId = user?.id;
  const userEmail = user?.email;
  const isCompany = user?.isCompany;

  useEffect(() => {
    async function fetchApplicants() {
      if (!isCompany || (!userId && !userEmail)) {
        setError("Access Restricted: Only verified company recruiters can view job applicants.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/company/jobs/${encodeURIComponent(jobId)}/applicants?companyId=${encodeURIComponent(userId || "")}&userEmail=${encodeURIComponent(userEmail || "")}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not fetch applicants.");
        setApplicants(data.applicants || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchApplicants();
  }, [jobId, userId, userEmail, isCompany]);

  if (!user?.isCompany) {
    return (
      <div style={styles.authContainer}>
        <div style={styles.authCardBox}>
          <span style={{ fontSize: "40px" }}>🔒</span>
          <h2 style={{ color: "#ffffff", margin: "16px 0 8px" }}>Company Recruiter Portal Restricted</h2>
          <p style={{ color: "#9ca3af", fontSize: "14px", margin: "0 0 24px" }}>
            Viewing candidate applicants requires a verified company account.
          </p>
          <button style={styles.authSubmitBtn} onClick={() => navigate("/")}>
            Return to Platform
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <Navbar
        user={user}
        onLogout={() => {
          localStorage.removeItem("user");
          navigate("/");
        }}
        onOpenContact={() => {}}
        onOpenSearch={() => {}}
        isDashboard={true}
      />

      <div style={styles.leaderboardShell}>
        <div style={styles.leaderboardHeader}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <button
                onClick={() => navigate("/company/jobs")}
                style={{ background: "none", border: "none", color: "#00f5a0", fontSize: "14px", fontWeight: "700", cursor: "pointer", padding: 0 }}
              >
                ← Back to Company Jobs
              </button>
            </div>
            <h2 style={styles.leaderboardTitle}>Applicants & Evaluation Metrics 👥</h2>
            <p style={{ color: "#9ca3af", margin: "6px 0 0", fontSize: "14px" }}>
              Inspecting AI voice screening recordings and transcripts for Position ID: <strong style={{ color: "#ffffff" }}>{jobId}</strong>
            </p>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: "60px" }}>
            Loading candidate application data...
          </p>
        ) : error ? (
          <div style={styles.errorCard}><p style={{ color: "#ef4444", margin: 0 }}>{error}</p></div>
        ) : applicants.length === 0 ? (
          <div style={styles.emptyLeaderboardBox}>
            <h3 style={{ color: "#ffffff", margin: "0 0 10px" }}>No Applicants for this Position Yet</h3>
            <p style={{ color: "#9ca3af", margin: 0, fontSize: "14px" }}>
              Candidates who complete an interview for this job will appear here with video replay and AI scores.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            {applicants.map((item, index) => (
              <div key={item.sessionId || index} style={styles.candidateCard}>
                <div style={styles.candidateCardRow}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={styles.rankPill}>#{index + 1}</div>
                    <div>
                      <h3 style={styles.candidateNameText}>{item.candidateName}</h3>
                      <span style={{ fontSize: "13px", color: "#9ca3af" }}>
                        Session ID: <code style={{ color: "#00f5a0" }}>{item.sessionId?.slice(0, 16)}...</code>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <div style={{ textAlign: "right" }}>
                      <span style={styles.candidateScoreNum}>{item.score}</span>
                      <span style={{ fontSize: "12px", color: "#9ca3af" }}> / 100</span>
                    </div>
                    <button
                      style={styles.detailsToggleBtn}
                      onClick={() =>
                        setSelectedCandidate(selectedCandidate?.sessionId === item.sessionId ? null : item)
                      }
                    >
                      {selectedCandidate?.sessionId === item.sessionId ? "Hide Analysis" : "Inspect Video & Transcript"}
                    </button>
                  </div>
                </div>

                {selectedCandidate?.sessionId === item.sessionId && (
                  <div style={styles.candidateExpandedDetails}>
                    <div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "12px", fontSize: "12px", color: "#9ca3af", backgroundColor: "rgba(255,255,255,0.03)", padding: "8px 12px", borderRadius: "8px" }}>
                        <span>⏱️ <b>Start:</b> {item.startedAt ? new Date(item.startedAt).toLocaleString() : (item.completedAt ? new Date(item.completedAt).toLocaleString() : "N/A")}</span>
                        <span>⌛ <b>End:</b> {item.endedAt ? new Date(item.endedAt).toLocaleString() : "N/A"}</span>
                        {item.resumeUrl && (
                          <a
                            href={item.resumeUrl.startsWith("http") ? item.resumeUrl : `${API_URL}${item.resumeUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#00f5a0", fontWeight: "700", textDecoration: "none" }}
                          >
                            📄 View Resume PDF
                          </a>
                        )}
                      </div>

                      <h4 style={styles.detailsSectionHeading}>AI Feedback & Evaluation</h4>
                      <p style={styles.detailsSummaryPara}>{item.summary || "Automated evaluation completed."}</p>

                      <h4 style={{ ...styles.detailsSectionHeading, marginTop: "16px" }}>Candidate Transcript</h4>
                      <div style={styles.transcriptBox}>
                        {item.transcript || "No transcript recorded."}
                      </div>
                    </div>

                    <div style={{ textAlign: "center" }}>
                      <h4 style={styles.detailsSectionHeading}>Interview Video Archival (3-Day B2 Storage)</h4>
                      {item.videoUrl ? (
                        <>
                          <video
                            src={item.videoUrl.startsWith("http") ? item.videoUrl : `${API_URL}${item.videoUrl}`}
                            controls
                            style={styles.recordingPlayer}
                          />
                          <a
                            href={item.videoUrl.startsWith("http") ? item.videoUrl : `${API_URL}${item.videoUrl}`}
                            download={`interview_${item.sessionId}.webm`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: "inline-block",
                              marginTop: "8px",
                              backgroundColor: "rgba(0, 245, 160, 0.15)",
                              border: "1px solid rgba(0, 245, 160, 0.3)",
                              color: "#00f5a0",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "700",
                              textDecoration: "none"
                            }}
                          >
                            ⬇️ Download Video
                          </a>
                        </>
                      ) : (
                        <div style={styles.noVideoBox}>No Video Recording Saved</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

// ==========================================
// Hiring Company Leaderboard Page
// ==========================================
function LeaderboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser());
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    const handleStorage = () => setUser(getStoredUser());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const userEmail = user?.email;
  const isCompany = user?.isCompany;

  useEffect(() => {
    async function fetchLeaderboard() {
      if (!isCompany || !userEmail) {
        setError("Access Restricted: Only verified company accounts can view candidate evaluation records.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/leaderboard?userEmail=${encodeURIComponent(userEmail)}`);
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
  }, [userEmail, isCompany]);

  if (!user?.isCompany) {
    return (
      <div style={styles.authContainer}>
        <div style={styles.authCardBox}>
          <span style={{ fontSize: "40px" }}>🔒</span>
          <h2 style={{ color: "#ffffff", margin: "16px 0 8px" }}>Company Portal Restricted</h2>
          <p style={{ color: "#9ca3af", fontSize: "14px", margin: "0 0 24px" }}>
            The candidate evaluation leaderboard is exclusively accessible to registered hiring company accounts.
          </p>
          <button style={styles.authSubmitBtn} onClick={() => navigate("/")}>
            Return to Platform
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <Navbar
        user={user}
        onLogout={() => {
          localStorage.removeItem("user");
          navigate("/");
        }}
        onOpenContact={() => {}}
        onOpenSearch={() => {}}
      />

      <div style={styles.leaderboardShell}>
        <div style={styles.leaderboardHeader}>
          <div>
            <h2 style={styles.leaderboardTitle}>Company Candidate Leaderboard 🏆</h2>
            <p style={{ color: "#9ca3af", margin: "6px 0 0", fontSize: "14px" }}>
              Live evaluation records & interview recordings for <strong>{user.companyName || user.name}</strong> candidates.
            </p>
          </div>
          <button style={styles.postJobSmallBtn} onClick={() => navigate("/post-job")}>
            + Post New Role
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: "60px" }}>
            Loading candidate evaluation records...
          </p>
        ) : error ? (
          <div style={styles.errorCard}><p style={{ color: "#ef4444", margin: 0 }}>{error}</p></div>
        ) : leaderboard.length === 0 ? (
          <div style={styles.emptyLeaderboardBox}>
            <h3 style={{ color: "#ffffff", margin: "0 0 10px" }}>No Candidate Interviews Recorded Yet</h3>
            <p style={{ color: "#9ca3af", margin: 0, fontSize: "14px" }}>
              Post a role and have candidates complete an autonomous screening to view ranked scores.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            {leaderboard.map((item, index) => (
              <div key={item.sessionId || index} style={styles.candidateCard}>
                <div style={styles.candidateCardRow}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={styles.rankPill}>#{index + 1}</div>
                    <div>
                      <h3 style={styles.candidateNameText}>{item.candidateName}</h3>
                      <span style={{ fontSize: "13px", color: "#9ca3af" }}>
                        Role: <strong style={{ color: "#00f5a0" }}>{item.jobRole}</strong>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <div style={{ textAlign: "right" }}>
                      <span style={styles.candidateScoreNum}>{item.score}</span>
                      <span style={{ fontSize: "12px", color: "#9ca3af" }}> / 100</span>
                    </div>
                    <button
                      style={styles.detailsToggleBtn}
                      onClick={() =>
                        setSelectedCandidate(selectedCandidate?.sessionId === item.sessionId ? null : item)
                      }
                    >
                      {selectedCandidate?.sessionId === item.sessionId ? "Hide Data" : "Review Candidate Video & Logs"}
                    </button>
                  </div>
                </div>

                {selectedCandidate?.sessionId === item.sessionId && (
                  <div style={styles.candidateExpandedDetails}>
                    <div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "12px", fontSize: "12px", color: "#9ca3af", backgroundColor: "rgba(255,255,255,0.03)", padding: "8px 12px", borderRadius: "8px" }}>
                        <span>⏱️ <b>Start:</b> {item.startedAt ? new Date(item.startedAt).toLocaleString() : (item.completedAt ? new Date(item.completedAt).toLocaleString() : "N/A")}</span>
                        <span>⌛ <b>End:</b> {item.endedAt ? new Date(item.endedAt).toLocaleString() : "N/A"}</span>
                        {item.resumeUrl && (
                          <a
                            href={item.resumeUrl.startsWith("http") ? item.resumeUrl : `${API_URL}${item.resumeUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#00f5a0", fontWeight: "700", textDecoration: "none" }}
                          >
                            📄 View Resume PDF
                          </a>
                        )}
                      </div>

                      <h4 style={styles.detailsSectionHeading}>AI Evaluation Notes</h4>
                      <p style={styles.detailsSummaryPara}>{item.summary || "Automated evaluation completed."}</p>

                      <h4 style={{ ...styles.detailsSectionHeading, marginTop: "16px" }}>Complete Session Transcript</h4>
                      <div style={styles.transcriptBox}>
                        {item.transcript || "No transcript recorded."}
                      </div>
                    </div>

                    <div style={{ textAlign: "center" }}>
                      <h4 style={styles.detailsSectionHeading}>Interview Video Archival</h4>
                      {item.videoUrl ? (
                        <>
                          <video
                            src={item.videoUrl.startsWith("http") ? item.videoUrl : `${API_URL}${item.videoUrl}`}
                            controls
                            style={styles.recordingPlayer}
                          />
                          <a
                            href={item.videoUrl.startsWith("http") ? item.videoUrl : `${API_URL}${item.videoUrl}`}
                            download={`interview_${item.sessionId}.webm`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: "inline-block",
                              marginTop: "8px",
                              backgroundColor: "rgba(0, 245, 160, 0.15)",
                              border: "1px solid rgba(0, 245, 160, 0.3)",
                              color: "#00f5a0",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "700",
                              textDecoration: "none"
                            }}
                          >
                            ⬇️ Download Video
                          </a>
                        </>
                      ) : (
                        <div style={styles.noVideoBox}>No Video Recording Saved</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/post-job" element={<CompanyJobPage />} />
        <Route path="/company/jobs" element={<CompanyJobsPage />} />
        <Route path="/company/jobs/:jobId/applicants" element={<JobApplicantsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/apply/:jobId" element={<UploadPage />} />
        <Route path="/interview/:sessionId" element={<InterviewPage />} />
        <Route path="/evaluation/:sessionId" element={<EvaluationPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// ==========================================
// Styles Object (Deepgram Aesthetics Matching)
// ==========================================
const styles = {
  pageContainer: {
    minHeight: "100vh",
    backgroundColor: "#000000",
    color: "#ffffff",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: "flex",
    flexDirection: "column",
    overflowX: "hidden",
  },

  // 1. Top Announcement Bar (Configured for India & Global Tech Teams, No San Francisco, No Date)
  announcementBar: {
    width: "100%",
    background: "linear-gradient(90deg, #ff5722 0%, #ea580c 20%, #c026d3 50%, #4338ca 80%, #2563eb 100%)",
    color: "#ffffff",
    padding: "10px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "600",
    position: "relative",
    zIndex: 100,
  },
  announcementContent: {
    width: "100%",
    maxWidth: "1320px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  announcementLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
  },
  announcementBrand: {
    fontWeight: "900",
    fontSize: "16px",
    letterSpacing: "-0.5px",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    padding: "2px 10px",
    borderRadius: "6px",
  },
  announcementText: {
    fontWeight: "500",
    color: "#f8fafc",
  },
  announcementDivider: {
    opacity: 0.6,
    margin: "0 6px",
  },
  announcementRight: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  announcementLink: {
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
  },
  announcementClose: {
    background: "transparent",
    border: "none",
    color: "#ffffff",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    opacity: 0.8,
  },

  // 2. Navigation Bar
  navbar: {
    width: "100%",
    backgroundColor: "#000000",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    position: "sticky",
    top: 0,
    zIndex: 90,
    backdropFilter: "blur(12px)",
  },
  navContainer: {
    maxWidth: "1320px",
    margin: "0 auto",
    padding: "0 24px",
    height: "72px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navLeft: {
    display: "flex",
    alignItems: "center",
    gap: "36px",
  },
  navLogoLink: {
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  brandLogo: {
    fontSize: "26px",
    fontWeight: "900",
    letterSpacing: "-0.04em",
    color: "#ffffff",
  },
  brandDot: {
    width: "7px",
    height: "7px",
    backgroundColor: "#00f5a0",
    borderRadius: "50%",
    boxShadow: "0 0 10px #00f5a0",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
  },
  navItemWithDropdown: {
    position: "relative",
  },
  navLinkButton: {
    background: "transparent",
    border: "none",
    color: "#d1d5db",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    padding: "8px 0",
  },
  navLinkAnchor: {
    color: "#d1d5db",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
  },
  navCompanyLink: {
    color: "#f59e0b",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "700",
    background: "rgba(245, 158, 11, 0.1)",
    padding: "5px 12px",
    borderRadius: "6px",
  },
  navPostJobLink: {
    color: "#00f5a0",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "700",
  },
  dropdownMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    marginTop: "8px",
    width: "300px",
    backgroundColor: "#0d1017",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "12px",
    padding: "8px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8)",
    zIndex: 100,
  },
  dropdownItem: {
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  dropdownTitle: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#ffffff",
  },
  dropdownDesc: {
    fontSize: "12px",
    color: "#9ca3af",
    marginTop: "2px",
  },
  navRight: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  searchIconButton: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "8px",
    display: "flex",
    alignItems: "center",
    color: "#9ca3af",
  },
  contactUsButton: {
    backgroundColor: "#000000",
    color: "#ffffff",
    border: "1px solid #00f5a0",
    boxShadow: "0 0 16px rgba(0, 245, 160, 0.25)",
    padding: "9px 20px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  loginPillButton: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    color: "#ffffff",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    padding: "9px 20px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  signUpPillButton: {
    backgroundColor: "#ffffff",
    color: "#000000",
    border: "none",
    padding: "9px 20px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  userProfileSection: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  userBadge: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#ffffff",
    background: "rgba(255, 255, 255, 0.06)",
    padding: "7px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.12)",
  },

  // 3. Hero Section
  heroSection: {
    width: "100%",
    backgroundColor: "#000000",
    padding: "90px 24px 80px",
    display: "flex",
    justifyContent: "center",
    position: "relative",
    backgroundImage: "radial-gradient(ellipse at 50% 10%, rgba(0, 245, 160, 0.12) 0%, rgba(168, 85, 247, 0.08) 35%, transparent 65%)",
  },
  heroInner: {
    maxWidth: "920px",
    textAlign: "center",
  },
  heroBadgeTop: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "rgba(0, 245, 160, 0.1)",
    border: "1px solid rgba(0, 245, 160, 0.3)",
    padding: "6px 16px",
    borderRadius: "999px",
    color: "#00f5a0",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "0.5px",
    marginBottom: "24px",
  },
  heroHeadline: {
    fontSize: "54px",
    fontWeight: "900",
    letterSpacing: "-0.03em",
    lineHeight: "1.1",
    color: "#ffffff",
    margin: "0 0 24px",
  },
  heroSubtitle: {
    fontSize: "17px",
    lineHeight: "1.65",
    color: "#9ca3af",
    margin: "0 auto 36px",
    maxWidth: "780px",
  },
  heroActionButtons: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  heroPrimaryButton: {
    backgroundColor: "#ffffff",
    color: "#000000",
    border: "none",
    padding: "14px 34px",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "700",
    textDecoration: "none",
    boxShadow: "0 4px 20px rgba(255, 255, 255, 0.2)",
    cursor: "pointer",
  },
  heroSecondaryButton: {
    backgroundColor: "#000000",
    color: "#ffffff",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    padding: "14px 32px",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  heroStatsRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "36px",
    marginTop: "60px",
    paddingTop: "36px",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
    flexWrap: "wrap",
  },
  heroStatItem: {
    textAlign: "center",
  },
  heroStatVal: {
    fontSize: "24px",
    fontWeight: "900",
    color: "#ffffff",
  },
  heroStatLbl: {
    fontSize: "12px",
    color: "#9ca3af",
    marginTop: "4px",
    fontWeight: "500",
  },
  heroStatDivider: {
    width: "1px",
    height: "28px",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },

  // 4. How It Works Section
  howItWorksSection: {
    width: "100%",
    backgroundColor: "#050608",
    padding: "80px 24px",
    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
  },
  badgeNeon: {
    display: "inline-block",
    backgroundColor: "rgba(0, 245, 160, 0.12)",
    color: "#00f5a0",
    fontSize: "12px",
    fontWeight: "800",
    padding: "6px 16px",
    borderRadius: "999px",
    border: "1px solid rgba(0, 245, 160, 0.3)",
    marginBottom: "16px",
    letterSpacing: "0.5px",
  },
  stepsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "24px",
  },
  stepCard: {
    backgroundColor: "#0b0d13",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "16px",
    padding: "28px 24px",
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },
  stepNumberBadge: {
    fontSize: "12px",
    fontWeight: "900",
    color: "#00f5a0",
    backgroundColor: "rgba(0, 245, 160, 0.1)",
    border: "1px solid rgba(0, 245, 160, 0.25)",
    padding: "4px 10px",
    borderRadius: "6px",
    width: "fit-content",
  },
  stepTitle: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#ffffff",
    margin: "0 0 8px",
  },
  stepDesc: {
    fontSize: "14px",
    color: "#9ca3af",
    lineHeight: "1.6",
    margin: 0,
  },

  // 5. Features Grid Section
  featuresSection: {
    width: "100%",
    backgroundColor: "#000000",
    padding: "90px 24px 100px",
    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
  },
  featuresInner: {
    maxWidth: "1240px",
    margin: "0 auto",
  },
  sectionHeaderCentered: {
    textAlign: "center",
    maxWidth: "800px",
    margin: "0 auto 60px",
  },
  featuresHeadline: {
    fontSize: "40px",
    fontWeight: "900",
    letterSpacing: "-0.03em",
    color: "#ffffff",
    margin: "0 0 16px",
  },
  featuresSubtitle: {
    fontSize: "16px",
    lineHeight: "1.6",
    color: "#9ca3af",
    margin: 0,
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "48px 36px",
  },
  featureCard: {
    display: "flex",
    flexDirection: "column",
    textAlign: "left",
  },
  featureIconBox: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    backgroundColor: "rgba(0, 245, 160, 0.08)",
    border: "1px solid rgba(0, 245, 160, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
  },
  featureTitle: {
    fontSize: "19px",
    fontWeight: "800",
    color: "#ffffff",
    margin: "0 0 10px",
    letterSpacing: "-0.01em",
  },
  featureDesc: {
    fontSize: "14px",
    lineHeight: "1.65",
    color: "#9ca3af",
    margin: 0,
  },

  // 6. Jobs / Active Positions Section
  jobsSection: {
    width: "100%",
    backgroundColor: "#050608",
    padding: "90px 24px 100px",
    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
  },
  jobsInner: {
    maxWidth: "1240px",
    margin: "0 auto",
  },
  jobsHeadline: {
    fontSize: "38px",
    fontWeight: "900",
    letterSpacing: "-0.03em",
    color: "#ffffff",
    margin: "0 0 14px",
  },
  jobsSubtitle: {
    fontSize: "16px",
    color: "#9ca3af",
    margin: 0,
  },
  jobCardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
    gap: "24px",
  },
  jobCardItem: {
    position: "relative",
    backgroundColor: "#0b0e14",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "16px",
    padding: "28px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
  },
  jobCardTopGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "3px",
  },
  jobCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
  },
  jobRoleName: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#ffffff",
    margin: 0,
  },
  jobCompanyTag: {
    fontSize: "12px",
    color: "#00f5a0",
    fontWeight: "700",
    marginTop: "4px",
    display: "block",
  },
  jobLivePill: {
    backgroundColor: "rgba(0, 245, 160, 0.15)",
    color: "#00f5a0",
    fontSize: "11px",
    fontWeight: "800",
    padding: "4px 10px",
    borderRadius: "999px",
    border: "1px solid rgba(0, 245, 160, 0.3)",
  },
  jobDescriptionText: {
    color: "#cbd5e1",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "12px 0 16px",
  },
  jobReqsWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginBottom: "16px",
  },
  jobReqTag: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    color: "#cbd5e1",
    fontWeight: "500",
  },
  jobCustomPromptSnippet: {
    backgroundColor: "rgba(0, 245, 160, 0.06)",
    border: "1px solid rgba(0, 245, 160, 0.2)",
    padding: "10px 14px",
    borderRadius: "10px",
    fontSize: "12px",
    color: "#00f5a0",
    marginBottom: "18px",
    lineHeight: "1.5",
  },
  jobApplyBtn: {
    marginTop: "auto",
    width: "100%",
    backgroundColor: "#ffffff",
    color: "#000000",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  // 7. Resources Section
  resourcesSection: {
    width: "100%",
    backgroundColor: "#000000",
    padding: "90px 24px 100px",
    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
  },
  resourcesHeading: {
    fontSize: "42px",
    fontWeight: "900",
    letterSpacing: "-0.03em",
    color: "#ffffff",
    margin: 0,
    lineHeight: "1.15",
  },
  carouselWrapper: {
    maxWidth: "1240px",
    margin: "0 auto",
  },
  carouselCardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "24px",
  },
  resourceCard: {
    backgroundColor: "#0b0d13",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "16px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  resourceCardHighlighted: {
    border: "1px solid #00f5a0",
    boxShadow: "0 0 30px rgba(0, 245, 160, 0.2)",
  },
  resourceCardVisual: {
    height: "170px",
    background: "linear-gradient(135deg, #180d29 0%, #0d1a24 100%)",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  resourceCardWatermark: {
    fontSize: "24px",
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: "-0.5px",
    zIndex: 2,
  },
  resourceCardBadgeOverlay: {
    marginTop: "10px",
    zIndex: 2,
  },
  launchTag: {
    backgroundColor: "rgba(0, 245, 160, 0.15)",
    border: "1px solid rgba(0, 245, 160, 0.3)",
    color: "#00f5a0",
    fontSize: "11px",
    fontWeight: "800",
    padding: "4px 10px",
    borderRadius: "6px",
    letterSpacing: "0.5px",
  },
  resourceCardGlowSweep: {
    position: "absolute",
    width: "120%",
    height: "100%",
    background: "radial-gradient(ellipse at 50% 50%, rgba(0, 245, 160, 0.15) 0%, transparent 60%)",
  },
  resourceCardBody: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  resourceBadgesRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "14px",
  },
  badgePink: {
    backgroundColor: "rgba(236, 72, 153, 0.15)",
    color: "#f472b6",
    fontSize: "11px",
    fontWeight: "800",
    padding: "3px 8px",
    borderRadius: "4px",
    letterSpacing: "0.5px",
  },
  badgeGray: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    color: "#cbd5e1",
    fontSize: "11px",
    fontWeight: "800",
    padding: "3px 8px",
    borderRadius: "4px",
    letterSpacing: "0.5px",
  },
  resourceCardTitle: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#ffffff",
    lineHeight: "1.35",
    margin: "0 0 24px",
  },
  resourceAuthorRow: {
    marginTop: "auto",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  resourceAuthorAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    objectFit: "cover",
  },
  resourceAuthorName: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#ffffff",
  },
  resourceDate: {
    fontSize: "12px",
    color: "#6b7280",
    marginTop: "2px",
  },

  // 8. CTA Banner Section
  ctaSection: {
    width: "100%",
    backgroundColor: "#000000",
    padding: "100px 24px 110px",
    display: "flex",
    justifyContent: "center",
    position: "relative",
    backgroundImage: "radial-gradient(circle at 50% 50%, rgba(0, 245, 160, 0.15) 0%, rgba(139, 92, 246, 0.08) 45%, transparent 75%)",
  },
  ctaContainer: {
    maxWidth: "840px",
    textAlign: "center",
  },
  ctaHeading: {
    fontSize: "42px",
    fontWeight: "900",
    letterSpacing: "-0.03em",
    color: "#ffffff",
    margin: "0 0 18px",
  },
  ctaSubtitle: {
    fontSize: "16px",
    lineHeight: "1.65",
    color: "#9ca3af",
    margin: "0 auto 36px",
    maxWidth: "720px",
  },
  ctaButtonsRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  ctaPrimaryButton: {
    backgroundColor: "#ffffff",
    color: "#000000",
    border: "none",
    padding: "13px 32px",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "700",
    textDecoration: "none",
    cursor: "pointer",
  },
  ctaSecondaryButton: {
    backgroundColor: "#000000",
    color: "#ffffff",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    padding: "13px 28px",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
  },

  // 9. Footer
  footer: {
    width: "100%",
    backgroundColor: "#08090b",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
    padding: "80px 24px 40px",
  },
  footerContainer: {
    maxWidth: "1320px",
    margin: "0 auto",
  },
  footerTopSplit: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "40px",
    marginBottom: "60px",
  },
  footerBrandBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  footerLogo: {
    fontSize: "34px",
    fontWeight: "900",
    letterSpacing: "-0.04em",
    color: "#ffffff",
  },
  footerSocialsRow: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    marginTop: "8px",
  },
  socialLink: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#9ca3af",
    textDecoration: "none",
  },
  footerNewsletterBlock: {
    maxWidth: "460px",
    width: "100%",
  },
  newsletterHeading: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#ffffff",
    margin: "0 0 16px",
  },
  newsletterForm: {
    display: "flex",
    gap: "10px",
    marginBottom: "12px",
  },
  newsletterInput: {
    flex: 1,
    backgroundColor: "#11141b",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: "8px",
    padding: "12px 16px",
    color: "#ffffff",
    fontSize: "14px",
    outline: "none",
  },
  newsletterSubmitButton: {
    backgroundColor: "#000000",
    color: "#ffffff",
    border: "1px solid #00f5a0",
    boxShadow: "0 0 12px rgba(0, 245, 160, 0.25)",
    borderRadius: "8px",
    padding: "12px 24px",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
  },
  newsletterDisclaimer: {
    fontSize: "12px",
    color: "#6b7280",
    margin: 0,
  },
  footerColumnsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "32px 20px",
    paddingBottom: "50px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
  footerCol: {
    display: "flex",
    flexDirection: "column",
  },
  footerColTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#ffffff",
    margin: "0 0 18px",
  },
  footerList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  footerLink: {
    color: "#9ca3af",
    textDecoration: "none",
    fontSize: "13px",
  },
  footerBottomBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "32px",
    flexWrap: "wrap",
    gap: "16px",
  },
  footerLegalLinks: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  footerLegalItem: {
    color: "#9ca3af",
    textDecoration: "none",
    fontSize: "13px",
  },
  footerCopyrightText: {
    color: "#9ca3af",
    fontSize: "13px",
  },

  // Modals & Sub-pages
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modalDialog: {
    backgroundColor: "#0d1017",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: "16px",
    padding: "28px",
    maxWidth: "500px",
    width: "100%",
    boxShadow: "0 25px 60px rgba(0, 0, 0, 0.9)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#ffffff",
    margin: 0,
  },
  modalCloseButton: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#9ca3af",
    padding: "4px",
  },
  modalInput: {
    width: "100%",
    backgroundColor: "#161b24",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: "8px",
    padding: "12px 14px",
    color: "#ffffff",
    fontSize: "14px",
    outline: "none",
  },
  modalSubmitButton: {
    backgroundColor: "#000000",
    color: "#ffffff",
    border: "1px solid #00f5a0",
    boxShadow: "0 0 15px rgba(0, 245, 160, 0.25)",
    borderRadius: "8px",
    padding: "12px",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    marginTop: "8px",
  },
  modalSuccessBox: {
    textAlign: "center",
    padding: "30px 10px",
  },
  searchBarBox: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    paddingBottom: "14px",
  },
  searchInputField: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "#ffffff",
    fontSize: "16px",
    outline: "none",
  },
  searchResultsList: {
    maxHeight: "340px",
    overflowY: "auto",
    marginTop: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  searchResultItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: "12px 16px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  searchApplyButton: {
    backgroundColor: "rgba(0, 245, 160, 0.1)",
    border: "1px solid rgba(0, 245, 160, 0.3)",
    color: "#00f5a0",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },

  // Auth pages & Common Card Layouts
  authContainer: {
    minHeight: "100vh",
    backgroundColor: "#000000",
    backgroundImage: "radial-gradient(circle at 50% 0%, rgba(0, 245, 160, 0.1) 0%, transparent 60%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 20px",
  },
  authTopHeader: {
    width: "100%",
    maxWidth: "560px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "36px",
  },
  backButton: {
    backgroundColor: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    color: "#d1d5db",
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  authCardBox: {
    backgroundColor: "#0b0d13",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "20px",
    padding: "36px",
    maxWidth: "480px",
    width: "100%",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8)",
  },
  authTitleText: {
    fontSize: "26px",
    fontWeight: "900",
    color: "#ffffff",
    margin: "0 0 6px",
    letterSpacing: "-0.5px",
  },
  authDescText: {
    fontSize: "14px",
    color: "#9ca3af",
    margin: "0 0 24px",
    lineHeight: "1.5",
  },
  companyToggleBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    marginBottom: "18px",
  },
  toggleCheckbox: {
    width: "20px",
    height: "20px",
    cursor: "pointer",
    accentColor: "#00f5a0",
  },
  authForm: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    textAlign: "left",
  },
  inputLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#cbd5e1",
  },
  authInputField: {
    width: "100%",
    backgroundColor: "#131722",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: "8px",
    padding: "12px 14px",
    color: "#ffffff",
    fontSize: "14px",
    outline: "none",
  },
  companyExpandedBox: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    backgroundColor: "rgba(0, 245, 160, 0.05)",
    padding: "16px",
    borderRadius: "12px",
    border: "1px solid rgba(0, 245, 160, 0.2)",
  },
  errorMessage: {
    color: "#ef4444",
    fontSize: "13px",
    margin: "4px 0",
  },
  successMessage: {
    color: "#00f5a0",
    fontSize: "13px",
    margin: "4px 0",
    fontWeight: "600",
  },
  authSubmitBtn: {
    width: "100%",
    backgroundColor: "#ffffff",
    color: "#000000",
    border: "none",
    padding: "13px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "8px",
  },
  authFooterLinkText: {
    marginTop: "20px",
    fontSize: "14px",
    color: "#9ca3af",
    textAlign: "center",
  },
  fileInput: {
    backgroundColor: "#131722",
    border: "2px dashed rgba(255, 255, 255, 0.2)",
    padding: "24px",
    borderRadius: "12px",
    color: "#ffffff",
    cursor: "pointer",
    textAlign: "center",
  },
  verifiedCandidateBox: {
    marginTop: "20px",
    padding: "18px",
    backgroundColor: "rgba(0, 245, 160, 0.08)",
    borderRadius: "12px",
    border: "1px solid rgba(0, 245, 160, 0.3)",
    textAlign: "left",
  },
  launchInterviewBtn: {
    marginTop: "16px",
    width: "100%",
    backgroundColor: "#000000",
    color: "#ffffff",
    border: "1px solid #00f5a0",
    boxShadow: "0 0 20px rgba(0, 245, 160, 0.3)",
    padding: "14px",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "800",
    cursor: "pointer",
  },

  // Live Split-screen Interview Room
  interviewScreenContainer: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000000",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
  },
  interviewTopBar: {
    padding: "14px 28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#080a0f",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  },
  interviewBrand: {
    fontSize: "18px",
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: "-0.5px",
  },
  recordingRedDot: {
    width: "10px",
    height: "10px",
    backgroundColor: "#ef4444",
    borderRadius: "50%",
    boxShadow: "0 0 10px #ef4444",
  },
  recordingStatusText: {
    fontSize: "13px",
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: "0.5px",
  },
  endInterviewBtn: {
    backgroundColor: "#dc2626",
    color: "#ffffff",
    border: "none",
    padding: "8px 20px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },
  splitStage: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "2px",
    backgroundColor: "#161b24",
  },
  aiScreenPanel: {
    position: "relative",
    backgroundColor: "#050609",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  aiVisualizerOrbWrapper: {
    position: "relative",
    width: "220px",
    height: "220px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  aiOrbImage: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
    zIndex: 2,
    border: "2px solid #00f5a0",
    boxShadow: "0 0 50px rgba(0, 245, 160, 0.35)",
  },
  aiOrbPulseRing: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0, 245, 160, 0.35), transparent 70%)",
  },
  candidateScreenPanel: {
    position: "relative",
    backgroundColor: "#000000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  candidateVideoElem: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  stageLabel: {
    position: "absolute",
    top: "16px",
    left: "16px",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "700",
    padding: "6px 14px",
    borderRadius: "999px",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
  },
  subtitlesFloatingWrapper: {
    position: "absolute",
    bottom: "28px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 10000,
    width: "90%",
    maxWidth: "800px",
    textAlign: "center",
    pointerEvents: "none",
  },
  subtitlesPillBox: {
    display: "inline-block",
    backgroundColor: "rgba(0, 0, 0, 0.88)",
    color: "#ffffff",
    padding: "12px 24px",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.9)",
    backdropFilter: "blur(12px)",
  },

  // Evaluation & Results
  evalLoadingCard: {
    backgroundColor: "#0b0d13",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "20px",
    padding: "48px 36px",
    maxWidth: "480px",
    width: "100%",
    textAlign: "center",
  },
  evalSpinner: {
    width: "44px",
    height: "44px",
    border: "4px solid rgba(255, 255, 255, 0.1)",
    borderTopColor: "#00f5a0",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto",
  },
  evalScoreCircle: {
    width: "130px",
    height: "130px",
    borderRadius: "50%",
    border: "6px solid #00f5a0",
    boxShadow: "0 0 35px rgba(0, 245, 160, 0.35)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px",
  },
  evalScoreNumber: {
    fontSize: "44px",
    fontWeight: "900",
    color: "#ffffff",
  },
  evalScoreLabel: {
    fontSize: "13px",
    color: "#9ca3af",
  },
  evalSummaryBox: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    padding: "18px",
    textAlign: "left",
    marginBottom: "16px",
  },
  evalVideoPlayer: {
    width: "100%",
    maxWidth: "400px",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    backgroundColor: "#000000",
  },
  evalBreakdownGrid: {
    display: "grid",
    gap: "10px",
    backgroundColor: "#131722",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "12px",
    padding: "16px",
    textAlign: "left",
  },
  evalBreakdownRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "13px",
  },
  secondaryActionBtn: {
    flex: 1,
    backgroundColor: "#161b24",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    color: "#ffffff",
    padding: "12px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
  },
  primaryActionBtn: {
    flex: 1,
    backgroundColor: "#000000",
    border: "1px solid #00f5a0",
    boxShadow: "0 0 15px rgba(0, 245, 160, 0.25)",
    color: "#ffffff",
    padding: "12px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
  },

  // Leaderboard Page
  leaderboardShell: {
    maxWidth: "1240px",
    margin: "40px auto 80px",
    padding: "0 24px",
    width: "100%",
  },
  leaderboardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
    flexWrap: "wrap",
    gap: "16px",
  },
  leaderboardTitle: {
    fontSize: "32px",
    fontWeight: "900",
    color: "#ffffff",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  postJobSmallBtn: {
    backgroundColor: "#ffffff",
    color: "#000000",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },
  errorCard: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    padding: "24px",
    borderRadius: "12px",
    textAlign: "center",
  },
  emptyLeaderboardBox: {
    backgroundColor: "#0b0d13",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "16px",
    padding: "60px 20px",
    textAlign: "center",
  },
  candidateCard: {
    backgroundColor: "#0b0d13",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "16px",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
  },
  candidateCardRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },
  rankPill: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    backgroundColor: "rgba(0, 245, 160, 0.15)",
    border: "1px solid rgba(0, 245, 160, 0.3)",
    color: "#00f5a0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "14px",
  },
  candidateNameText: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#ffffff",
    margin: "0 0 2px",
  },
  candidateScoreNum: {
    fontSize: "26px",
    fontWeight: "900",
    color: "#00f5a0",
  },
  detailsToggleBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    color: "#ffffff",
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  candidateExpandedDetails: {
    marginTop: "20px",
    paddingTop: "20px",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
    display: "grid",
    gridTemplateColumns: "1fr 300px",
    gap: "24px",
  },
  detailsSectionHeading: {
    fontSize: "14px",
    color: "#38bdf8",
    margin: "0 0 8px",
  },
  detailsSummaryPara: {
    fontSize: "14px",
    color: "#cbd5e1",
    lineHeight: "1.6",
    margin: 0,
  },
  transcriptBox: {
    backgroundColor: "#050609",
    color: "#ffffff",
    padding: "14px",
    borderRadius: "10px",
    maxHeight: "180px",
    overflowY: "auto",
    fontSize: "12px",
    fontFamily: "monospace",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  recordingPlayer: {
    width: "100%",
    borderRadius: "10px",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    backgroundColor: "#000000",
  },
  noVideoBox: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: "36px 12px",
    borderRadius: "10px",
    color: "#6b7280",
    fontSize: "12px",
  },

  // Home Page User Command Center & Quick Dashboard
  userCommandCenter: {
    backgroundColor: "#0b0d13",
    border: "1px solid rgba(0, 245, 160, 0.35)",
    boxShadow: "0 0 35px rgba(0, 245, 160, 0.12)",
    borderRadius: "16px",
    padding: "24px 28px",
    marginBottom: "40px",
  },
  userCommandHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "18px",
  },
  userCommandAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    backgroundColor: "rgba(0, 245, 160, 0.15)",
    border: "1px solid rgba(0, 245, 160, 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    flexShrink: 0,
  },
  userCommandTitle: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  userRoleTag: {
    backgroundColor: "rgba(0, 245, 160, 0.15)",
    color: "#00f5a0",
    fontSize: "11px",
    fontWeight: "800",
    padding: "3px 10px",
    borderRadius: "999px",
    border: "1px solid rgba(0, 245, 160, 0.3)",
  },
  userCommandSub: {
    fontSize: "13px",
    color: "#9ca3af",
    marginTop: "4px",
    maxWidth: "600px",
    lineHeight: "1.5",
  },
  userCommandActions: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  postJobCommandBtn: {
    backgroundColor: "#ffffff",
    color: "#000000",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(255, 255, 255, 0.15)",
    textDecoration: "none",
    display: "inline-block",
  },
  leaderboardCommandBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    color: "#ffffff",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    padding: "10px 18px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    display: "inline-block",
  },
};
