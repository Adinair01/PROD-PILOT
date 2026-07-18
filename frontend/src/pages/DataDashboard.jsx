import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";
import { BarChart2, TrendingUp, Database, Activity } from "lucide-react";
import Toast from "../components/Toast";
import DashboardLoader from "../components/DashboardLoader";
import DashboardNav from "../components/DashboardNav";
import { getRoleDisplay } from "../utils/roleDisplay";
import { usePageLoader } from "../utils/usePageLoader";
import { useFeedback } from "../hooks/useFeedback";
import { useInsights } from "../hooks/useInsights";
import "../styles/Dashboard.css";

const ROLE_COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#F59E0B", "#22C55E"];

export default function DataDashboard() {
  const { insights, loading: insightsLoading, error: insightsError } = useInsights();
  const { feedback, loading: feedbackLoading, error: feedbackError, submitFeedback } = useFeedback();
  const showLoader = usePageLoader(!insightsLoading && !feedbackLoading);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const error = insightsError || feedbackError;

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

  const roleData = useMemo(() =>
    (insights?.analytics?.roleBreakdown || []).map((r) => ({ name: getRoleDisplay(r._id), count: r.count })),
    [insights]
  );

  const timelineData = useMemo(() => insights?.analytics?.timelineStats || [], [insights]);

  const sentimentScore = useMemo(() => {
    const s = insights?.analytics?.sentimentStats;
    if (!s || s.total === 0) return 0;
    return (((s.POSITIVE - s.NEGATIVE) / s.total) * 100).toFixed(1);
  }, [insights]);

  const sentimentHealthClass = useMemo(() => {
    const score = Number(sentimentScore);
    if (score > 20) return "health-good";
    if (score >= -20) return "health-medium";
    return "health-bad";
  }, [sentimentScore]);

  if (showLoader) return <DashboardLoader />;

  return (
    <div className="dashboard">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <DashboardNav roleLabel="Data Engineer" roleClass="data" RoleIcon={BarChart2} />

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>Data Analytics Dashboard</h2>
          <p>Feedback trends, sentiment analysis, and team distribution metrics</p>
        </div>

        {error && <div className="empty-state"><p>{error}</p></div>}

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon"><Database size={22} /></div>
            <div className="metric-label">Total Data Points</div>
            <div className="metric-value">{feedback.length}</div>
          </div>
          <div className={`metric-card ${sentimentHealthClass}`}>
            <div className="metric-icon"><TrendingUp size={22} /></div>
            <div className="metric-label">Sentiment Score</div>
            <div className="metric-value" style={{ fontSize: "2rem" }}>{sentimentScore}%</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon"><Activity size={22} /></div>
            <div className="metric-label">Active Teams</div>
            <div className="metric-value">{roleData.length}</div>
          </div>
        </div>

        {feedback.length > 0 ? (
          <div className="charts-grid">
            {timelineData.length > 0 && (
              <div className="chart-card chart-card--wide">
                <h3>Feedback Volume — Last 7 Days</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--surface)" />
                    <XAxis dataKey="date" stroke="var(--muted)" tick={{ fontSize: 11 }} />
                    <YAxis stroke="var(--muted)" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "var(--bg)", border: "1px solid var(--surface)", borderRadius: 8 }} />
                    <Legend />
                    <Line type="monotone" dataKey="feedbackCount" stroke="#6366F1" strokeWidth={2} dot={{ r: 4 }} name="Total" />
                    <Line type="monotone" dataKey="negativeCount" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} name="Negative" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {roleData.length > 0 && (
              <div className="chart-card">
                <h3>Feedback by Team</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={roleData} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--surface)" />
                    <XAxis dataKey="name" stroke="var(--muted)" tick={{ fontSize: 12 }} />
                    <YAxis stroke="var(--muted)" tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "var(--bg)", border: "1px solid var(--surface)", borderRadius: 8 }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {roleData.map((entry, i) => <Cell key={entry.name} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="chart-card">
              <h3>Sentiment Breakdown</h3>
              <div className="sentiment-breakdown">
                {[
                  { label: "Positive", value: insights?.analytics?.sentimentStats?.POSITIVE || 0, color: "#22C55E" },
                  { label: "Neutral", value: insights?.analytics?.sentimentStats?.NEUTRAL || 0, color: "#F59E0B" },
                  { label: "Negative", value: insights?.analytics?.sentimentStats?.NEGATIVE || 0, color: "#EF4444" },
                ].map((item) => {
                  const total = insights?.analytics?.sentimentStats?.total || 1;
                  const pct = Math.round((item.value / total) * 100);
                  return (
                    <div key={item.label} className="breakdown-row">
                      <span className="breakdown-label">{item.label}</span>
                      <div className="breakdown-bar-track">
                        <div className="breakdown-bar-fill" style={{ width: `${pct}%`, background: item.color }} />
                      </div>
                      <span className="breakdown-count">{item.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon"><BarChart2 size={52} strokeWidth={1} /></div>
            <h3>No Data Available</h3>
            <p>Waiting for feedback data to generate analytics.</p>
          </div>
        )}

        <div className="feedback-section">
          <h3>Submit Data Feedback</h3>
          <p className="feedback-hint">Report data pipeline issues, analytics anomalies, or ETL failures.</p>
          <form onSubmit={handleSubmit} className="feedback-form">
            <textarea
              placeholder="e.g. ETL pipeline failing on large datasets. Analytics reports showing inconsistent aggregation results after the last deployment."
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
