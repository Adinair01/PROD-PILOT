import { useEffect, useState } from "react";
import { api } from "../api/axios";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/insights");
      console.log("Insights data:", res.data);
      setData(res.data);
    } catch (error) {
      console.error("Failed to fetch insights:", error);
      setError(error.response?.data?.error || "Failed to load dashboard");
      if (error.response?.status === 401) {
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    try {
      await api.post("/feedback", { message });
      setMessage("");
      alert("✅ Feedback submitted successfully!");
      fetchData();
    } catch (error) {
      alert("Failed to submit feedback: " + (error.response?.data?.error || error.message));
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading insights...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>⚠️ Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/")}>Back to Login</button>
      </div>
    );
  }

  if (!data) return null;

  // Prepare sentiment data
  const sentimentData = [
    { name: "Positive", value: data.sentimentStats.POSITIVE || 0 },
    { name: "Neutral", value: data.sentimentStats.NEUTRAL || 0 },
    { name: "Negative", value: data.sentimentStats.NEGATIVE || 0 },
  ].filter((item) => item.value > 0);

  // Prepare role data
  const roleData =
    data.roleBreakdown?.map((r) => ({
      name: r._id,
      value: r.count,
    })) || [];

  const SENTIMENT_COLORS = ["#22C55E", "#F59E0B", "#EF4444"];
  const ROLE_COLORS = ["#6366F1", "#8B5CF6", "#EC4899"];

  const getHealthScoreClass = (score) => {
    if (score > 70) return "health-good";
    if (score >= 40) return "health-medium";
    return "health-bad";
  };

  const hasData = data.sentimentStats.total > 0;

  return (
    <div className="dashboard">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-left">
          <h1 className="logo">PROD PILOT</h1>
        </div>
        <div className="nav-right">
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Row 1: Key Metrics */}
        <div className="metrics-grid">
          <div
            className={`metric-card ${getHealthScoreClass(data.healthScore)}`}
          >
            <div className="metric-label">Health Score</div>
            <div className="metric-value">{data.healthScore}</div>
            <div className="metric-glow"></div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Risk Level</div>
            <div className="metric-value risk-value">{data.riskLevel}</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Most Impacted Role</div>
            <div className="metric-value role-value">
              {data.impactedRole || "N/A"}
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-label">Total Feedback:</span>
            <span className="stat-value">{data.sentimentStats.total}</span>
          </div>
          <div className="stat-item positive">
            <span className="stat-label">Positive:</span>
            <span className="stat-value">{data.sentimentStats.POSITIVE}</span>
          </div>
          <div className="stat-item neutral">
            <span className="stat-label">Neutral:</span>
            <span className="stat-value">{data.sentimentStats.NEUTRAL}</span>
          </div>
          <div className="stat-item negative">
            <span className="stat-label">Negative:</span>
            <span className="stat-value">{data.sentimentStats.NEGATIVE}</span>
          </div>
        </div>

        {/* Row 2: Charts */}
        {hasData ? (
          <div className="charts-grid">
            {sentimentData.length > 0 && (
              <div className="chart-card">
                <h3>📊 Sentiment Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={SENTIMENT_COLORS[index]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {roleData.length > 0 && (
              <div className="chart-card">
                <h3>👥 Role Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={roleData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      {roleData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={ROLE_COLORS[index % ROLE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No Data Yet</h3>
            <p>Submit your first feedback below to see analytics and insights!</p>
          </div>
        )}

        {/* Row 3: Priority List */}
        {data.topPriority && data.topPriority.length > 0 && (
          <div className="priority-section">
            <h3>🔥 Top Priority Issues</h3>
            <div className="priority-list">
              {data.topPriority.map((f) => (
                <div key={f._id} className="priority-item">
                  <div className="priority-content">
                    <span className="priority-score">{f.priorityScore}</span>
                    <p className="priority-message">{f.message}</p>
                  </div>
                  <span
                    className={`sentiment-badge ${f.sentiment?.toLowerCase()}`}
                  >
                    {f.sentiment}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Form */}
        <div className="feedback-section">
          <h3>💬 Submit Feedback</h3>
          <p className="feedback-hint">
            Share your thoughts, report bugs, or suggest improvements. Our AI
            will analyze the sentiment automatically.
          </p>
          <form onSubmit={handleSubmitFeedback} className="feedback-form">
            <textarea
              placeholder="Example: 'The login screen is stuck and loading forever. This is blocking my work!' or 'Great new feature! Love the analytics dashboard.'"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            <button type="submit" className="submit-btn">
              Submit Feedback
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
