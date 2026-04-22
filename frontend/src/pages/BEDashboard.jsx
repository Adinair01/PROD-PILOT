import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "../api/axios";
import { useNavigate } from "react-router-dom";
import { Server, ArrowLeft, LogOut, Database, AlertTriangle, Activity, Building2 } from "lucide-react";
import Toast from "../components/Toast";
import DashboardLoader from "../components/DashboardLoader";
import { getRoleDisplay } from "../utils/roleDisplay";
import { usePageLoader } from "../utils/usePageLoader";
import "../styles/Dashboard.css";

export default function BEDashboard() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const showLoader = usePageLoader(!loading);
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

  const apiTerms = ["api", "endpoint", "server", "backend", "route", "request", "response"];
  const dbTerms = ["database", "db", "query", "mongo", "collection", "write", "read", "storage"];
  const errTerms = ["error", "500", "crash", "exception", "fail", "timeout"];

  const { apiFeedback, dbFeedback, errFeedback } = useMemo(() => ({
    apiFeedback: feedback.filter((f) => apiTerms.some((t) => f.message.toLowerCase().includes(t))),
    dbFeedback: feedback.filter((f) => dbTerms.some((t) => f.message.toLowerCase().includes(t))),
    errFeedback: feedback.filter((f) => errTerms.some((t) => f.message.toLowerCase().includes(t))),
  }), [feedback]);

  if (showLoader) return <DashboardLoader />;

  const renderList = (items) => items.map((f) => (
    <div key={f._id} className="issue-card">
      <div className="issue-header">
        <span className={`sentiment-badge ${f.sentiment?.toLowerCase()}`}>{f.sentiment}</span>
        <span className="issue-date">{new Date(f.createdAt).toLocaleString()}</span>
      </div>
      <p className="issue-message">{f.message}</p>
      <div className="issue-footer"><span className="issue-reporter">From {getRoleDisplay(f.role)}</span></div>
    </div>
  ));

  return (
    <div className="dashboard">
      {showToast && <Toast message="Feedback submitted successfully." onClose={() => setShowToast(false)} />}

      <nav className="navbar">
        <div className="nav-left">
          <h1 className="logo">PROD PILOT</h1>
          {organization && <span className="org-badge"><Building2 size={14} />{organization.name}</span>}
          <span className="role-badge be"><Server size={14} />Backend Engineer</span>
        </div>
        <div className="nav-right">
          <button onClick={() => navigate("/dashboard")} className="back-btn"><ArrowLeft size={16} /><span>Switch Role</span></button>
          <button onClick={handleLogout} className="logout-btn"><LogOut size={16} /><span>Logout</span></button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>Backend Dashboard</h2>
          <p>API health, database issues, and server error monitoring</p>
        </div>

        <div className="metrics-grid">
          <div className="metric-card health-bad">
            <div className="metric-icon"><Activity size={22} /></div>
            <div className="metric-label">API Issues</div>
            <div className="metric-value">{apiFeedback.length}</div>
          </div>
          <div className="metric-card health-medium">
            <div className="metric-icon"><Database size={22} /></div>
            <div className="metric-label">DB Issues</div>
            <div className="metric-value">{dbFeedback.length}</div>
          </div>
          <div className="metric-card health-bad">
            <div className="metric-icon"><AlertTriangle size={22} /></div>
            <div className="metric-label">Server Errors</div>
            <div className="metric-value">{errFeedback.length}</div>
          </div>
        </div>

        {feedback.length > 0 ? (
          <>
            {apiFeedback.length > 0 && (
              <div className="issues-section">
                <h3>API & Endpoint Issues</h3>
                <div className="issues-list">{renderList(apiFeedback)}</div>
              </div>
            )}
            {dbFeedback.length > 0 && (
              <div className="issues-section">
                <h3>Database Issues</h3>
                <div className="issues-list">{renderList(dbFeedback)}</div>
              </div>
            )}
            {errFeedback.length > 0 && (
              <div className="issues-section">
                <h3>Server Errors</h3>
                <div className="issues-list">{renderList(errFeedback)}</div>
              </div>
            )}
            {apiFeedback.length === 0 && dbFeedback.length === 0 && errFeedback.length === 0 && (
              <div className="issues-section">
                <h3>All Feedback</h3>
                <div className="issues-list">{renderList(feedback)}</div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon"><Server size={52} strokeWidth={1} /></div>
            <h3>No Feedback Yet</h3>
            <p>Submit your first backend report below.</p>
          </div>
        )}

        <div className="feedback-section">
          <h3>Submit Backend Feedback</h3>
          <p className="feedback-hint">Report API errors, database failures, or server performance issues.</p>
          <form onSubmit={handleSubmit} className="feedback-form">
            <textarea
              placeholder="e.g. POST /api/users returns 500 on large payloads. MongoDB write timeout observed under load. Needs query optimization."
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
