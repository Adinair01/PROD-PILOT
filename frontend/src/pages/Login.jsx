import { useState } from "react";
import { api } from "../api/axios";
import { useNavigate } from "react-router-dom";
import { Target, BarChart2, Zap } from "lucide-react";
import "../styles/Auth.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/auth/login", { email, password });

      if (response.data.data.organization) {
        localStorage.setItem("organization", JSON.stringify(response.data.data.organization));
      }
      if (response.data.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.data.user));
      }

      navigate("/hub");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left Side — Branding */}
      <div className="auth-branding">
        <div className="brand-content">
          <h1 className="brand-logo">PROD PILOT</h1>
          <h2 className="brand-tagline">Transform Feedback Into Product Excellence</h2>
          <p className="brand-description">
            The intelligent platform that turns engineering feedback into actionable
            insights, helping product teams build what users truly need.
          </p>

          <div className="brand-features">
            <div className="feature-item">
              <div className="feature-icon">
                <Target size={20} color="#fff" strokeWidth={2} />
              </div>
              <div className="feature-text">
                AI-powered sentiment analysis for instant feedback understanding
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <BarChart2 size={20} color="#fff" strokeWidth={2} />
              </div>
              <div className="feature-text">
                Real-time analytics dashboard with health scoring
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <Zap size={20} color="#fff" strokeWidth={2} />
              </div>
              <div className="feature-text">
                Priority-based issue tracking to focus on what matters most
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side — Login Form */}
      <div className="auth-form-container">
        <div className="auth-card">
          <div className="mobile-brand">
            <h1 className="mobile-brand-logo">PROD PILOT</h1>
            <p className="mobile-brand-tagline">Transform Feedback Into Excellence</p>
          </div>

          <div className="auth-header">
            <h2 className="auth-title">Welcome Back</h2>
            <p className="auth-subtitle">Sign in to access your product insights dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            {error && (
              <div style={{
                padding: "0.75rem 1rem",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "10px",
                color: "#F87171",
                fontSize: "0.875rem"
              }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="auth-divider">
            <div className="divider-line"></div>
            <span className="divider-text">or</span>
            <div className="divider-line"></div>
          </div>

          <div className="auth-link">
            Don&apos;t have an account?{" "}
            <a href="/signup">Create your organization</a>
          </div>
        </div>
      </div>
    </div>
  );
}
