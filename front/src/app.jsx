import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link, Navigate } from 'react-router-dom';

import PillNav from './PillNav';
import Iridescence from './Iridescence';
import InfiniteMenu from './InfiniteMenu';
import Strands from './Strands';
import FoldText from './FoldText';
import DriftWall from './DriftWall';
import PaperCrumple from './PaperCrumple';
import PixelCard from './PixelCard';
import SpecularButton from './SpecularButton';

import logo from './lotus.svg';
import resume1 from './resumeImgs/ATS-friendly-Minimalist-Resume-Example-1778884686202.png';
import resume2 from './resumeImgs/image-1646978280252.jpg';
import resume3 from './resumeImgs/image-1648703459053.jpg';
import resume4 from './resumeImgs/image.png';
import resume5 from './resumeImgs/images (1).png';
import resume6 from './resumeImgs/images (2).png';
import resume7 from './resumeImgs/images (3).png';
import resume8 from './resumeImgs/images.jpg';
import resume9 from './resumeImgs/images.png';
import resume10 from './resumeImgs/testvaad.png';

import './App.css';

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

const navItems = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Talent', href: '#talent' },
  { label: 'Insights', href: '#insights' },
  { label: 'Active Roles', href: '#jobs-section' },
  { label: 'Pricing', href: '#pricing' }
];

const interviewItems = [
  {
    video: '/assets/interviewer.mp4',
    title: 'A live conversation with your AI interviewer'
  }
];

const interviewSteps = [
  {
    title: 'Answer naturally',
    body: 'Respond to questions through your voice, in a real interview-style conversation.'
  },
  {
    title: 'Show your skills',
    body: 'Work through practical questions designed around the role you’re targeting.'
  },
  {
    title: 'Get evaluated on ability',
    body: 'Turn your interview into a structured skills profile that goes beyond what’s written on your résumé.'
  }
];

const resumeItems = [
  { image: resume1 },
  { image: resume2 },
  { image: resume3 },
  { image: resume4 },
  { image: resume5 },
  { image: resume6 },
  { image: resume7 },
  { image: resume8 },
  { image: resume9 },
  { image: resume10 }
];

const insightFeatures = [
  {
    title: 'Live AI Interviews',
    description:
      'Run role-specific interviews with dynamic questions that let candidates demonstrate their knowledge and explain their thinking.'
  },
  {
    title: 'Complete Interview Transcripts',
    description:
      'Review what candidates actually said, revisit individual answers, and see the reasoning behind their responses.'
  },
  {
    title: 'Structured AI Evaluation',
    description:
      'Assess answers against role-specific criteria, with clear feedback on demonstrated strengths and areas that need further assessment.'
  },
  {
    title: 'Performance Insights',
    description:
      'Turn interview responses into a readable candidate profile, highlighting relevant competencies and evaluation findings.'
  },
  {
    title: 'Candidate Ranking',
    description:
      'Compare candidates against consistent, job-relevant criteria and prioritise who deserves the next round of consideration.'
  }
];

const pixelCardColors = ['#f8fafc', '#f1f5f9', '#cbd5e1'];

const pricingPlans = [
  {
    audience: 'For candidates',
    name: 'Candidate Starter',
    price: '₹0',
    period: '/ month',
    features: [
      'Browse company-posted roles',
      'Take eligible interviews at no cost',
      'Receive basic AI feedback'
    ]
  },
  {
    audience: 'For candidates',
    name: 'Candidate Pro',
    price: '₹799',
    period: '/ month',
    features: [
      'Personalised AI learning roadmap',
      'AI learning companion',
      'Detailed interview analysis',
      'Progress tracking'
    ]
  },
  {
    audience: 'For companies',
    name: 'Company Starter',
    price: '₹0',
    period: '/ month',
    features: [
      'Up to 5 completed interviews per month',
      'One hiring manager',
      'Transcripts included',
      'Basic AI evaluations'
    ]
  },
  {
    audience: 'For companies',
    name: 'Company Pro',
    price: '₹4,999',
    period: '/ month',
    features: [
      'Up to 50 interviews per month',
      'Multiple roles',
      'Full transcripts',
      'Explainable ranking & shortlists'
    ]
  }
];

const pixelCardEffect = {
  colors: pixelCardColors,
  glowColor: '#cbd5e1',
  shape: 'square',
  origin: 'center',
  gap: 5,
  pixelSize: 2,
  speed: 35,
  revealDuration: 600,
  spotlight: 0.5,
  glow: 0.5,
  opacity: 0.35,
  fade: 0.7,
  trigger: 'hover',
  radius: 24,
  clickPulse: true,
  intro: true,
  theme: 'dark'
};

