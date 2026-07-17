import { useState } from "react";
import { api } from "../api/axios";
import "../styles/Auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
    } finally {
      // Always show the same result, whether or not the email matched an
      // account — the backend deliberately never reveals that.
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-branding">
        <div className="brand-content">
          <h1 className="brand-logo">PROD PILOT</h1>
          <h2 className="brand-tagline">Transform Feedback Into Product Excellence</h2>
        </div>
      </div>

      <div className="auth-form-container">
        <div className="auth-card">
          <div className="mobile-brand">
            <h1 className="mobile-brand-logo">PROD PILOT</h1>
          </div>

          <div className="auth-header">
            <h2 className="auth-title">Forgot Password</h2>
            <p className="auth-subtitle">
              Enter your email and we&apos;ll send you a reset link if an account exists.
            </p>
          </div>

          {submitted ? (
            <div
              style={{
                padding: "0.75rem 1rem",
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: "10px",
                color: "#A5B4FC",
                fontSize: "0.875rem",
              }}
            >
              If an account exists for that email, a reset link has been sent. Check your inbox.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label className="form-label" htmlFor="forgot-email">
                  Email Address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  className="form-input"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}

          <div className="auth-link">
            <a href="/signin">Back to sign in</a>
          </div>
        </div>
      </div>
    </div>
  );
}
