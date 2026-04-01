import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { api } from "../api/axios";
import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from "recharts";
import {
  BarChart3, MessageSquare, ArrowLeft, LogOut,
  TrendingUp, TrendingDown, Minus, Building2, Brain, FileText,
  Users, Zap, ShieldAlert, AlertOctagon, CheckCircle2, Clock,
} from "lucide-react";
import Toast from "../components/Toast";
import { getRoleDisplay } from "../utils/roleDisplay";
import "../styles/Dashboard.css";
import "../styles/InsightsLoader.css";

const SENTIMENT_COLOR_MAP = { Positive: "#22C55E", Neutral: "#F59E0B", Negative: "#EF4444" };
const ROLE_COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#F59E0B", "#22C55E"];

const SentimentChart = memo(({ data }) => (
  <ResponsiveContainer width="100%" height={260}>
    <PieChart>
      <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} animationDuration={600}>
        {data.map((entry) => <Cell key={entry.name} fill={SENTIMENT_COLOR_MAP[entry.name] || "#94A3B8"} />)}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
));
SentimentChart.displayName = "SentimentChart";

const RoleChart = memo(({ data }) => (
  <ResponsiveContainer width="100%" height={260}>
    <BarChart data={data} barSize={32}>
      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
      <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 12 }} />
      <YAxis stroke="#64748B" tick={{ fontSize: 12 }} allowDecimals={false} />
      <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: 8 }} />
      <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={600}>
        {data.map((entry, i) => <Cell key={entry.name} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />)}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
));
RoleChart.displayName = "RoleChart";

const TimelineChart = memo(({ data }) => (
  <ResponsiveContainer width="100%" height={220}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
      <XAxis dataKey="date" stroke="#64748B" tick={{ fontSize: 11 }} />
      <YAxis stroke="#64748B" tick={{ fontSize: 11 }} allowDecimals={false} />
      <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: 8 }} />
      <Legend />
      <Line type="monotone" dataKey="feedbackCount" stroke="#6366F1" strokeWidth={2} dot={{ r: 4 }} name="Total" />
      <Line type="monotone" dataKey="negativeCount" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} name="Negative" />
    </LineChart>
  </ResponsiveContainer>
));
TimelineChart.displayName = "TimelineChart";

const PRIORITY_COLOR = { IMMEDIATE: "#EF4444", THIS_SPRINT: "#F59E0B", NEXT_SPRINT: "#22C55E" };
const IMPACT_COLOR = { HIGH: "#EF4444", MEDIUM: "#F59E0B", LOW: "#22C55E" };
const HEALTH_COLOR = { CRITICAL: "#EF4444", DEGRADED: "#F59E0B", STABLE: "#22C55E" };

// ─── Insights Loader ─────────────────────────────────────────────────────────
const LOADER_STEPS = [
  "Connecting to feedback pipeline...",
  "Aggregating team signals...",
  "Running sentiment analysis...",
  "Clustering issue patterns...",
  "Scoring product health...",
  "Generating decision intelligence...",
];

