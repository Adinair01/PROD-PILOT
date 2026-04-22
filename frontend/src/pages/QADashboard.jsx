import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "../api/axios";
import { useNavigate } from "react-router-dom";
import { Bug, ArrowLeft, LogOut, ShieldCheck, AlertCircle, CheckCircle2, Building2 } from "lucide-react";
import Toast from "../components/Toast";
import DashboardLoader from "../components/DashboardLoader";
import { getRoleDisplay } from "../utils/roleDisplay";
import { usePageLoader } from "../utils/usePageLoader";
import "../styles/Dashboard.css";

const FILTERS = ["ALL", "NEGATIVE", "NEUTRAL", "POSITIVE"];

export default function QADashboard() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const showLoader = usePageLoader(!loading);
  const [filter, setFilter] = useState("ALL");
  const [showToast, setShowToast] = useState(false);
  const [organization, setOrganization] = useState(null);

  useEffect(() => {
    const org = localStorage.getItem("organization");
    if (org) setOrganization(JSON.parse(org));
    fetchFeedback();
  }, []);

  const fetchFeedback = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/feedback");
      setFeedback(res.data);
    } catch (err) {
      if (err.response?.status === 401) navigate("/");
    } finally {
      setLoading(false);
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
      fetchFeedback();
    } catch { /* silent */ }
  }, [message, fetchFeedback]);

  const handleLogout = useCallback(async () => {
    try { await api.post("/auth/logout"); } catch { /* silent */ }
    localStorage.removeItem("organization");
    localStorage.removeItem("user");
    navigate("/");
  }, [navigate]);

  const counts = useMemo(() => ({
    NEGATIVE: feedback.filter((f) => f.sentiment === "NEGATIVE").length,
    NEUTRAL: feedback.filter((f) => f.sentiment === "NEUTRAL").length,
    POSITIVE: feedback.filter((f) => f.sentiment === "POSITIVE").length,
    total: feedback.length,
  }), [feedback]);

  const filtered = useMemo(() =>
    filter === "ALL" ? feedback : feedback.filter((f) => f.sentiment === filter),
    [feedback, filter]
  );

  if (showLoader) return <DashboardLoader />;

  return (
    <div className="dashboard">
      {showToast && <Toast message="Bug report submitted successfully." onClose={() => setShowToast(false)} />}

      <nav className="navbar">
        <div className="nav-left">
          <h1 className="logo">PROD PILOT</h1>
          {organization && <span className="org-badge"><Building2 size={14} />{organization.name}</span>}
          <span className="role-badge qa"><Bug size={14} />QA Engineer</span>
        </div>
        <div className="nav-right">
          <button onClick={() => navigate("/dashboard")} className="back-btn"><ArrowLeft size={16} /><span>Switch Role</span></button>
          <button onClick={handleLogout} className="logout-btn"><LogOut size={16} /><span>Logout</span></button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>QA Dashboard</h2>
          <p>Bug tracking, issue monitoring, and quality assurance</p>
        </div>

        <div className="metrics-grid">
          <div className="metric-card health-bad">
            <div className="metric-icon"><AlertCircle size={22} /></div>
            <div className="metric-label">Bugs Reported</div>
            <div className="metric-value">{counts.NEGATIVE}</div>
          </div>
          <div className="metric-card health-medium">
            <div className="metric-icon"><ShieldCheck size={22} /></div>
            <div className="metric-label">Under Review</div>
            <div className="metric-value">{counts.NEUTRAL}</div>
          </div>
          <div className="metric-card health-good">
            <div className="metric-icon"><CheckCircle2 size={22} /></div>
            <div className="metric-label">Positive Reports</div>
            <div className="metric-value">{counts.POSITIVE}</div>
          </div>
        </div>

        <div className="filter-section">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-btn ${f.toLowerCase()} ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "ALL" ? `All (${counts.total})` : f === "NEGATIVE" ? `Bugs (${counts.NEGATIVE})` : f === "NEUTRAL" ? `Review (${counts.NEUTRAL})` : `Passed (${counts.POSITIVE})`}
            </button>
          ))}
        </div>

        <div className="issues-section">
          <h3>Issue Tracker</h3>
          {filtered.length > 0 ? (
            <div className="issues-list">
              {filtered.map((f) => (
                <div key={f._id} className="issue-card">
                  <div className="issue-header">
                    <span className={`sentiment-badge ${f.sentiment?.toLowerCase()}`}>{f.sentiment}</span>
                    <span className="issue-date">{new Date(f.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="issue-message">{f.message}</p>
                  <div className="issue-footer">
                    <span className="issue-reporter">Reported by {getRoleDisplay(f.role)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state"><p>No issues match this filter.</p></div>
          )}
        </div>

        <div className="feedback-section">
          <h3>Report a Bug</h3>
          <p className="feedback-hint">Describe the issue, steps to reproduce, and expected vs actual behavior.</p>
          <form onSubmit={handleSubmit} className="feedback-form">
            <textarea
              placeholder="e.g. Login button unresponsive on mobile. Steps: open app → tap login → nothing happens. Expected: navigate to dashboard."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            <button type="submit" className="submit-btn">Submit Bug Report</button>
          </form>
        </div>
      </div>
    </div>
  );
}
