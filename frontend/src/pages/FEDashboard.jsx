import { useState, useMemo } from "react";
import { Monitor, Layers, Zap, MessageSquare } from "lucide-react";
import Toast from "../components/Toast";
import DashboardLoader from "../components/DashboardLoader";
import DashboardNav from "../components/DashboardNav";
import { getRoleDisplay } from "../utils/roleDisplay";
import { usePageLoader } from "../utils/usePageLoader";
import { useFeedback } from "../hooks/useFeedback";
import "../styles/Dashboard.css";

const UI_TERMS = ["ui", "design", "button", "screen", "mobile", "responsive", "layout", "style", "css", "component"];
const PERF_TERMS = ["slow", "loading", "performance", "lag", "render", "freeze", "animation"];

const matches = (f, terms) => terms.some((t) => f.message.toLowerCase().includes(t));

export default function FEDashboard() {
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

  const { uiFeedback, perfFeedback, negativeFeedback } = useMemo(() => ({
    uiFeedback: feedback.filter((f) => matches(f, UI_TERMS)),
    perfFeedback: feedback.filter((f) => matches(f, PERF_TERMS)),
    negativeFeedback: feedback.filter((f) => f.sentiment === "NEGATIVE"),
  }), [feedback]);

  const renderCard = (f) => (
    <div key={f._id} className="issue-card">
      <div className="issue-header">
        <span className={`sentiment-badge ${f.sentiment?.toLowerCase()}`}>{f.sentiment}</span>
        <span className="issue-date">{new Date(f.createdAt).toLocaleString()}</span>
      </div>
      <p className="issue-message">{f.message}</p>
      <div className="issue-footer">
        <span className="issue-reporter">From {getRoleDisplay(f.role)}</span>
      </div>
    </div>
  );

  if (showLoader) return <DashboardLoader />;

  return (
    <div className="dashboard">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <DashboardNav roleLabel="Frontend Engineer" roleClass="fe" RoleIcon={Monitor} />

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>Frontend Dashboard</h2>
          <p>UI/UX feedback, performance issues, and component health</p>
        </div>

        {error && <div className="empty-state"><p>{error}</p></div>}

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
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
