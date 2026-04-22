import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "../api/axios";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";
import { BarChart2, ArrowLeft, LogOut, TrendingUp, Database, Activity, Building2 } from "lucide-react";
import Toast from "../components/Toast";
import DashboardLoader from "../components/DashboardLoader";
import { getRoleDisplay } from "../utils/roleDisplay";
import { usePageLoader } from "../utils/usePageLoader";
import "../styles/Dashboard.css";

const ROLE_COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#F59E0B", "#22C55E"];

export default function DataDashboard() {
  const navigate = useNavigate();
  const [insights, setInsights] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const showLoader = usePageLoader(!loading);
  const [showToast, setShowToast] = useState(false);
  const [organization, setOrganization] = useState(null);

  useEffect(() => {
    const org = localStorage.getItem("organization");
    if (org) setOrganization(JSON.parse(org));
    fetchAll();
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [insRes, fbRes] = await Promise.all([
        api.get("/pm-insights"),
        api.get("/feedback"),
      ]);
      setInsights(insRes.data);
      setFeedback(fbRes.data);
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
      fetchAll();
    } catch { /* silent */ }
  }, [message, fetchAll]);

  const handleLogout = useCallback(async () => {
    try { await api.post("/auth/logout"); } catch { /* silent */ }
    localStorage.removeItem("organization");
    localStorage.removeItem("user");
    navigate("/");
  }, [navigate]);

  const roleData = useMemo(() =>
    (insights?.analytics?.roleBreakdown || []).map((r) => ({ name: getRoleDisplay(r._id), count: r.count })),
    [insights]
  );

  const timelineData = useMemo(() =>
    insights?.analytics?.timelineStats || [],
    [insights]
  );

  const sentimentScore = useMemo(() => {
    if (!insights) return 0;
    const s = insights.analytics.sentimentStats;
    if (s.total === 0) return 0;
    return (((s.POSITIVE - s.NEGATIVE) / s.total) * 100).toFixed(1);
  }, [insights]);

  if (showLoader) return <DashboardLoader />;

  return (
    <div className="dashboard">
      {showToast && <Toast message="Feedback submitted successfully." onClose={() => setShowToast(false)} />}

      <nav className="navbar">
        <div className="nav-left">
          <h1 className="logo">PROD PILOT</h1>
          {organization && <span className="org-badge"><Building2 size={14} />{organization.name}</span>}
          <span className="role-badge data"><BarChart2 size={14} />Data Engineer</span>
        </div>
        <div className="nav-right">
          <button onClick={() => navigate("/dashboard")} className="back-btn"><ArrowLeft size={16} /><span>Switch Role</span></button>
          <button onClick={handleLogout} className="logout-btn"><LogOut size={16} /><span>Logout</span></button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>Data Analytics Dashboard</h2>
          <p>Feedback trends, sentiment analysis, and team distribution metrics</p>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon"><Database size={22} /></div>
            <div className="metric-label">Total Data Points</div>
            <div className="metric-value">{feedback.length}</div>
          </div>
          <div className="metric-card health-good">
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="date" stroke="#64748B" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748B" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: 8 }} />
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#64748B" tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: 8 }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {roleData.map((_, i) => <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />)}
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
            <button type="submit" className="submit-btn">Submit Feedback</button>
          </form>
        </div>
      </div>
    </div>
  );
}
