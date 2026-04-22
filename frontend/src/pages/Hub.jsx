import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { MessageSquare, Cpu, LogOut, Building2, ArrowRight } from "lucide-react";
import "../styles/Hub.css";

export default function Hub() {
  const navigate = useNavigate();

  const org = (() => {
    try { return JSON.parse(localStorage.getItem("organization")); } catch { return null; }
  })();

  const handleLogout = useCallback(async () => {
    try {
      const { api } = await import("../api/axios");
      await api.post("/auth/logout");
    } catch { /* silent */ }
    localStorage.removeItem("organization");
    localStorage.removeItem("user");
    navigate("/");
  }, [navigate]);

  return (
    <div className="hub-wrap">
      <div className="hub-glow-tl" />
      <div className="hub-glow-br" />

      {/* Navbar */}
      <nav className="hub-nav">
        <span className="hub-logo">PROD PILOT</span>
        <div className="hub-nav-right">
          {org && (
            <span className="hub-org-badge">
              <Building2 size={13} />
              <span className="hub-org-name">{org.name}</span>
            </span>
          )}
          <button className="hub-logout" onClick={handleLogout}>
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="hub-main">
        <div className="hub-header">
          {org && (
            <div className="hub-workspace-tag">
              <span className="hub-workspace-dot" />
              {org.name} workspace
            </div>
          )}
          <h1 className="hub-title">
            Your product command centre<br />
            is <span className="hub-title-hi">ready.</span>
          </h1>
          <p className="hub-sub">
            Two modules. One platform. Pick where you need to focus right now.
          </p>
        </div>

        <div className="hub-cards">

          {/* Feedback Intelligence */}
          <button className="hub-card hub-card--fi" onClick={() => navigate("/dashboard")}>
            <div className="hub-card-inner-glow" />

            <div className="hub-card-header">
              <div className="hub-icon hub-icon--fi">
                <MessageSquare size={24} strokeWidth={1.75} />
              </div>
              <span className="hub-badge hub-badge--live">Live</span>
            </div>

            <h2 className="hub-card-title hub-card-title--fi">
              Feedback Intelligence
            </h2>

            <p className="hub-card-hook">
              Know exactly what your engineering teams are experiencing — before it becomes a blocker.
            </p>

            <p className="hub-card-desc">
              Every piece of feedback from QA, Frontend, Backend, and Data is automatically
              scored for sentiment, tagged by severity, and surfaced in a role-specific view.
              You see the full picture without reading a single ticket.
            </p>

            <ul className="hub-pills hub-pills--fi">
              <li>Real-time sentiment scoring</li>
              <li>Role-based dashboards</li>
              <li>Issue severity tracking</li>
              <li>Cross-team visibility</li>
            </ul>

            <div className="hub-card-footer hub-card-footer--fi">
              Open Feedback Intelligence
              <ArrowRight size={15} />
            </div>
          </button>

          {/* Decision Engine */}
          <button className="hub-card hub-card--de" onClick={() => navigate("/decision-engine")}>
            <div className="hub-card-inner-glow" />

            <div className="hub-card-header">
              <div className="hub-icon hub-icon--de">
                <Cpu size={24} strokeWidth={1.75} />
              </div>
              <span className="hub-badge hub-badge--ai">AI</span>
            </div>

            <h2 className="hub-card-title hub-card-title--de">
              Decision Engine
            </h2>

            <p className="hub-card-hook">
              Stop guessing what to prioritize. Let the AI tell you what to fix, who owns it, and when.
            </p>

            <p className="hub-card-desc">
              The Decision Engine processes all incoming feedback, clusters recurring issues,
              calculates a product health score, and generates a Priority Decision Block —
              a structured action plan built specifically for product managers.
            </p>

            <ul className="hub-pills hub-pills--de">
              <li>AI-generated action plans</li>
              <li>Priority decision blocks</li>
              <li>Product health scoring</li>
              <li>Root cause analysis</li>
            </ul>

            <div className="hub-card-footer hub-card-footer--de">
              Open Decision Engine
              <ArrowRight size={15} />
            </div>
          </button>

        </div>

        <p className="hub-footnote">
          Both modules share the same data. Changes in one are reflected in the other instantly.
        </p>
      </main>
    </div>
  );
}
