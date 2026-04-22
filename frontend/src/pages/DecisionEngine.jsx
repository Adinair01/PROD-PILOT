import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Cpu, Zap, AlertCircle, RotateCcw,
  Database, TrendingUp, Users, Clock, ShieldAlert,
  CheckCircle2, AlertTriangle, Minus,
} from "lucide-react";
import { api } from "../api/axios";
import "../styles/DecisionEngine.css";

const PRIORITY_COLOR = {
  IMMEDIATE:   "#EF4444",
  THIS_SPRINT: "#F59E0B",
  NEXT_SPRINT: "#22C55E",
};
const IMPACT_COLOR = { HIGH: "#EF4444", MEDIUM: "#F59E0B", LOW: "#22C55E" };
const CONFIDENCE_COLOR = { HIGH: "#22C55E", MEDIUM: "#F59E0B", LOW: "#EF4444" };

export default function DecisionEngine() {
  const navigate = useNavigate();

  const [problemSummary, setProblemSummary]   = useState("");
  const [context, setContext]                 = useState("");
  const [error, setError]                     = useState("");
  const [loading, setLoading]                 = useState(false);
  const [decision, setDecision]               = useState(null);

  // Feedback context loaded from org
  const [feedbackCtx, setFeedbackCtx]         = useState(null);
  const [ctxLoading, setCtxLoading]           = useState(true);

  // Load org feedback context on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/decision-engine/context");
        setFeedbackCtx(res.data);
      } catch {
        setFeedbackCtx({ hasData: false, total: 0 });
      } finally {
        setCtxLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!problemSummary.trim()) {
      setError("Tell us what the problem is first.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/decision-engine/analyze", {
        problemSummary: problemSummary.trim(),
        context: context.trim(),
      });
      setDecision(res.data.decision);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate insight. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setProblemSummary("");
    setContext("");
    setError("");
    setDecision(null);
  };

  return (
    <div className="de-wrap">
      <div className="de-orb de-orb--1" />
      <div className="de-orb de-orb--2" />

      {/* Nav */}
      <nav className="de-nav">
        <button className="de-back" onClick={() => navigate("/hub")}>
          <ArrowLeft size={14} /> Back
        </button>
        <span className="de-nav-logo">PROD PILOT</span>
        <span className="de-nav-chip">
          <Cpu size={12} /> Decision Engine
        </span>
      </nav>

      <main className="de-main">
        {!decision ? (
          <>
            {/* Hero */}
            <div className="de-hero">
              <div className="de-hero-icon">
                <Cpu size={26} strokeWidth={1.5} />
              </div>
              <h1 className="de-hero-title">What problem needs solving?</h1>
              <p className="de-hero-sub">
                Describe it. The engine will analyze it against your team&apos;s live feedback and generate a prioritized action plan.
              </p>
            </div>

            {/* Feedback context indicator */}
            <div className={`de-ctx-bar ${feedbackCtx?.hasData ? "de-ctx-bar--loaded" : "de-ctx-bar--empty"}`}>
              <Database size={13} />
              {ctxLoading
                ? "Loading feedback context..."
                : feedbackCtx?.hasData
                  ? `${feedbackCtx.total} feedback entries loaded from your organization — ${feedbackCtx.negPct}% negative signals`
                  : "No feedback data yet — submit feedback first for richer insights"}
            </div>

            {/* Form */}
            <form className="de-form" onSubmit={handleSubmit} noValidate>
              <div className={`de-field${error ? " de-field--error" : ""}`}>
                <div className="de-field-label-row">
                  <span className="de-field-num">01</span>
                  <label className="de-field-label" htmlFor="ps">Problem Summary</label>
                  <span className="de-field-req">Required</span>
                </div>
                <textarea
                  id="ps"
                  className="de-textarea"
                  placeholder="e.g. 3 API endpoints are returning 500 errors under load, blocking Friday's release and affecting 2 downstream teams."
                  value={problemSummary}
                  onChange={(e) => { setProblemSummary(e.target.value); if (error) setError(""); }}
                  rows={4}
                  disabled={loading}
                />
                {error && (
                  <p className="de-error-msg"><AlertCircle size={12} /> {error}</p>
                )}
              </div>

              <div className="de-field">
                <div className="de-field-label-row">
                  <span className="de-field-num de-field-num--opt">02</span>
                  <label className="de-field-label de-field-label--opt" htmlFor="ctx">Additional Context</label>
                  <span className="de-field-opt">Optional</span>
                </div>
                <textarea
                  id="ctx"
                  className="de-textarea de-textarea--opt"
                  placeholder="e.g. New auth service deployed Tuesday. Backend team at 80% capacity. Launch in 4 days."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={3}
                  disabled={loading}
                />
              </div>

              <button type="submit" className="de-cta" disabled={loading}>
                {loading ? (
                  <><span className="de-spinner" /> Analyzing feedback &amp; generating insight...</>
                ) : (
                  <><Zap size={16} /> Generate Insight</>
                )}
              </button>
            </form>
          </>
        ) : (
          /* ── Decision Result ── */
          <div className="de-result">

            {/* Result header */}
            <div className="de-result-header">
              <div className="de-result-icon"><Zap size={20} /></div>
              <div>
                <h2 className="de-result-title">{decision.decisionTitle}</h2>
                <p className="de-result-sub">Generated from {feedbackCtx?.total || 0} feedback entries</p>
              </div>
              <div className="de-result-badges">
                {decision.confidence && (
                  <span className="de-badge" style={{ color: CONFIDENCE_COLOR[decision.confidence], borderColor: `${CONFIDENCE_COLOR[decision.confidence]}33`, background: `${CONFIDENCE_COLOR[decision.confidence]}11` }}>
                    Confidence: {decision.confidence}
                  </span>
                )}
                {decision.priorityLevel && (
                  <span className="de-badge" style={{ color: PRIORITY_COLOR[decision.priorityLevel], borderColor: `${PRIORITY_COLOR[decision.priorityLevel]}33`, background: `${PRIORITY_COLOR[decision.priorityLevel]}11` }}>
                    {decision.priorityLevel?.replace("_", " ")}
                  </span>
                )}
              </div>
            </div>

            {/* Summary */}
            {decision.summary && (
              <div className="de-result-summary">
                <p>{decision.summary}</p>
              </div>
            )}

            {/* Key metrics row */}
            <div className="de-metrics">
              <div className="de-metric">
                <ShieldAlert size={16} style={{ color: IMPACT_COLOR[decision.impact] }} />
                <span className="de-metric-label">Impact</span>
                <span className="de-metric-val" style={{ color: IMPACT_COLOR[decision.impact] }}>{decision.impact}</span>
              </div>
              <div className="de-metric">
                <Clock size={16} />
                <span className="de-metric-label">Timeline</span>
                <span className="de-metric-val">{decision.recommendedActions?.[0]?.timeline || "This sprint"}</span>
              </div>
              <div className="de-metric">
                <Users size={16} />
                <span className="de-metric-label">Teams</span>
                <span className="de-metric-val">{(decision.affectedTeams || []).length}</span>
              </div>
              <div className="de-metric">
                <TrendingUp size={16} />
                <span className="de-metric-label">Priority</span>
                <span className="de-metric-val" style={{ color: PRIORITY_COLOR[decision.priorityLevel] }}>
                  {decision.priorityLevel?.replace("_", " ")}
                </span>
              </div>
            </div>

            {/* Root cause */}
            {decision.rootCause && (
              <div className="de-block">
                <div className="de-block-label">
                  <AlertTriangle size={13} /> Root Cause
                </div>
                <p className="de-block-text">{decision.rootCause}</p>
              </div>
            )}

            {/* Recommended actions */}
            {(decision.recommendedActions || []).length > 0 && (
              <div className="de-block">
                <div className="de-block-label">
                  <CheckCircle2 size={13} /> Recommended Actions
                </div>
                <div className="de-actions-list">
                  {decision.recommendedActions.map((a, i) => (
                    <div key={i} className="de-action-item">
                      <span className="de-action-num">{String(i + 1).padStart(2, "0")}</span>
                      <div className="de-action-body">
                        <p className="de-action-text">{a.action}</p>
                        <div className="de-action-meta">
                          {a.owner && <span className="de-action-tag">{a.owner}</span>}
                          {a.timeline && <span className="de-action-tag de-action-tag--time"><Clock size={10} />{a.timeline}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Affected teams */}
            {(decision.affectedTeams || []).length > 0 && (
              <div className="de-block">
                <div className="de-block-label"><Users size={13} /> Affected Teams</div>
                <div className="de-tags">
                  {decision.affectedTeams.map((t) => (
                    <span key={t} className="de-team-tag">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback signals */}
            {(decision.feedbackSignals || []).length > 0 && (
              <div className="de-block">
                <div className="de-block-label"><Database size={13} /> Feedback Signals Used</div>
                <div className="de-signals">
                  {decision.feedbackSignals.map((s, i) => (
                    <p key={i} className="de-signal">&ldquo;{s}&rdquo;</p>
                  ))}
                </div>
              </div>
            )}

            {/* Risk if ignored */}
            {decision.riskIfIgnored && (
              <div className="de-block de-block--risk">
                <div className="de-block-label"><Minus size={13} /> Risk if Ignored</div>
                <p className="de-block-text">{decision.riskIfIgnored}</p>
              </div>
            )}

            <button className="de-restart" onClick={handleReset}>
              <RotateCcw size={14} /> Analyze Another Problem
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