function InsightAccordion() {
  const [activeIndex, setActiveIndex] = useState(0);
  const hoverTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  const preview = index => {
    if (window.matchMedia?.('(hover: hover)').matches === false) return;
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setActiveIndex(index), 80);
  };

  const activate = index => {
    window.clearTimeout(hoverTimer.current);
    setActiveIndex(index);
  };

  return (
    <div className="insights">
      <p className="insights__eyebrow">What you get</p>
      <ul className="insights__list">
        {insightFeatures.map((feature, index) => {
          const isActive = activeIndex === index;
          const panelId = `insight-panel-${index}`;
          return (
            <li
              key={feature.title}
              className={`insights__item${isActive ? ' is-active' : ''}`}
              onMouseEnter={() => preview(index)}
            >
              <div className="insights__content">
                <span className="insights__num" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="insights__vert" aria-hidden="true">
                  {feature.title}
                </span>
                <div className="insights__head">
                  <h3 className="insights__name">{feature.title}</h3>
                  <span className="insights__mark" aria-hidden="true" />
                </div>
                <p className="insights__body" id={panelId} aria-hidden={!isActive}>
                  {feature.description}
                </p>
              </div>
              <button
                type="button"
                className="insights__trigger"
                aria-label={feature.title}
                aria-expanded={isActive}
                aria-controls={panelId}
                onClick={() => activate(index)}
                onFocus={() => activate(index)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ==========================================
// Landing Page Component (New Design)
// ==========================================
function LandingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser());
  const [allJobs, setAllJobs] = useState(DEFAULT_JOBS);

  const headerRef = useRef(null);
  const interviewRef = useRef(null);
  const talentRef = useRef(null);
  const crumpleRef = useRef(null);
  const pricingRef = useRef(null);

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
        console.error("Could not fetch jobs", e);
      }
    }
    fetchJobs();
  }, []);

  useEffect(() => {
    const mark = document.querySelector('.site-mark');
    const header = headerRef.current;
    if (!mark || !header) return undefined;
    const observer = new IntersectionObserver(
      entries => {
        mark.classList.toggle('site-mark--hidden', entries[0].isIntersecting);
      },
      { rootMargin: '-4px 0px 0px 0px' }
    );
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = interviewRef.current;
    if (!section) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    section.classList.add('interview--animate');
    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        section.classList.add('interview--in');
        observer.disconnect();
      },
      { threshold: 0.2, rootMargin: '0px 0px -8% 0px' }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = talentRef.current;
    if (!section) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    section.classList.add('talent--animate');
    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        section.classList.add('talent--in');
        observer.disconnect();
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = crumpleRef.current;
    if (!section) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    section.classList.add('crumple--animate');
    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        section.classList.add('crumple--in');
        observer.disconnect();
      },
      { threshold: 0.08, rootMargin: '0px 0px -8% 0px' }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = pricingRef.current;
    if (!section) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    section.classList.add('pricing--animate');
    const targets = section.querySelectorAll('[data-reveal]');
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('pricing-reveal--in');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -6% 0px' }
    );
    targets.forEach(target => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  if (user) return null;

  return (
    <div className="site" id="top">
      <span className="site-mark" aria-hidden="true">
        <img className="site-mark__logo" src={logo} alt="" draggable={false} />
        VaadIn
      </span>

      <header ref={headerRef} className="site-header">
        <div className="site-header__inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <PillNav
            logo={logo}
            logoAlt="VaadIn"
            logoHref="#top"
            items={navItems}
            itemStyle="pill"
            hoverEffect="fill"
            indicator="dot"
            theme="dark"
            collapseBelow={640}
            ariaLabel="Main"
          />
          <div style={{ display: 'flex', gap: '12px', zIndex: 30 }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#f8fafc',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                padding: '8px 18px',
                borderRadius: '999px',
                fontSize: '0.88rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Log In
            </button>
            <button
              onClick={() => navigate('/signup')}
              style={{
                backgroundColor: '#f8fafc',
                color: '#08080a',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '999px',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      <main className="stage">
        <div className="intro">
          <h1 className="intro__title">Your skills deserve more than a résumé.</h1>
          <p className="intro__sub">Let your ability speak for itself.</p>
        </div>

        <section className="panel" aria-labelledby="panel-title">
          <Iridescence
            color="#8099cc"
            hueShift={0}
            saturation={1}
            brightness={1.5}
            contrast={1}
            speed={1}
            scale={1}
            detail={8}
            warp={1}
            rotation={0}
            mouseReact={true}
            amplitude={0.1}
            stir={0.5}
            sheen={0.3}
            clickSwirl={true}
            grain={0}
            fade={0}
          />
          <div className="panel__content">
            <span id="panel-title" className="panel__title">
              <FoldText
                text="VaadIn"
                foldStyle="paper"
                splitBy="char"
                hinge="top"
                trigger="scroll"
                foldAngle={92}
                duration={0.65}
                stagger={0.045}
                staggerFrom="start"
                ease="power3.out"
                loopDelay={1.4}
                hoverRefold={true}
                refoldRadius={140}
                refoldAngle={45}
                perspective={700}
                creaseShading={0.55}
                fontSize="inherit"
                fontWeight="inherit"
                className="panel__fold"
              />
            </span>
            <SpecularButton
              size="lg"
              radius={18}
              tint="#000000"
              tintOpacity={0.38}
              textColor="#f5f5f5"
              lineColor="#ffffff"
              baseColor="#525252"
              intensity={1}
              idleIntensity={0.35}
              shineSize={10}
              shineFade={34}
              thickness={1.2}
              glow={1}
              followMouse
              proximity={250}
              onClick={() => navigate('/signup')}
              className="panel__cta"
            >
              Get Started
            </SpecularButton>
          </div>
        </section>

        <section
          ref={interviewRef}
          id="how-it-works"
          className="interview"
          aria-labelledby="interview-title"
        >
          <div className="interview__media">
            <InfiniteMenu
              items={interviewItems}
              count={160}
              tileSize={0.63}
              roundness={0.2}
              zoom={1.65}
              pullBack={1}
              stretch={0.6}
              inertia={0.6}
              autoplay={3}
              grayscale={true}
              dim={0.5}
              intro={true}
              showInfo={false}
              theme="dark"
              accentColor="#ffffff"
            />
          </div>
          <div className="interview__copy">
            <div className="interview__heading">
              <h2 id="interview-title" className="interview__title">
                Meet your AI interviewer.
              </h2>
              <div className="interview__strands">
                <Strands listening energy={0.6} />
              </div>
            </div>
            <p className="interview__body">
              Answer role-specific questions, explain your thinking, and demonstrate what you can actually do &mdash;
              just like a real interview.
            </p>
            <ol className="interview__steps">
              {interviewSteps.map((step, index) => (
                <li className="interview__step" key={step.title}>
                  <span className="interview__step-num" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')} &mdash;
                  </span>
                  <div className="interview__step-copy">
                    <h3 className="interview__step-title">{step.title}</h3>
                    <p className="interview__step-body">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section ref={talentRef} id="talent" className="talent" aria-labelledby="talent-title">
          <div className="talent__copy">
            <h2 id="talent-title" className="talent__title">
              <span className="talent__line">Stop hiring résumés.</span>
              <span className="talent__line talent__line--accent">Start hiring talent.</span>
            </h2>
            <p className="talent__body">
              The best candidate shouldn&rsquo;t be the one with the prettiest template. Look beyond polished PDFs and
              discover what candidates can actually do.
            </p>
          </div>
          <div className="talent__wall">
            <DriftWall
              items={resumeItems}
              columns={5}
              tileWidth={200}
              tileHeight={132}
              gap={18}
              tilt={16}
              turn={-14}
              perspective={1200}
              depth={120}
              speed={42}
              direction="up"
              variance={0.45}
              parallax={0.6}
              lift={64}
              fade={0.6}
              dim={0.55}
              overlayColor="#060010"
              ariaLabel="A drifting wall of candidate résumés"
            />
          </div>
        </section>

        <section ref={crumpleRef} id="insights" className="crumple" aria-labelledby="crumple-title">
          <div className="crumple__hero">
            <div className="crumple__intro">
              <h2 id="crumple-title" className="crumple__title">
                <span className="crumple__title-line">Crumble the résumé</span>
                <span className="crumple__title-line">
                  and get <em>actual insights.</em>
                </span>
              </h2>
            </div>
            <div className="crumple__visual">
              <PaperCrumple
                src="/assets/resume-paper.svg"
                alt="Candidate résumé, an interactive sheet of paper"
                width={240}
                height={312}
                sceneHeight={340}
                releaseBehavior="restore"
                crumpleAmount={0.85}
                crumpleDuration={0.55}
                releaseDuration={0.4}
                foldCount={6}
                foldSharpness={0.6}
                wrinkleDepth={0.65}
                creaseStrength={0.18}
                paperColor="#eef2f7"
                paperTexture={0.06}
                lightIntensity={1.6}
                draggable
                returnToOrigin
              />
            </div>
          </div>
          <InsightAccordion />
        </section>

        {/* Active Technical Roles Section */}
        <section id="jobs-section" style={{ width: '100%', maxWidth: '1200px', marginTop: 'clamp(100px, 16vh, 180px)' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ fontSize: '0.72rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#8099cc' }}>
              Open Positions
            </span>
            <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(2.5rem, 4.8vw, 4.2rem)', fontWeight: 400, color: '#f8fafc', margin: '10px 0 0' }}>
              Explore Live Technical Roles
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '1rem', marginTop: '10px', fontWeight: 300 }}>
              Sign up or log in to take an automated AI voice interview for any position.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {allJobs.map((job) => (
              <div
                key={job.id}
                style={{
                  backgroundColor: '#0a0a0d',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '20px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: job.gradient || 'linear-gradient(135deg, #8099cc, #495a7d)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '1.6rem', fontWeight: 400, color: '#f8fafc', margin: 0 }}>
                      {job.role}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#8099cc', fontWeight: 500, marginTop: '4px', display: 'block' }}>
                      🏢 {job.companyName || "VaadIn Partner"}
                    </span>
                  </div>
                  <span style={{ backgroundColor: 'rgba(128, 153, 204, 0.15)', color: '#8099cc', fontSize: '0.72rem', fontWeight: 600, padding: '4px 10px', borderRadius: '999px', border: '1px solid rgba(128, 153, 204, 0.3)' }}>
                    AI Ready
                  </span>
                </div>

                <p style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: '1.6', margin: '14px 0 16px', fontWeight: 300 }}>
                  {job.description}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                  {(Array.isArray(job.requirements) ? job.requirements : [job.requirements]).map((req) => (
                    <span key={req} style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', color: '#cbd5e1' }}>
                      {req}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/signup')}
                  style={{
                    marginTop: 'auto',
                    backgroundColor: '#f8fafc',
                    color: '#08080a',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '12px',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Sign Up to Take Screening →
                </button>
              </div>
            ))}
          </div>
        </section>

        <section ref={pricingRef} id="pricing" className="pricing" aria-labelledby="pricing-title">
          <h2 id="pricing-title" className="pricing__title" data-reveal>
            Pricing
          </h2>
          <div className="pricing__grid">
            {pricingPlans.map((plan, index) => (
              <div className="pricing-item" key={plan.name} data-reveal>
                <PixelCard {...pixelCardEffect} introDelay={index * 90} className="pricing-card">
                  <div className="pricing-card__inner">
                    <div className="pricing-card__meta">
                      <span className="pricing-card__audience">{plan.audience}</span>
                      <span className="pricing-card__index">{String(index + 1).padStart(2, '0')}</span>
                    </div>
                    <h3 className="pricing-card__name">{plan.name}</h3>
                    <p className="pricing-card__price">
                      {plan.price}
                      <span className="pricing-card__period">{plan.period}</span>
                    </p>
                    <ul className="pricing-card__features">
                      {plan.features.map(feature => (
                        <li className="pricing-card__feature" key={feature}>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </PixelCard>
              </div>
            ))}
          </div>
          <p className="pricing__note">
            Employer-required interviews are always free for candidates.
          </p>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__top">
            <div className="site-footer__identity">
              <a className="site-footer__brand" href="#top" aria-label="VaadIn, back to top">
                <img className="site-footer__logo" src={logo} alt="" draggable={false} />
                <span>VaadIn</span>
              </a>
              <p className="site-footer__tagline">Your ability, on the record.</p>
            </div>
            <nav className="site-footer__nav" aria-label="Footer">
              <a href="#how-it-works">How it works</a>
              <a href="#talent">Talent</a>
              <a href="#insights">Insights</a>
              <a href="#jobs-section">Active Roles</a>
              <a href="#pricing">Pricing</a>
            </nav>
          </div>
          <div className="site-footer__meta">
            <p>&copy; 2026 VaadIn. All rights reserved.</p>
            <a className="site-footer__top-link" href="#top">
              Back to top <span aria-hidden="true">&uarr;</span>
            </a>
          </div>
        </div>
        <div className="site-footer__crop" aria-hidden="true">
          <span className="site-footer__wordmark">VaadIn</span>
        </div>
      </footer>
    </div>
  );
}

// ==========================================
// Authenticated Home Page (User Dashboard)
// ==========================================
function HomePage() {
  const navigate = useNavigate();
  const [allJobs, setAllJobs] = useState(DEFAULT_JOBS);
  const [user, setUser] = useState(getStoredUser());

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

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch(`${API_URL}/api/jobs`);
        const data = await res.json();
        if (data?.jobs?.length) {
          setAllJobs([...data.jobs, ...DEFAULT_JOBS]);
        }
      } catch (e) {
        console.error("Could not fetch jobs", e);
      }
    }
    fetchJobs();
  }, []);

  if (!user) return null;

  return (
    <div className="site" id="top">
      <header className="site-header">
        <div className="site-header__inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/home" className="site-footer__brand" style={{ textDecoration: 'none' }}>
            <img className="site-footer__logo" src={logo} alt="" draggable={false} />
            <span>VaadIn</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc', background: 'rgba(255, 255, 255, 0.08)', padding: '6px 14px', borderRadius: '999px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
              {user.isCompany ? `🏢 ${user.companyName || user.name}` : `👤 ${user.name}`}
            </span>
            {user.isCompany && (
              <>
                <Link to="/company/jobs" style={{ color: '#8099cc', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600 }}>
                  Jobs 💼
                </Link>
                <Link to="/leaderboard" style={{ color: '#8099cc', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600 }}>
                  Leaderboard 🏆
                </Link>
              </>
            )}
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#f8fafc',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                padding: '8px 18px',
                borderRadius: '999px',
                fontSize: '0.88rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="stage" style={{ minHeight: '80vh', paddingTop: '40px' }}>
        {/* User Command Center */}
        <div
          style={{
            width: '100%',
            maxWidth: '1200px',
            backgroundColor: '#0a0a0d',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            padding: '28px 32px',
            marginBottom: '40px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '18px' }}>
            <div>
              <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '2rem', fontWeight: 400, color: '#f8fafc', margin: 0 }}>
                Welcome, {user.isCompany ? (user.companyName || user.name) : user.name}
              </h2>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginTop: '6px', fontWeight: 300 }}>
                {user.isCompany
                  ? "Manage active positions, set custom prompt rubrics, and view candidate scores."
                  : "Select a position below to upload your resume and begin your technical voice screening."}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {user.isCompany ? (
                <>
                  <button
                    onClick={() => navigate('/post-job')}
                    style={{
                      backgroundColor: '#f8fafc',
                      color: '#08080a',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '12px',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    + Post New Role
                  </button>
                  <button
                    onClick={() => navigate('/leaderboard')}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      color: '#f8fafc',
                      border: '1px solid rgba(255, 255, 255, 0.16)',
                      padding: '10px 20px',
                      borderRadius: '12px',
                      fontSize: '0.88rem',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Leaderboard 🏆
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Roles List */}
        <section style={{ width: '100%', maxWidth: '1200px' }}>
          <div style={{ textAlign: 'left', marginBottom: '28px' }}>
            <h3 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '2.2rem', fontWeight: 400, color: '#f8fafc', margin: 0 }}>
              Available Positions
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            {allJobs.map((job) => (
              <div
                key={job.id}
                style={{
                  backgroundColor: '#0a0a0d',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '20px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: job.gradient || 'linear-gradient(135deg, #8099cc, #495a7d)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '1.6rem', fontWeight: 400, color: '#f8fafc', margin: 0 }}>
                      {job.role}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#8099cc', fontWeight: 500, marginTop: '4px', display: 'block' }}>
                      🏢 {job.companyName || job.companyDetails?.name || "VaadIn Partner"}
                    </span>
                  </div>
                  <span style={{ backgroundColor: 'rgba(128, 153, 204, 0.15)', color: '#8099cc', fontSize: '0.72rem', fontWeight: 600, padding: '4px 10px', borderRadius: '999px', border: '1px solid rgba(128, 153, 204, 0.3)' }}>
                    AI Ready
                  </span>
                </div>

                <p style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: '1.6', margin: '14px 0 16px', fontWeight: 300 }}>
                  {job.description}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                  {(Array.isArray(job.requirements) ? job.requirements : [job.requirements]).map((req) => (
                    <span key={req} style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', color: '#cbd5e1' }}>
                      {req}
                    </span>
                  ))}
                </div>

                {job.extraInstructions && (
                  <div style={{ backgroundColor: 'rgba(128, 153, 204, 0.08)', border: '1px solid rgba(128, 153, 204, 0.2)', padding: '10px 14px', borderRadius: '10px', fontSize: '0.8rem', color: '#8099cc', marginBottom: '18px' }}>
                    🤖 <b>AI Instructions:</b> "{job.extraInstructions.slice(0, 90)}..."
                  </div>
                )}

                <button
                  onClick={() => navigate(`/apply/${job.id}`)}
                  style={{
                    marginTop: 'auto',
                    backgroundColor: '#f8fafc',
                    color: '#08080a',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '12px',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Apply & Take Voice Screening →
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__meta">
            <p>&copy; 2026 VaadIn. All rights reserved.</p>
          </div>
        </div>
      </footer>
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
    <div className="site" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: '440px', backgroundColor: '#0a0a0d', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '24px', padding: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#f8fafc', fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '1.6rem' }}>
            VaadIn
          </Link>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#8099cc', cursor: 'pointer', fontSize: '0.85rem' }}>
            ← Home
          </button>
        </div>

        <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '2rem', fontWeight: 400, color: '#f8fafc', margin: '0 0 6px' }}>
          Log In
        </h2>
        <p style={{ color: '#cbd5e1', fontSize: '0.88rem', margin: '0 0 24px', fontWeight: 300 }}>
          Access your candidate dashboard or recruiter portal.
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px' }}>Email</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', backgroundColor: '#121217', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '10px', padding: '12px 14px', color: '#f8fafc', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px' }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', backgroundColor: '#121217', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '10px', padding: '12px 14px', color: '#f8fafc', outline: 'none' }}
            />
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '0.82rem', margin: 0 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', backgroundColor: '#f8fafc', color: '#08080a', border: 'none', padding: '12px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }}
          >
            {loading ? "Authenticating..." : "Log In"}
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '0.85rem', color: '#cbd5e1', textAlign: 'center' }}>
          Don't have an account? <Link to="/signup" style={{ color: '#8099cc', textDecoration: 'none' }}>Sign up</Link>
        </p>
      </div>
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
      setError("Company Name is required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
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
    <div className="site" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: '480px', backgroundColor: '#0a0a0d', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '24px', padding: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#f8fafc', fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '1.6rem' }}>
            VaadIn
          </Link>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#8099cc', cursor: 'pointer', fontSize: '0.85rem' }}>
            ← Home
          </button>
        </div>

        <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '2rem', fontWeight: 400, color: '#f8fafc', margin: '0 0 6px' }}>
          Create Account
        </h2>
        <p style={{ color: '#cbd5e1', fontSize: '0.88rem', margin: '0 0 20px', fontWeight: 300 }}>
          Join VaadIn for automated AI technical interviewing.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '20px' }}>
          <div>
            <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.88rem' }}>🏢 Company Account</div>
            <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Post jobs and review candidate evaluations</div>
          </div>
          <input
            type="checkbox"
            checked={isCompany}
            onChange={(e) => setIsCompany(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#8099cc' }}
          />
        </div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px' }}>{isCompany ? "Contact Name" : "Full Name"}</label>
            <input
              type="text"
              placeholder="Aarav Mehta"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%', backgroundColor: '#121217', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '10px', padding: '12px 14px', color: '#f8fafc', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px' }}>Email</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', backgroundColor: '#121217', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '10px', padding: '12px 14px', color: '#f8fafc', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px' }}>Password (Min 6 chars)</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', backgroundColor: '#121217', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '10px', padding: '12px 14px', color: '#f8fafc', outline: 'none' }}
            />
          </div>

          {isCompany && (
            <div style={{ backgroundColor: 'rgba(128, 153, 204, 0.08)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(128, 153, 204, 0.2)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#8099cc', marginBottom: '4px' }}>Company Name *</label>
                <input
                  type="text"
                  placeholder="Acme Tech"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  style={{ width: '100%', backgroundColor: '#121217', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', padding: '10px 12px', color: '#f8fafc', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#8099cc', marginBottom: '4px' }}>Company Description</label>
                <textarea
                  placeholder="Brief company overview..."
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#121217', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', padding: '10px 12px', color: '#f8fafc', outline: 'none', height: '60px', resize: 'none' }}
                />
              </div>
            </div>
          )}

          {error && <p style={{ color: '#ef4444', fontSize: '0.82rem', margin: 0 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', backgroundColor: '#f8fafc', color: '#08080a', border: 'none', padding: '12px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }}
          >
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '0.85rem', color: '#cbd5e1', textAlign: 'center' }}>
          Already registered? <Link to="/login" style={{ color: '#8099cc', textDecoration: 'none' }}>Log in</Link>
        </p>
      </div>
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

      setNotice("Role successfully published!");
      setTimeout(() => navigate("/home"), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="site" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: '580px', backgroundColor: '#0a0a0d', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '24px', padding: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <Link to="/home" style={{ textDecoration: 'none', color: '#f8fafc', fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '1.6rem' }}>
            VaadIn
          </Link>
          <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', color: '#8099cc', cursor: 'pointer', fontSize: '0.85rem' }}>
            ← Back
          </button>
        </div>

        <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '2rem', fontWeight: 400, color: '#f8fafc', margin: '0 0 6px' }}>
          Post Role & AI Guidelines
        </h2>
        <p style={{ color: '#cbd5e1', fontSize: '0.88rem', margin: '0 0 24px', fontWeight: 300 }}>
          Define key criteria and prompt instructions for the AI interviewer.
        </p>

        <form onSubmit={handleSubmitJob} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px' }}>Role Title *</label>
            <input
              type="text"
              placeholder="e.g. Lead Machine Learning Engineer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              style={{ width: '100%', backgroundColor: '#121217', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '10px', padding: '12px 14px', color: '#f8fafc', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px' }}>Company Name</label>
            <input
              type="text"
              placeholder="Acme Tech"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              style={{ width: '100%', backgroundColor: '#121217', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '10px', padding: '12px 14px', color: '#f8fafc', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px' }}>Required Skills (Comma separated)</label>
            <textarea
              placeholder="e.g. PyTorch, Distributed Training, WebSockets"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              style={{ width: '100%', backgroundColor: '#121217', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '10px', padding: '12px 14px', color: '#f8fafc', outline: 'none', height: '60px', resize: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#8099cc', marginBottom: '6px' }}>
              🤖 Injected AI Interviewer System Prompt
            </label>
            <textarea
              placeholder="e.g. Probe the candidate on handling high concurrency in Node.js and distributed locking..."
              value={extraInstructions}
              onChange={(e) => setExtraInstructions(e.target.value)}
              style={{ width: '100%', backgroundColor: '#121217', border: '1px solid rgba(128, 153, 204, 0.3)', borderRadius: '10px', padding: '12px 14px', color: '#f8fafc', outline: 'none', height: '90px', resize: 'none' }}
            />
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '0.82rem', margin: 0 }}>{error}</p>}
          {notice && <p style={{ color: '#8099cc', fontSize: '0.82rem', margin: 0 }}>{notice}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', backgroundColor: '#f8fafc', color: '#08080a', border: 'none', padding: '12px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }}
          >
            {loading ? "Publishing..." : "Publish Position"}
          </button>
        </form>
      </div>
    </div>
  );
}

function CompanyJobsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser());
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        setError("Access Restricted: Only verified company accounts can access the recruiter dashboard.");
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
      <div className="site" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: '#0a0a0d', padding: '36px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.12)', textAlign: 'center', maxWidth: '400px' }}>
          <h3>Company Access Restricted</h3>
          <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Please log in with a company account.</p>
          <button onClick={() => navigate('/')} style={{ backgroundColor: '#f8fafc', color: '#08080a', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', marginTop: '12px' }}>
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="site">
      <header className="site-header">
        <div className="site-header__inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/home" className="site-footer__brand" style={{ textDecoration: 'none' }}>
            <img className="site-footer__logo" src={logo} alt="" draggable={false} />
            <span>VaadIn</span>
          </Link>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => navigate('/post-job')} style={{ backgroundColor: '#f8fafc', color: '#08080a', border: 'none', padding: '8px 18px', borderRadius: '999px', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}>
              + Post Role
            </button>
          </div>
        </div>
      </header>

      <main className="stage" style={{ minHeight: '80vh', paddingTop: '40px' }}>
        <div style={{ width: '100%', maxWidth: '1200px' }}>
          <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '2.4rem', fontWeight: 400, color: '#f8fafc', margin: '0 0 24px' }}>
            Company Jobs Dashboard 💼
          </h2>

          {loading ? (
            <p style={{ color: '#cbd5e1' }}>Loading job listings...</p>
          ) : error ? (
            <p style={{ color: '#ef4444' }}>{error}</p>
          ) : jobs.length === 0 ? (
            <div style={{ backgroundColor: '#0a0a0d', padding: '40px', borderRadius: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ color: '#cbd5e1' }}>No roles posted yet.</p>
              <button onClick={() => navigate('/post-job')} style={{ backgroundColor: '#f8fafc', color: '#08080a', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>
                + Post First Role
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
              {jobs.map((job) => (
                <div key={job.id} style={{ backgroundColor: '#0a0a0d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '1.5rem', fontWeight: 400, color: '#f8fafc', margin: 0 }}>
                      {job.role}
                    </h3>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', backgroundColor: job.status === 'closed' ? 'rgba(239,68,68,0.15)' : 'rgba(128,153,204,0.15)', color: job.status === 'closed' ? '#ef4444' : '#8099cc' }}>
                      {job.status === 'closed' ? 'Closed' : 'Active'}
                    </span>
                  </div>

                  <p style={{ color: '#cbd5e1', fontSize: '0.88rem', margin: '12px 0' }}>{job.description}</p>

                  <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '16px' }}>
                    <button
                      onClick={() => navigate(`/company/jobs/${job.id}/applicants`)}
                      style={{ flex: 1, backgroundColor: '#f8fafc', color: '#08080a', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      Applicants 👥
                    </button>
                    <button
                      onClick={() => handleToggleJobStatus(job.id, job.status)}
                      style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: '10px', fontWeight: 500, cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      {job.status === 'closed' ? 'Reopen' : 'Close'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

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
        setError("Access Restricted.");
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

  if (!user?.isCompany) return null;

  return (
    <div className="site">
      <header className="site-header">
        <div className="site-header__inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/company/jobs" style={{ color: '#8099cc', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
            ← Back to Jobs
          </Link>
          <span style={{ fontSize: '1rem', fontWeight: 600 }}>Applicants for Role ID: {jobId}</span>
        </div>
      </header>

      <main className="stage" style={{ minHeight: '80vh', paddingTop: '40px' }}>
        <div style={{ width: '100%', maxWidth: '1000px' }}>
          <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '2.4rem', fontWeight: 400, color: '#f8fafc', margin: '0 0 24px' }}>
            Candidate Applicants 👥
          </h2>

          {loading ? (
            <p style={{ color: '#cbd5e1' }}>Loading applicant evaluations...</p>
          ) : error ? (
            <p style={{ color: '#ef4444' }}>{error}</p>
          ) : applicants.length === 0 ? (
            <div style={{ backgroundColor: '#0a0a0d', padding: '40px', borderRadius: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ color: '#cbd5e1' }}>No candidates have completed an interview for this role yet.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {applicants.map((item, index) => (
                <div key={item.sessionId || index} style={{ backgroundColor: '#0a0a0d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '1.5rem', fontWeight: 400, margin: 0 }}>
                        {item.candidateName}
                      </h3>
                      <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Score: <strong style={{ color: '#8099cc' }}>{item.score}/100</strong></span>
                    </div>

                    <button
                      onClick={() => setSelectedCandidate(selectedCandidate?.sessionId === item.sessionId ? null : item)}
                      style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      {selectedCandidate?.sessionId === item.sessionId ? "Hide" : "Review Details"}
                    </button>
                  </div>

                  {selectedCandidate?.sessionId === item.sessionId && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: '1.6' }}>{item.summary}</p>
                      {item.resumeUrl && (
                        <a href={item.resumeUrl.startsWith('http') ? item.resumeUrl : `${API_URL}${item.resumeUrl}`} target="_blank" rel="noreferrer" style={{ color: '#8099cc', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
                          📄 Download Resume PDF
                        </a>
                      )}
                      {item.videoUrl && (
                        <div style={{ marginTop: '14px' }}>
                          <video src={item.videoUrl.startsWith('http') ? item.videoUrl : `${API_URL}${item.videoUrl}`} controls style={{ width: '100%', maxWidth: '380px', borderRadius: '10px' }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function LeaderboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser());
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        setError("Access Restricted.");
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

  if (!user?.isCompany) return null;

  return (
    <div className="site">
      <header className="site-header">
        <div className="site-header__inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/home" className="site-footer__brand" style={{ textDecoration: 'none' }}>
            <img className="site-footer__logo" src={logo} alt="" draggable={false} />
            <span>VaadIn</span>
          </Link>
          <button onClick={() => navigate('/home')} style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.16)', padding: '8px 18px', borderRadius: '999px', fontSize: '0.88rem', cursor: 'pointer' }}>
            ← Home
          </button>
        </div>
      </header>

      <main className="stage" style={{ minHeight: '80vh', paddingTop: '40px' }}>
        <div style={{ width: '100%', maxWidth: '1000px' }}>
          <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '2.4rem', fontWeight: 400, color: '#f8fafc', margin: '0 0 24px' }}>
            Candidate Scoreboard 🏆
          </h2>

          {loading ? (
            <p style={{ color: '#cbd5e1' }}>Loading candidate leaderboard...</p>
          ) : error ? (
            <p style={{ color: '#ef4444' }}>{error}</p>
          ) : leaderboard.length === 0 ? (
            <div style={{ backgroundColor: '#0a0a0d', padding: '40px', borderRadius: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ color: '#cbd5e1' }}>No candidate evaluations recorded yet.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '14px' }}>
              {leaderboard.map((item, index) => (
                <div key={item.sessionId || index} style={{ backgroundColor: '#0a0a0d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#8099cc', fontWeight: 600 }}>#{index + 1} Candidate</span>
                    <h3 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '1.4rem', fontWeight: 400, margin: '2px 0' }}>
                      {item.candidateName}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Role: {item.jobRole}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.8rem', fontFamily: "'Instrument Serif', Georgia, serif", color: '#8099cc' }}>{item.score}</span>
                    <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>/100</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
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
      setNotice(`Resume verified for ${data.candidateName}. Ready for voice interview.`);
    } catch (err) {
      setError(err.message || "Could not upload resume.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="site" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: '500px', backgroundColor: '#0a0a0d', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '24px', padding: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <Link to="/home" style={{ textDecoration: 'none', color: '#f8fafc', fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '1.6rem' }}>
            VaadIn
          </Link>
          <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', color: '#8099cc', cursor: 'pointer', fontSize: '0.85rem' }}>
            ← Cancel
          </button>
        </div>

        <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '2rem', fontWeight: 400, color: '#f8fafc', margin: '0 0 6px' }}>
          Apply for {selectedJob?.role || "Role"}
        </h2>
        <p style={{ color: '#cbd5e1', fontSize: '0.88rem', margin: '0 0 24px', fontWeight: 300 }}>
          Upload your PDF resume to generate personalized interview questions.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setResumeFile(e.target.files[0])}
            style={{ backgroundColor: '#121217', border: '2px dashed rgba(255, 255, 255, 0.2)', padding: '20px', borderRadius: '12px', color: '#f8fafc', cursor: 'pointer' }}
          />
          <button
            onClick={uploadResume}
            disabled={!resumeFile || uploading}
            style={{ backgroundColor: '#f8fafc', color: '#08080a', border: 'none', padding: '12px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}
          >
            {uploading ? "Extracting Context..." : "Verify Resume"}
          </button>
        </div>

        {error && <p style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '12px' }}>{error}</p>}
        {notice && <p style={{ color: '#8099cc', fontSize: '0.82rem', marginTop: '12px' }}>{notice}</p>}

        {resumeSession && (
          <div style={{ marginTop: '20px', padding: '16px', backgroundColor: 'rgba(128, 153, 204, 0.1)', borderRadius: '12px', border: '1px solid rgba(128, 153, 204, 0.25)' }}>
            <p style={{ margin: 0, fontWeight: 600, color: '#f8fafc' }}>
              Candidate: {resumeSession.candidateName}
            </p>
            <button
              onClick={() => navigate(`/interview/${resumeSession.sessionId}`)}
              style={{ marginTop: '12px', width: '100%', backgroundColor: '#f8fafc', color: '#08080a', border: 'none', padding: '12px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Launch Live Interview 🚀
            </button>
          </div>
        )}
      </div>
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
      const formData = new FormData();
      formData.append("video", videoBlob, `interview_${sessionId}.webm`);
      formData.append("sessionId", sessionId);

      await fetch(`${API_URL}/api/upload-video`, {
        method: "POST",
        body: formData,
      });
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
        videoBitsPerSecond: 250000,
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
    <div style={{ position: 'fixed', inset: 0, backgroundColor: '#08080a', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0a0a0d', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '1.4rem', color: '#f8fafc' }}>
          VaadIn Interview
        </span>
        <div style={{ fontSize: '0.85rem', color: '#8099cc', fontWeight: 600 }}>
          Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
        </div>
        <button onClick={stopInterview} disabled={stopping} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
          {stopping ? "Ending..." : "End Interview"}
        </button>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', backgroundColor: '#121217' }}>
        <div style={{ position: 'relative', backgroundColor: '#08080a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={AI_AGENT_GIF} alt="AI Avatar" style={{ width: '200px', height: '200px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #8099cc' }} />
          <span style={{ position: 'absolute', top: '16px', left: '16px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '4px 12px', borderRadius: '999px', fontSize: '0.78rem', color: '#f8fafc' }}>
            🤖 AI Interviewer
          </span>
        </div>

        <div style={{ position: 'relative', backgroundColor: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <video ref={videoElementRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <span style={{ position: 'absolute', top: '16px', left: '16px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '4px 12px', borderRadius: '999px', fontSize: '0.78rem', color: '#f8fafc' }}>
            👤 You
          </span>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(10, 10, 13, 0.9)', padding: '12px 24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)', maxWidth: '750px', width: '90%', textAlign: 'center' }}>
        <span style={{ color: '#8099cc', fontWeight: 700, marginRight: '8px' }}>[{latestSubtitle.speaker}]</span>
        <span style={{ color: '#f8fafc', fontSize: '0.95rem' }}>{latestSubtitle.text}</span>
      </div>
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

  if (loading || !evaluation) {
    return (
      <div className="site" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: '#0a0a0d', padding: '40px', borderRadius: '24px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.12)' }}>
          <h3 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '1.8rem', margin: 0 }}>Evaluating Response...</h3>
          <p style={{ color: '#cbd5e1', fontSize: '0.88rem', marginTop: '8px' }}>Analyzing candidate transcript and technical metrics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="site" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: '640px', backgroundColor: '#0a0a0d', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '24px', padding: '36px', textAlign: 'center' }}>
        <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '4px solid #8099cc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '2.5rem', fontWeight: 400, color: '#f8fafc' }}>{evaluation?.score || 0}</span>
          <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>/ 100</span>
        </div>

        <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '2.2rem', fontWeight: 400, color: '#f8fafc', margin: '0 0 6px' }}>
          Interview Evaluation
        </h2>
        <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: '0 0 20px', fontWeight: 300 }}>
          Objective analysis calculated by VaadIn AI.
        </p>

        {evaluation.summary && (
          <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', padding: '18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'left', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 6px', color: '#8099cc', fontSize: '0.9rem' }}>Feedback Summary</h4>
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.88rem', lineHeight: '1.6' }}>{evaluation.summary}</p>
          </div>
        )}

        <button
          onClick={() => navigate('/home')}
          style={{ width: '100%', backgroundColor: '#f8fafc', color: '#08080a', border: 'none', padding: '12px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}
        >
          Return Home
        </button>
      </div>
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