const InsightsLoader = memo(() => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % LOADER_STEPS.length), 1400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="il-wrap">
      <div className="il-glow-tl" />
      <div className="il-glow-br" />

      <div className="il-hud">
        {/* Outer ring with tick marks */}
        <div className="il-ring il-ring-outer">
          {[0,45,90,135,180,225,270,315].map((deg) => (
            <div key={deg} className="il-tick" style={{ transform: `rotate(${deg}deg) translateX(138px)` }} />
          ))}
        </div>

        {/* Mid ring with tick marks */}
        <div className="il-ring il-ring-mid">
          {[0,60,120,180,240,300].map((deg) => (
            <div key={deg} className="il-tick" style={{ transform: `rotate(${deg}deg) translateX(108px)`, width: 9 }} />
          ))}
        </div>

        {/* Inner static ring */}
        <div className="il-ring il-ring-inner" />

        {/* Scanning arc */}
        <div className="il-ring il-ring-scan" />

        {/* Data nodes — positioned via trig so they sit on the outer ring */}
        {[
          { deg: 30,  cls: "il-node-0" },
          { deg: 120, cls: "il-node-1" },
          { deg: 210, cls: "il-node-2" },
          { deg: 300, cls: "il-node-3" },
        ].map(({ deg, cls }) => {
          const rad = (deg * Math.PI) / 180;
          const r = 138;
          const x = Math.cos(rad) * r;
          const y = Math.sin(rad) * r;
          return (
            <div
              key={deg}
              className={`il-node ${cls}`}
              style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
            />
          );
        })}

        {/* Center core */}
        <div className="il-core">
          <div className="il-core-glow" />
          <div className="il-core-ring">
            <span className="il-core-label">PP</span>
          </div>
        </div>

        {/* Corner crosshairs */}
        <div className="il-cross il-cross-tl" />
        <div className="il-cross il-cross-tr" />
        <div className="il-cross il-cross-bl" />
        <div className="il-cross il-cross-br" />
      </div>

      {/* Mini metric cards */}
      <div className="il-cards">
        {[
          { icon: <BarChart3 size={14} />, label: "Health" },
          { icon: <MessageSquare size={14} />, label: "Signals" },
          { icon: <Zap size={14} />, label: "Insights" },
        ].map(({ icon, label }) => (
          <div key={label} className="il-card">
            <div className="il-card-icon">{icon}</div>
            <div className="il-card-bar"><div className="il-card-bar-fill" /></div>
            <div className="il-card-text">{label}</div>
          </div>
        ))}
      </div>

      {/* Status */}
      <div className="il-status">
        <div className="il-eyebrow">PROD PILOT &mdash; INTELLIGENCE ENGINE</div>
        <div className="il-step-text">{LOADER_STEPS[step]}</div>
        <div className="il-pills">
          {LOADER_STEPS.map((_, i) => (
            <div key={i} className={`il-pill ${i === step ? "il-pill-active" : "il-pill-inactive"}`} />
          ))}
        </div>
      </div>
    </div>
  );
});
InsightsLoader.displayName = "InsightsLoader";

