import { useState, useMemo } from "react";
import { Bug, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import Toast from "../components/Toast";
import DashboardLoader from "../components/DashboardLoader";
import DashboardNav from "../components/DashboardNav";
import { getRoleDisplay } from "../utils/roleDisplay";
import { usePageLoader } from "../utils/usePageLoader";
import { useFeedback } from "../hooks/useFeedback";
import "../styles/Dashboard.css";

const FILTERS = ["ALL", "NEGATIVE", "NEUTRAL", "POSITIVE"];

export default function QADashboard() {
  const { feedback, loading, error, submitFeedback } = useFeedback();
  const showLoader = usePageLoader(!loading);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [toast, setToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;
    setSubmitting(true);
    try {
      await submitFeedback(text);
      setMessage("");
      setToast({ type: "success", message: "Bug report submitted successfully." });
    } catch {
      setToast({ type: "error", message: "Couldn't submit your report. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

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
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <DashboardNav roleLabel="QA Engineer" roleClass="qa" RoleIcon={Bug} />

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>QA Dashboard</h2>
          <p>Bug tracking, issue monitoring, and quality assurance</p>
        </div>

        {error && <div className="empty-state"><p>{error}</p></div>}

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
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Bug Report"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
