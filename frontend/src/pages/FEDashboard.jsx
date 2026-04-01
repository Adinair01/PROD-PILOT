import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "../api/axios";
import { useNavigate } from "react-router-dom";
import { Monitor, ArrowLeft, LogOut, Layers, Zap, MessageSquare, Building2 } from "lucide-react";
import Toast from "../components/Toast";
import { getRoleDisplay } from "../utils/roleDisplay";
import "../styles/Dashboard.css";

const UI_TERMS = ["ui", "design", "button", "screen", "mobile", "responsive", "layout", "style", "css", "component"];
const PERF_TERMS = ["slow", "loading", "performance", "lag", "render", "freeze", "animation"];

export default function FEDashboard() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
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
    } catch (_) {}
  }, [message, fetchFeedback]);

  const handleLogout = useCallback(async () => {
    try { await api.post("/auth/logout"); } catch (_) { /* silent */ }
    localStorage.removeItem("organization");
    localStorage.removeItem("user");
    navigate("/");
  }, [navigate]);

  const { uiFeedback, perfFeedback, negativeFeedback } = useMemo(() => ({
    uiFeedback: feedback.filter((f) => UI_TERMS.some((t) => f.message.toLowerCase().includes(t))),
    perfFeedback: feedback.filter((f) => PERF_TERMS.some((t) => f.message.toLowerCase().includes(t))),
    negativeFeedback: feedback.filter((f) => f.sentiment === "NEGATIVE"),
  }), [feedback]);

  const renderCard = (f) => (
    <div key={f._id} className="issue-card">
      <div className="issue-header">
        <span className={`sentiment-badge ${f.sentiment?.toLowerCase()}`}>{f.sentiment}</span>
        <span className="issue-date">{new Date(f.createdAt).toLocaleString()}</span>
      </div>
        <span className="issue-reporter">From {getRoleDisplay(f.role)}</span>
      <div className="issue-footer">
        <span className="issue-reporter">From {f.role}</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading Frontend Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {showToast && (
        <Toast message="Feedback submitted successfully." onClose={() => setShowToast(false)} />
      )}

      <nav className="navbar">
        <div className="nav-left">
          <h1 className="logo">PROD PILOT</h1>
          {organization && (
            <span className="org-badge">
              <Building2 size={14} />
              {organization.name}
            </span>
          )}
          <span className="role-badge fe">
            <Monitor size={14} />
            Frontend Engineer
          </span>
        </div>
        <div className="nav-right">
          <button onClick={() => navigate("/dashboard")} className="back-btn">
            <ArrowLeft size={16} />
            <span>Switch Role</span>
          </button>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>Frontend Dashboard</h2>
          <p>UI/UX feedback, performance issues, and component health</p>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon"><Layers size={22} /></div>
            <div className="metric-label">UI/UX Reports</div>
            <div className="metric-value">{uiFeedback.length}</div>
          </div>
          <div className="metric-card health-medium">
            <div className="metric-icon"><Zap size={22} /></div>
            <div className="metric-label">Performance Issues</div>
            <div className="metric-value">{perfFeedback.length}</div>
          </div>
          <div className="metric-card health-bad">
            <div className="metric-icon"><MessageSquare size={22} /></div>
            <div className="metric-label">Negative Feedback</div>
            <div className="metric-value">{negativeFeedback.length}</div>
          </div>
        </div>

        {feedback.length > 0 ? (
          <>
            {uiFeedback.length > 0 && (
              <div className="issues-section">
                <h3>UI / UX Reports</h3>
                <div className="issues-list">{uiFeedback.map(renderCard)}</div>
              </div>
            )}
            {perfFeedback.length > 0 && (
              <div className="issues-section">
                <h3>Performance Issues</h3>
                <div className="issues-list">{perfFeedback.map(renderCard)}</div>
              </div>
            )}
            {uiFeedback.length === 0 && perfFeedback.length === 0 && (
              <div className="issues-section">
                <h3>All Feedback</h3>
                <div className="issues-list">{feedback.map(renderCard)}</div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon"><Monitor size={52} strokeWidth={1} /></div>
            <h3>No Feedback Yet</h3>
            <p>Submit your first frontend report below.</p>
          </div>
        )}

        <div className="feedback-section">
          <h3>Submit Frontend Feedback</h3>
          <p className="feedback-hint">
            Report UI bugs, design inconsistencies, or performance regressions.
          </p>
          <form onSubmit={handleSubmit} className="feedback-form">
            <textarea
              placeholder="e.g. The mobile navigation menu overlaps content on screens below 375px. Reproducible on Safari iOS 16."
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
