import { useNavigate } from "react-router-dom";
import {
  Brain, Layers, BarChart3, MessageSquare, Users, Zap,
  TrendingUp, ShieldCheck, Clock, Target, ArrowRight,
  ChevronRight, Mail, Linkedin, AlertTriangle, Filter,
  Activity, Database, GitMerge, CheckCircle, Cpu,
} from "lucide-react";
import "../styles/Landing.css";

/* ── Navbar ─────────────────────────────────────────────────────────────── */
function Navbar() {
  const navigate = useNavigate();
  return (
    <nav className="lp-nav">
      <div className="lp-nav-logo">PROD PILOT</div>
      <ul className="lp-nav-links">
        <li><a href="#features">Features</a></li>
        <li><a href="#how-it-works">How It Works</a></li>
        <li><a href="#benefits">Benefits</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
      <a className="lp-nav-cta" onClick={() => navigate("/signin")}>Sign In</a>
    </nav>
  );
}

/* ── Hero ────────────────────────────────────────────────────────────────── */
function Hero() {
  const navigate = useNavigate();

  const bars = [
    { label: "QA Team",   pct: 78, color: "#EF4444" },
    { label: "Frontend",  pct: 55, color: "#8B5CF6" },
    { label: "Backend",   pct: 90, color: "#F59E0B" },
    { label: "Data",      pct: 42, color: "#22C55E" },
  ];

  const chips = [
    { label: "API Failure — HIGH",  bg: "rgba(239,68,68,.14)",  color: "#F87171" },
    { label: "DB Issue — MEDIUM",   bg: "rgba(245,158,11,.14)", color: "#FCD34D" },
    { label: "UI Bug — LOW",        bg: "rgba(139,92,246,.14)", color: "#A78BFA" },
  ];

  return (
    <section className="lp-hero">
      <div className="lp-hero-bg" />
      <div className="lp-hero-grid-overlay" />
      <div className="lp-container">
        <div className="lp-hero-inner">

          {/* Copy */}
          <div>
            <div className="lp-eyebrow">
              <span className="lp-eyebrow-dot" />
              AI-Powered Product Intelligence
            </div>
            <h1 className="lp-hero-h1">
              Turn Product Chaos<br />
              into <span className="lp-gradient-text">Clear Decisions</span>
            </h1>
            <p className="lp-hero-sub">
              PROD PILOT reads every piece of engineering feedback, clusters issues
              by severity, and hands your PM a prioritized action plan — automatically.
            </p>
            <div className="lp-hero-actions">
              <a className="lp-btn-primary" onClick={() => navigate("/signup")}>
                Get Started <ArrowRight size={15} />
              </a>
              <a className="lp-btn-ghost" href="#how-it-works">
                See How It Works <ChevronRight size={15} />
              </a>
            </div>
          </div>

          {/* Mockup — static 3-D tilt, no float animation */}
          <div className="lp-hero-visual">
            <div className="lp-mockup">
              <div className="lp-mockup-titlebar">
                <div className="lp-mockup-dot" style={{ background: "#EF4444" }} />
                <div className="lp-mockup-dot" style={{ background: "#F59E0B" }} />
                <div className="lp-mockup-dot" style={{ background: "#22C55E" }} />
                <span className="lp-mockup-label">PROD PILOT — PM Dashboard</span>
              </div>

              <div className="lp-mockup-kpis">
                <div className="lp-kpi">
                  <div className="lp-kpi-val">84</div>
                  <div className="lp-kpi-label">Health Score</div>
                </div>
                <div className="lp-kpi">
                  <div className="lp-kpi-val" style={{ color: "#22C55E" }}>Stable</div>
                  <div className="lp-kpi-label">Risk Level</div>
                </div>
                <div className="lp-kpi">
                  <div className="lp-kpi-val">142</div>
                  <div className="lp-kpi-label">Feedback</div>
                </div>
              </div>

              <div className="lp-mockup-bars">
                {bars.map((b) => (
                  <div key={b.label} className="lp-bar-row">
                    <span className="lp-bar-label">{b.label}</span>
                    <div className="lp-bar-track">
                      <div className="lp-bar-fill" style={{ width: `${b.pct}%`, background: b.color }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="lp-mockup-chips">
                {chips.map((c) => (
                  <span key={c.label} className="lp-chip" style={{ background: c.bg, color: c.color }}>
                    {c.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Stats strip */}
        <div className="lp-stats">
          {[
            { val: "4x",   label: "Faster triage" },
            { val: "100%", label: "Feedback coverage" },
            { val: "5",    label: "Role dashboards" },
            { val: "Real-time", label: "AI insights" },
          ].map((s) => (
            <div key={s.label} className="lp-stat">
              <div className="lp-stat-val">{s.val}</div>
              <div className="lp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Problem ─────────────────────────────────────────────────────────────── */
function Problem() {
  const items = [
    {
      Icon: AlertTriangle,
      title: "Feedback is scattered everywhere",
      desc: "Slack threads, Jira tickets, retros — critical signals get buried before anyone acts on them.",
    },
    {
      Icon: Filter,
      title: "Prioritization is guesswork",
      desc: "Without structured data, PMs rely on whoever speaks loudest rather than what actually matters.",
    },
    {
      Icon: Activity,
      title: "Manual analysis burns teams out",
      desc: "Hours spent reading and tagging feedback that an AI could process in seconds.",
    },
  ];

  return (
    <section className="lp-section" id="problem">
      <div className="lp-container">
        <div className="lp-section-hd">
          <div className="lp-section-label">The Problem</div>
          <h2 className="lp-section-h2">Product teams are drowning in noise</h2>
          <p className="lp-section-sub">
            The average PM spends 40% of their week just trying to understand what their team is experiencing.
            That time should be spent building.
          </p>
        </div>
        <div className="lp-problem-grid">
          {items.map(({ Icon, title, desc }) => (
            <div key={title} className="lp-problem-card">
              <div className="lp-problem-icon"><Icon size={18} /></div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Solution pipeline ───────────────────────────────────────────────────── */
function Solution() {
  const steps = [
    { num: "01", Icon: MessageSquare, title: "Collect",  desc: "Engineers submit feedback from role-specific dashboards" },
    { num: "02", Icon: Cpu,           title: "Analyze",  desc: "Sentiment scoring and pattern detection run automatically" },
    { num: "03", Icon: GitMerge,      title: "Cluster",  desc: "Similar issues grouped into named, actionable categories" },
    { num: "04", Icon: BarChart3,     title: "Prioritize", desc: "Issues ranked by severity, frequency, and team impact" },
    { num: "05", Icon: CheckCircle,   title: "Decide",   desc: "PM receives a clear action block with recommended next steps" },
  ];

  return (
    <section className="lp-section" style={{ background: "rgba(99,102,241,0.025)" }}>
      <div className="lp-container">
        <div className="lp-section-hd lp-section-hd--c">
          <div className="lp-section-label">The Solution</div>
          <h2 className="lp-section-h2">From raw feedback to clear action</h2>
          <p className="lp-section-sub">
            PROD PILOT connects every step of the feedback loop so nothing falls through the cracks.
          </p>
        </div>
        <div className="lp-pipeline">
          {steps.map(({ num, Icon, title, desc }) => (
            <div key={num} className="lp-pipe-step">
              <div className="lp-pipe-num">
                <Icon size={18} />
              </div>
              <h4>{title}</h4>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Features ────────────────────────────────────────────────────────────── */
function Features() {
  const cards = [
    {
      Icon: Brain,
      bg: "rgba(99,102,241,.1)", color: "#818CF8",
      accent: "linear-gradient(90deg,#6366F1,#8B5CF6)",
      title: "AI Feedback Summarization",
      desc: "Mistral LLM generates structured technical and business summaries from every piece of feedback — no manual reading required.",
    },
    {
      Icon: Layers,
      bg: "rgba(139,92,246,.1)", color: "#A78BFA",
      accent: "linear-gradient(90deg,#8B5CF6,#EC4899)",
      title: "Smart Clustering",
      desc: "Similar issues are automatically grouped into named clusters like API Failure, DB Issue, or UI Bug across all teams.",
    },
    {
      Icon: BarChart3,
      bg: "rgba(245,158,11,.1)", color: "#FCD34D",
      accent: "linear-gradient(90deg,#F59E0B,#EF4444)",
      title: "Priority Scoring",
      desc: "Each cluster gets a severity score — HIGH, MEDIUM, or LOW — based on frequency, sentiment, and team impact.",
    },
    {
      Icon: MessageSquare,
      bg: "rgba(236,72,153,.1)", color: "#F472B6",
      accent: "linear-gradient(90deg,#EC4899,#8B5CF6)",
      title: "Sentiment Analysis",
      desc: "Every entry is scored POSITIVE, NEUTRAL, or NEGATIVE using DistilBERT, giving you a real-time product health score.",
    },
    {
      Icon: Users,
      bg: "rgba(34,197,94,.1)", color: "#4ADE80",
      accent: "linear-gradient(90deg,#22C55E,#6366F1)",
      title: "Role-Based Dashboards",
      desc: "QA, Frontend, Backend, and Data engineers each get a tailored view of the feedback most relevant to their domain.",
    },
    {
      Icon: Target,
      bg: "rgba(99,102,241,.1)", color: "#818CF8",
      accent: "linear-gradient(90deg,#6366F1,#F472B6)",
      title: "Decision Intelligence",
      desc: "The PM dashboard surfaces a Priority Decision Block with top issue, root cause, affected teams, and a recommended action.",
    },
  ];

  return (
    <section className="lp-section" id="features">
      <div className="lp-container">
        <div className="lp-section-hd">
          <div className="lp-section-label">Features</div>
          <h2 className="lp-section-h2">Everything a PM needs to move fast</h2>
          <p className="lp-section-sub">Built for product teams that want signal, not noise.</p>
        </div>
        <div className="lp-features-grid">
          {cards.map(({ Icon, bg, color, accent, title, desc }) => (
            <div
              key={title}
              className="lp-feature-card"
              style={{ "--card-accent": accent }}
            >
              <div className="lp-feature-icon" style={{ background: bg, color }}>
                <Icon size={20} />
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── How It Works ────────────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    { num: "01", title: "Collect Feedback",       desc: "Engineers submit feedback from their role-specific dashboard. No extra tools needed." },
    { num: "02", title: "AI Processes and Groups", desc: "Sentiment analysis runs instantly. Mistral LLM clusters and summarizes issues in the background." },
    { num: "03", title: "Insights Generated",      desc: "The PM dashboard updates with health score, risk level, technical summary, and business summary." },
    { num: "04", title: "PM Takes Action",         desc: "The Priority Decision Block tells you exactly what to fix, who owns it, and when to do it." },
  ];

  return (
    <section className="lp-section" id="how-it-works">
      <div className="lp-container">
        <div className="lp-section-hd lp-section-hd--c">
          <div className="lp-section-label">How It Works</div>
          <h2 className="lp-section-h2">Four steps from feedback to action</h2>
        </div>
        <div className="lp-steps-row">
          {steps.map(({ num, title, desc }) => (
            <div key={num} className="lp-step">
              <div className="lp-step-num">{num}</div>
              <h4>{title}</h4>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Benefits ────────────────────────────────────────────────────────────── */
function Benefits() {
  const items = [
    { Icon: Zap,         title: "Faster Decisions",        desc: "Cut analysis time from hours to seconds with AI-generated summaries." },
    { Icon: Brain,       title: "Reduced Cognitive Load",  desc: "Stop reading every ticket. Let the system surface what matters." },
    { Icon: Users,       title: "Better Alignment",        desc: "Every team sees the same data, reducing miscommunication." },
    { Icon: TrendingUp,  title: "Improved Product Quality", desc: "Catch recurring issues before they become customer-facing problems." },
    { Icon: ShieldCheck, title: "Less Burnout",            desc: "Engineers spend time building, not writing status reports." },
    { Icon: Clock,       title: "Faster Cycles",           desc: "Shorter feedback loops mean faster iteration and shipping." },
  ];

  return (
    <section className="lp-section" id="benefits" style={{ background: "rgba(99,102,241,0.02)" }}>
      <div className="lp-container">
        <div className="lp-section-hd">
          <div className="lp-section-label">Benefits</div>
          <h2 className="lp-section-h2">Built for teams that ship fast</h2>
          <p className="lp-section-sub">
            PROD PILOT removes the friction between feedback and action so your team can focus on building.
          </p>
        </div>
        <div className="lp-benefits-grid">
          {items.map(({ Icon, title, desc }) => (
            <div key={title} className="lp-benefit">
              <div className="lp-benefit-icon"><Icon size={15} /></div>
              <div>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA ─────────────────────────────────────────────────────────────────── */
function CTA() {
  const navigate = useNavigate();
  return (
    <section className="lp-cta">
      <div className="lp-cta-glow" />
      <div className="lp-container" style={{ position: "relative", zIndex: 1 }}>
        <h2>
          Ready to stop guessing<br />
          and start <span className="lp-gradient-text">deciding</span>?
        </h2>
        <p>Set up your organization in under 2 minutes. No credit card required.</p>
        <a
          className="lp-btn-primary"
          onClick={() => navigate("/signup")}
          style={{ display: "inline-flex" }}
        >
          Start Using PROD PILOT <ArrowRight size={15} />
        </a>
      </div>
    </section>
  );
}

/* ── Contact ─────────────────────────────────────────────────────────────── */
function Contact() {
  return (
    <section className="lp-contact" id="contact">
      <div className="lp-container">
        <div className="lp-contact-inner">
          <div className="lp-contact-text">
            <h3>Get in touch</h3>
            <p>Questions, feedback, or partnership inquiries — reach out directly.</p>
          </div>
          <div className="lp-contact-links">
            <a href="mailto:adityanair5002@gmail.com" className="lp-contact-link lp-contact-link--email">
              <Mail size={14} />
              adityanair5002@gmail.com
            </a>
            <a
              href="https://www.linkedin.com/in/adinair01/"
              target="_blank"
              rel="noopener noreferrer"
              className="lp-contact-link lp-contact-link--li"
            >
              <Linkedin size={14} />
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ──────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="lp-footer">
      <div>
        <div className="lp-footer-logo">PROD PILOT</div>
        <div className="lp-footer-tagline">Turn feedback into decisions.</div>
      </div>
      <ul className="lp-footer-links">
        <li><a href="#features">Features</a></li>
        <li><a href="#how-it-works">How It Works</a></li>
        <li><a href="#benefits">Benefits</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
      <div className="lp-footer-copy">
        &copy; {new Date().getFullYear()} PROD PILOT. All rights reserved.
      </div>
    </footer>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function Landing() {
  return (
    <>
      <Navbar />
      <Hero />
      <div className="lp-divider" />
      <Problem />
      <div className="lp-divider" />
      <Solution />
      <div className="lp-divider" />
      <Features />
      <div className="lp-divider" />
      <HowItWorks />
      <div className="lp-divider" />
      <Benefits />
      <div className="lp-divider" />
      <CTA />
      <Contact />
      <Footer />
    </>
  );
}
