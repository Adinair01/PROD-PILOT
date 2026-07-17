import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../api/axios";
import "../styles/Auth.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword });
      navigate("/signin");
    } catch (err) {
      setError(err.response?.data?.error || "Reset failed. The link may be invalid or expired.");
    } finally {
      setLoading(false);
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
            <h2 className="auth-title">Reset Password</h2>
            <p className="auth-subtitle">Choose a new password for your account.</p>
          </div>

          {!token && (
            <div
              style={{
                padding: "0.75rem 1rem",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "10px",
                color: "#F87171",
                fontSize: "0.875rem",
              }}
            >
              This reset link is missing its token. Request a new one.
            </div>
          )}

          {error && (
            <div
              style={{
                padding: "0.75rem 1rem",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "10px",
                color: "#F87171",
                fontSize: "0.875rem",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="reset-new-password">
                New Password
              </label>
              <input
                id="reset-new-password"
                type="password"
                className="form-input"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reset-confirm-password">
                Confirm New Password
              </label>
              <input
                id="reset-confirm-password"
                type="password"
                className="form-input"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading || !token}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <div className="auth-link">
            <a href="/signin">Back to sign in</a>
          </div>
        </div>
      </div>
    </div>
  );
}
