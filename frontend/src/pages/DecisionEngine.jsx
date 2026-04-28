import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Cpu, Zap, AlertCircle, RotateCcw,
  Database, TrendingUp, Users, Clock, ShieldAlert,
  CheckCircle2, AlertTriangle, Minus, Plus, Trash2,
  ChevronRight, History,
} from "lucide-react";
import { api } from "../api/axios";
import "../styles/DecisionEngine.css";

const PRIORITY_COLOR = {
  IMMEDIATE:   "#EF4444",
  THIS_SPRINT: "#F59E0B",
  NEXT_SPRINT: "#22C55E",
};
const IMPACT_COLOR    = { HIGH: "#EF4444", MEDIUM: "#F59E0B", LOW: "#22C55E" };
const CONFIDENCE_COLOR = { HIGH: "#22C55E", MEDIUM: "#F59E0B", LOW: "#EF4444" };

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Decision result view (shared between live result and history view) ────────
function DecisionResult({ decision, feedbackTotal, onReset, resetLabel = "Analyze Another Problem" }) {
  return (
    <div className="de-result">
      <div className="de-result-header">
        <div className="de-result-icon"><Zap size={20} /></div>
        <div className="de-result-header-text">
          <h2 className="de-result-title">{decision.decisionTitle}</h2>
          {feedbackTotal != null && (
            <p className="de-result-sub">Generated from {feedbackTotal} feedback entries</p>
          )}
        </div>
        <div className="de-result-badges">
          {decision.confidence && (
            <span className="de-badge" style={{
              color: CONFIDENCE_COLOR[decision.confidence],
              borderColor: `${CONFIDENCE_COLOR[decision.confidence]}33`,
              background: `${CONFIDENCE_COLOR[decision.confidence]}11`,
            }}>
              Confidence: {decision.confidence}
            </span>
          )}
          {decision.priorityLevel && (
            <span className="de-badge" style={{
              color: PRIORITY_COLOR[decision.priorityLevel],
              borderColor: `${PRIORITY_COLOR[decision.priorityLevel]}33`,
              background: `${PRIORITY_COLOR[decision.priorityLevel]}11`,
            }}>
              {decision.priorityLevel?.replace("_", " ")}
            </span>
          )}
        </div>
      </div>

      {decision.summary && (
        <div className="de-result-summary"><p>{decision.summary}</p></div>
      )}

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

      {decision.rootCause && (
        <div className="de-block">
          <div className="de-block-label"><AlertTriangle size={13} /> Root Cause</div>
          <p className="de-block-text">{decision.rootCause}</p>
        </div>
      )}

      {(decision.recommendedActions || []).length > 0 && (
        <div className="de-block">
          <div className="de-block-label"><CheckCircle2 size={13} /> Recommended Actions</div>
          <div className="de-actions-list">
            {decision.recommendedActions.map((a, i) => (
              <div key={i} className="de-action-item">
                <span className="de-action-num">{String(i + 1).padStart(2, "0")}</span>
                <div className="de-action-body">
                  <p className="de-action-text">{a.action}</p>
                  <div className="de-action-meta">
                    {a.owner    && <span className="de-action-tag">{a.owner}</span>}
                    {a.timeline && <span className="de-action-tag de-action-tag--time"><Clock size={10} />{a.timeline}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {(decision.edgeCases || []).length > 0 && (
        <div className="de-block de-block--edge">
          <div className="de-block-label"><AlertTriangle size={13} /> Edge Cases to Watch</div>
          <div className="de-edge-list">
            {decision.edgeCases.map((ec, i) => (
              <div key={i} className="de-edge-item">
                <div className="de-edge-scenario">{ec.scenario}</div>
                <p className="de-edge-desc">{ec.description}</p>
                {ec.mitigation && (
                  <p className="de-edge-mitigation">
                    <span className="de-edge-mit-label">Mitigation:</span> {ec.mitigation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {decision.riskIfIgnored && (
        <div className="de-block de-block--risk">
          <div className="de-block-label"><Minus size={13} /> Risk if Ignored</div>
          <p className="de-block-text">{decision.riskIfIgnored}</p>
        </div>
      )}

      <button className="de-restart" onClick={onReset}>
        <RotateCcw size={14} /> {resetLabel}
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DecisionEngine() {
  const navigate = useNavigate();

  const [problemSummary, setProblemSummary] = useState("");
  const [context, setContext]               = useState("");
  const [error, setError]                   = useState("");
  const [loading, setLoading]               = useState(false);
  const [decision, setDecision]             = useState(null);

  const [feedbackCtx, setFeedbackCtx]       = useState(null);
  const [ctxLoading, setCtxLoading]         = useState(true);

  // History sidebar
  const [history, setHistory]               = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [activeHistoryId, setActiveHistoryId] = useState(null);
  const [historyDecision, setHistoryDecision] = useState(null);
  const [historyEntry, setHistoryEntry]     = useState(null);
  const [sidebarOpen, setSidebarOpen]       = useState(true);

  // Load feedback context + history on mount
  useEffect(() => {
    const loadCtx = async () => {
      try {
        const res = await api.get("/decision-engine/context");
        setFeedbackCtx(res.data);
      } catch {
        setFeedbackCtx({ hasData: false, total: 0 });
      } finally {
        setCtxLoading(false);
      }
    };

    const loadHistory = async () => {
      try {
        const res = await api.get("/decision-engine/history");
        setHistory(res.data);
      } catch {
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadCtx();
    loadHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!problemSummary.trim()) {
      setError("Tell us what the problem is first.");
      return;
    }
    setError("");
    setLoading(true);
    setActiveHistoryId(null);
    setHistoryDecision(null);
    setHistoryEntry(null);
    try {
      const res = await api.post("/decision-engine/analyze", {
        problemSummary: problemSummary.trim(),
        context: context.trim(),
      });
      setDecision(res.data.decision);
      // Refresh history list
      const hRes = await api.get("/decision-engine/history");
      setHistory(hRes.data);
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
    setActiveHistoryId(null);
    setHistoryDecision(null);
    setHistoryEntry(null);
  };

  const handleHistoryClick = useCallback(async (id) => {
    if (activeHistoryId === id) return;
    setActiveHistoryId(id);
    setDecision(null);
    setHistoryDecision(null);
    setHistoryEntry(null);
    try {
      const res = await api.get(`/decision-engine/history/${id}`);
      setHistoryDecision(res.data.decision);
      setHistoryEntry(res.data);
    } catch {
      /* silent */
    }
  }, [activeHistoryId]);

  const handleDeleteHistory = useCallback(async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/decision-engine/history/${id}`);
      setHistory((prev) => prev.filter((h) => h._id !== id));
      if (activeHistoryId === id) {
        setActiveHistoryId(null);
        setHistoryDecision(null);
        setHistoryEntry(null);
      }
    } catch {
      /* silent */
    }
  }, [activeHistoryId]);

  const showingResult   = !!decision;
  const showingHistory  = !!historyDecision;
  const showingForm     = !showingResult && !showingHistory;

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
        <span className="de-nav-chip"><Cpu size={12} /> Decision Engine</span>
      </nav>

      {/* Body: sidebar + main */}
      <div className="de-body">

        {/* ── Sidebar ── */}
        <aside className={`de-sidebar${sidebarOpen ? "" : " de-sidebar--collapsed"}`}>
          <div className="de-sidebar-header">
            <div className="de-sidebar-title">
              <History size={14} />
              {sidebarOpen && <span>History</span>}
            </div>
            <div className="de-sidebar-actions">
              {sidebarOpen && (
                <button
                  className="de-sidebar-new"
                  onClick={handleReset}
                  title="New analysis"
                >
                  <Plus size={14} />
                </button>
              )}
              <button
                className="de-sidebar-toggle"
                onClick={() => setSidebarOpen((v) => !v)}
                title={sidebarOpen ? "Collapse" : "Expand"}
              >
                <ChevronRight size={14} style={{ transform: sidebarOpen ? "rotate(180deg)" : "none", transition: "transform .25s" }} />
              </button>
            </div>
          </div>

          {sidebarOpen && (
            <div className="de-sidebar-list">
              {historyLoading ? (
                <div className="de-sidebar-empty">Loading...</div>
              ) : history.length === 0 ? (
                <div className="de-sidebar-empty">
                  No analyses yet.<br />Generate your first insight.
                </div>
              ) : (
                history.map((h) => {
                  const priority = h.decision?.priorityLevel;
                  const isActive = activeHistoryId === h._id;
                  return (
                    <div
                      key={h._id}
                      className={`de-sidebar-item${isActive ? " de-sidebar-item--active" : ""}`}
                      onClick={() => handleHistoryClick(h._id)}
                    >
                      <div className="de-sidebar-item-top">
                        {priority && (
                          <span
                            className="de-sidebar-dot"
                            style={{ background: PRIORITY_COLOR[priority] || "#64748B" }}
                          />
                        )}
                        <span className="de-sidebar-time">{timeAgo(h.createdAt)}</span>
                        <button
                          className="de-sidebar-delete"
                          onClick={(e) => handleDeleteHistory(e, h._id)}
                          title="Delete"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                      <p className="de-sidebar-problem">
                        {h.problemSummary.length > 72
                          ? h.problemSummary.substring(0, 72) + "..."
                          : h.problemSummary}
                      </p>
                      {h.decision?.decisionTitle && (
                        <p className="de-sidebar-dtitle">{h.decision.decisionTitle}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </aside>

        {/* ── Main content ── */}
        <main className="de-main">
          {showingForm && (
            <>
              <div className="de-hero">
                <div className="de-hero-icon"><Cpu size={26} strokeWidth={1.5} /></div>
                <h1 className="de-hero-title">What problem needs solving?</h1>
                <p className="de-hero-sub">
                  Describe it. The engine analyzes it against your team&apos;s live feedback and generates a prioritized action plan.
                </p>
              </div>

              <div className={`de-ctx-bar ${feedbackCtx?.hasData ? "de-ctx-bar--loaded" : "de-ctx-bar--empty"}`}>
                <Database size={13} />
                {ctxLoading
                  ? "Loading feedback context..."
                  : feedbackCtx?.hasData
                    ? `${feedbackCtx.total} feedback entries loaded — ${feedbackCtx.negPct}% negative signals`
                    : "No feedback data yet — submit feedback first for richer insights"}
              </div>

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
                  {error && <p className="de-error-msg"><AlertCircle size={12} /> {error}</p>}
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
                  {loading
                    ? <><span className="de-spinner" /> Analyzing feedback &amp; generating insight...</>
                    : <><Zap size={16} /> Generate Insight</>}
                </button>
              </form>
            </>
          )}

          {showingResult && (
            <DecisionResult
              decision={decision}
              feedbackTotal={feedbackCtx?.total}
              onReset={handleReset}
            />
          )}

          {showingHistory && historyEntry && (
            <>
              <div className="de-history-banner">
                <History size={13} />
                <span>Viewing past analysis from {new Date(historyEntry.createdAt).toLocaleString()}</span>
                <button className="de-history-new" onClick={handleReset}>
                  <Plus size={12} /> New Analysis
                </button>
              </div>
              {historyEntry.problemSummary && (
                <div className="de-history-problem">
                  <span className="de-history-problem-label">Problem</span>
                  <p>{historyEntry.problemSummary}</p>
                </div>
              )}
              <DecisionResult
                decision={historyDecision}
                feedbackTotal={null}
                onReset={handleReset}
                resetLabel="New Analysis"
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
