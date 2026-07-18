import { useState, useMemo } from "react";
import { Server, Database, AlertTriangle, Activity } from "lucide-react";
import Toast from "../components/Toast";
import DashboardLoader from "../components/DashboardLoader";
import DashboardNav from "../components/DashboardNav";
import { getRoleDisplay } from "../utils/roleDisplay";
import { usePageLoader } from "../utils/usePageLoader";
import { useFeedback } from "../hooks/useFeedback";
import "../styles/Dashboard.css";

const API_TERMS = ["api", "endpoint", "server", "backend", "route", "request", "response"];
const DB_TERMS = ["database", "db", "query", "mongo", "collection", "write", "read", "storage"];
const ERR_TERMS = ["error", "500", "crash", "exception", "fail", "timeout"];

const matches = (f, terms) => terms.some((t) => f.message.toLowerCase().includes(t));

export default function BEDashboard() {
  const { feedback, loading, error, submitFeedback } = useFeedback();
  const showLoader = usePageLoader(!loading);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;
    setSubmitting(true);
    try {
      await submitFeedback(text);
      setMessage("");
      setToast({ type: "success", message: "Feedback submitted successfully." });
    } catch {
      setToast({ type: "error", message: "Couldn't submit your feedback. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const { apiFeedback, dbFeedback, errFeedback } = useMemo(() => ({
    apiFeedback: feedback.filter((f) => matches(f, API_TERMS)),
    dbFeedback: feedback.filter((f) => matches(f, DB_TERMS)),
    errFeedback: feedback.filter((f) => matches(f, ERR_TERMS)),
  }), [feedback]);

  const renderList = (items) => items.map((f) => (
    <div key={f._id} className="issue-card">
      <div className="issue-header">
        <span className={`sentiment-badge ${f.sentiment?.toLowerCase()}`}>{f.sentiment}</span>
        <span className="issue-date">{new Date(f.createdAt).toLocaleString()}</span>
      </div>
      <p className="issue-message">{f.message}</p>
      <div className="issue-footer"><span className="issue-reporter">Reported by {getRoleDisplay(f.role)}</span></div>
    </div>
  ));

  if (showLoader) return <DashboardLoader />;

  return (
    <div className="dashboard">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <DashboardNav roleLabel="Backend Engineer" roleClass="be" RoleIcon={Server} />

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>Backend Dashboard</h2>
          <p>API health, database issues, and server error monitoring</p>
        </div>

        {error && <div className="empty-state"><p>{error}</p></div>}

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
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