export default function PMDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [organization, setOrganization] = useState(null);

  useEffect(() => {
    const org = localStorage.getItem("organization");
    if (org) setOrganization(JSON.parse(org));
    fetchData();
  }, []);

  // Auto-poll every 20s so KPIs update when any team submits feedback
  useEffect(() => {
    const interval = setInterval(() => { fetchData(true); }, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get("/pm-insights");
      setData(res.data);
    } catch (err) {
      if (err.response?.status === 401) navigate("/");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [navigate]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    const submitted = message;
    setMessage("");
    setShowToast(true);
    try {
      await api.post("/feedback", { message: submitted });
      fetchData(true);
    } catch { /* silent */ }
  }, [message, fetchData]);

  const handleLogout = useCallback(async () => {
    try { await api.post("/auth/logout"); } catch { /* silent */ }
    localStorage.removeItem("organization");
    localStorage.removeItem("user");
    navigate("/");
  }, [navigate]);

  const { sentimentData, roleData } = useMemo(() => {
    if (!data) return { sentimentData: [], roleData: [] };
    const s = data.sentimentStats || data.analytics?.sentimentStats || {};
    const sentiment = [
      { name: "Positive", value: s.POSITIVE || 0 },
      { name: "Neutral",  value: s.NEUTRAL  || 0 },
      { name: "Negative", value: s.NEGATIVE || 0 },
    ].filter((x) => x.value > 0);
    const role = (data.roleBreakdown || data.analytics?.roleBreakdown || [])
      .map((r) => ({ name: getRoleDisplay(r._id), value: r.count }));
    return { sentimentData: sentiment, roleData: role };
  }, [data]);

  const healthClass = useMemo(() => {
    if (!data) return "";
    if (data.healthScore > 70) return "health-good";
    if (data.healthScore >= 40) return "health-medium";
    return "health-bad";
  }, [data]);

  const riskColor = useMemo(() => {
    if (!data) return "#94A3B8";
    if (data.riskLevel === "High") return "#EF4444";
    if (data.riskLevel === "Moderate") return "#F59E0B";
    return "#22C55E";
  }, [data]);

  if (loading) return <InsightsLoader />;

  if (!data) return null;

  const total = data.totalFeedback ?? data.analytics?.sentimentStats?.total ?? 0;
  const hasData = total > 0;
  const tech = data.technicalSummary || {};
  const biz = data.businessSummary || {};
  const action = data.actionBlock || {};
  const clusters = data.clusters || [];
  const trend = data.trend || data.analytics?.timelineStats || [];
  const teams = data.roleBreakdown || data.analytics?.roleBreakdown || [];

  return (
    <div className="dashboard">
      {showToast && <Toast message="Feedback submitted successfully." onClose={() => setShowToast(false)} />}

      <nav className="navbar">
        <div className="nav-left">
          <h1 className="logo">PROD PILOT</h1>
          {organization && <span className="org-badge"><Building2 size={14} />{organization.name}</span>}
          <span className="role-badge pm"><BarChart3 size={14} />Product Manager</span>
        </div>
        <div className="nav-right">
          <button onClick={() => navigate("/dashboard")} className="back-btn">
            <ArrowLeft size={16} /><span>Switch Role</span>
          </button>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={16} /><span>Logout</span>
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>Product Manager Dashboard</h2>
          <p>Decision intelligence powered by real-time engineering feedback</p>
        </div>

        {/* KPI Row */}
        <div className="metrics-grid">
          <div className={`metric-card ${healthClass}`}>
            <div className="metric-icon">
              {data.healthScore > 70 ? <TrendingUp size={22} /> : data.healthScore >= 40 ? <Minus size={22} /> : <TrendingDown size={22} />}
            </div>
            <div className="metric-label">Health Score</div>
            <div className="metric-value">{data.healthScore}</div>
            <div className="metric-glow" />
          </div>
          <div className="metric-card">
            <div className="metric-icon"><ShieldAlert size={22} style={{ color: riskColor }} /></div>
            <div className="metric-label">Risk Level</div>
            <div className="metric-value risk-value" style={{ color: riskColor }}>{data.riskLevel}</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon"><MessageSquare size={22} /></div>
            <div className="metric-label">Total Feedback</div>
            <div className="metric-value">{total}</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon"><Users size={22} /></div>
            <div className="metric-label">Teams Reporting</div>
            <div className="metric-value">{teams.length}</div>
          </div>
        </div>

        {hasData && (
          <>
            {/* Priority Decision Card */}
            {action.topIssue && (
              <div className="decision-card">
                <div className="decision-card-header">
                  <AlertOctagon size={18} />
                  <span>Priority Decision Block</span>
                  {action.priorityLevel && (
                    <span className="decision-priority-badge" style={{ background: `${PRIORITY_COLOR[action.priorityLevel]}22`, color: PRIORITY_COLOR[action.priorityLevel], border: `1px solid ${PRIORITY_COLOR[action.priorityLevel]}44` }}>
                      {action.priorityLevel?.replace("_", " ")}
                    </span>
                  )}
                </div>
                <div className="decision-grid">
                  <div className="decision-field">
                    <span className="decision-label">Top Issue</span>
                    <span className="decision-value">{action.topIssue}</span>
                  </div>
                  <div className="decision-field">
                    <span className="decision-label">Root Cause</span>
                    <span className="decision-value">{action.rootCause}</span>
                  </div>
                  <div className="decision-field">
                    <span className="decision-label">Affected Teams</span>
                    <span className="decision-value">
                      {(action.affectedTeams || []).length > 0
                        ? action.affectedTeams.join(", ")
                        : "Not identified"}
                    </span>
                  </div>
                  <div className="decision-field">
                    <span className="decision-label">Impact Level</span>
                    <span className="decision-value" style={{ color: IMPACT_COLOR[action.impact] || "#E2E8F0" }}>
                      {action.impact || "Unknown"}
                    </span>
                  </div>
                  <div className="decision-field decision-field--wide">
                    <span className="decision-label">Recommended Fix</span>
                    <span className="decision-value">{action.recommendedAction}</span>
                  </div>
                  <div className="decision-field">
                    <span className="decision-label">ETA Suggestion</span>
                    <span className="decision-value"><Clock size={13} style={{ display: "inline", marginRight: 4 }} />{action.suggestedTimeline}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Technical + Business Summaries */}
            <div className="summaries-grid">
              {/* Technical Summary */}
              <div className="summary-card technical">
                <div className="summary-header">
                  <Brain size={18} />
                  <span>Technical Summary</span>
                  <span className="summary-tag">For Engineers</span>
                </div>
                {tech.systemHealth && (
                  <div className="summary-health-row">
                    <span className="summary-health-label">System Health</span>
                    <span className="summary-health-value" style={{ color: HEALTH_COLOR[tech.systemHealth] || "#E2E8F0" }}>
                      {tech.systemHealth}
                    </span>
                  </div>
                )}
                {tech.rootCause && (
                  <div className="summary-field">
                    <span className="summary-field-label">Root Cause</span>
                    <span className="summary-field-value">{tech.rootCause}</span>
                  </div>
                )}
                {(tech.affectedTeams || []).length > 0 && (
                  <div className="summary-field">
                    <span className="summary-field-label">Affected Teams</span>
                    <span className="summary-field-value">{tech.affectedTeams.join(", ")}</span>
                  </div>
                )}
                {(tech.lines || []).length > 0 && (
                  <ul className="summary-lines">
                    {tech.lines.map((line, i) => <li key={i}>{line}</li>)}
                  </ul>
                )}
                {(tech.topIssues || []).length > 0 && (
                  <div className="solutions-block">
                    <div className="solutions-title">Top Technical Issues</div>
                    {tech.topIssues.map((issue, i) => (
                      <div key={i} className="solution-group">
                        <div className="solution-role" style={{ color: IMPACT_COLOR[issue.severity] || "#A5B4FC" }}>
                          {issue.issue} — {issue.severity}
                        </div>
                        <div className="solution-items-plain">
                          Teams: {(issue.teams || []).join(", ") || "Not specified"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Business Summary */}
              <div className="summary-card nontechnical">
                <div className="summary-header">
                  <FileText size={18} />
                  <span>Business Summary</span>
                  <span className="summary-tag">For Stakeholders</span>
                </div>
                {biz.overallCondition && (
                  <div className="summary-field">
                    <span className="summary-field-label">Overall Condition</span>
                    <span className="summary-field-value">{biz.overallCondition}</span>
                  </div>
                )}
                {biz.teamExperience && (
                  <div className="summary-field">
                    <span className="summary-field-label">Team Experience</span>
                    <span className="summary-field-value">{biz.teamExperience}</span>
                  </div>
                )}
                {biz.productImpact && (
                  <div className="summary-field">
                    <span className="summary-field-label">Product Impact</span>
                    <span className="summary-field-value">{biz.productImpact}</span>
                  </div>
                )}
                {(biz.lines || []).length > 0 && (
                  <ul className="summary-lines">
                    {biz.lines.map((line, i) => <li key={i}>{line}</li>)}
                  </ul>
                )}
              </div>
            </div>

            {/* Feedback Clusters */}
            {clusters.length > 0 && (
              <div className="priority-section">
                <div className="section-header">
                  <Zap size={18} />
                  <h3>Grouped Issue Clusters</h3>
                </div>
                <p className="section-subtitle">Similar feedback grouped by topic across all teams</p>
                <div className="top-issues-grid">
                  {clusters.map((c, i) => (
                    <div key={i} className={`top-issue-card severity-${c.severity.toLowerCase()}`}>
                      <div className="issue-keyword">{c.issue}</div>
                      <div className="cluster-teams">{c.roles.join(", ")}</div>
                      {c.sample && (
                        <div className="cluster-sample">"{c.sample.substring(0, 80)}{c.sample.length > 80 ? "..." : ""}"</div>
                      )}
                      <div className="issue-meta">
                        <span>{c.count} report{c.count > 1 ? "s" : ""}</span>
                        <span className={`severity-badge severity-${c.severity.toLowerCase()}`}>{c.severity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Charts */}
            <div className="charts-grid">
              {sentimentData.length > 0 && (
                <div className="chart-card">
                  <h3>Sentiment Distribution</h3>
                  <SentimentChart data={sentimentData} />
                </div>
              )}
              {roleData.length > 0 && (
                <div className="chart-card">
                  <h3>Feedback by Team</h3>
                  <RoleChart data={roleData} />
                </div>
              )}
              {trend.length > 0 && (
                <div className="chart-card chart-card--wide">
                  <h3>7-Day Feedback Trend</h3>
                  <TimelineChart data={trend} />
                </div>
              )}
            </div>
          </>
        )}

        {!hasData && (
          <div className="empty-state">
            <div className="empty-icon"><BarChart3 size={56} strokeWidth={1} /></div>
            <h3>No Data Yet</h3>
            <p>Waiting for engineering team feedback to generate insights.</p>
          </div>
        )}

        {/* Feedback Form */}
        <div className="feedback-section">
          <h3>Submit Strategic Feedback</h3>
          <p className="feedback-hint">Share product direction insights, feature priorities, or stakeholder concerns.</p>
          <form onSubmit={handleSubmit} className="feedback-form">
            <textarea
              placeholder="e.g. We need to prioritize mobile performance. User churn is increasing on mobile devices."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            <button type="submit" className="submit-btn">Submit Feedback</button>
          </form>
        </div>
      </div>
    </div>
  );
}
