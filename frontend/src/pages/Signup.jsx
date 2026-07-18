import { useState } from "react";
import { api } from "../api/axios";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { Zap, ShieldCheck, Lightbulb } from "lucide-react";
import { storeSession } from "../utils/auth";
import "../styles/Auth.css";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    orgName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/auth/admin/signup", formData);
      // Signup also authenticates (sets cookies), so go straight to the hub.
      storeSession(response.data.data);
      navigate("/hub");
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    if (formData.orgName.trim().length < 2) {
      setError("Enter an organization name above, then continue with Google.");
      return;
    }
    try {
      const response = await api.post("/auth/google/signup", {
        idToken: credentialResponse.credential,
        orgName: formData.orgName,
      });
      storeSession(response.data.data);
      navigate("/hub");
    } catch (err) {
      setError(err.response?.data?.error || "Google sign-up failed. Please try again.");
    }
  };

  return (
    <div className="auth-container">
      {/* Left Side — Branding */}
      <div className="auth-branding">
        <div className="brand-content">
          <h1 className="brand-logo">PROD PILOT</h1>
          <h2 className="brand-tagline">Start Your Journey to Product Excellence</h2>
          <p className="brand-description">
            Join product teams who use PROD PILOT to make data-driven decisions
            and build products their engineering teams are proud of.
          </p>

          <div className="brand-features">
            <div className="feature-item">
              <div className="feature-icon">
                <Zap size={20} color="#fff" strokeWidth={2} />
              </div>
              <div className="feature-text">
                Get started in under 2 minutes with zero setup required
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <ShieldCheck size={20} color="#fff" strokeWidth={2} />
              </div>
              <div className="feature-text">
                Enterprise-grade security with full organization isolation
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <Lightbulb size={20} color="#fff" strokeWidth={2} />
              </div>
              <div className="feature-text">
                Intelligent insights that help you prioritize what matters
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side — Signup Form */}
      <div className="auth-form-container">
        <div className="auth-card">
          <div className="mobile-brand">
            <h1 className="mobile-brand-logo">PROD PILOT</h1>
            <p className="mobile-brand-tagline">Start Your Journey</p>
          </div>

          <div className="auth-header">
            <h2 className="auth-title">Create Organization</h2>
            <p className="auth-subtitle">Set up your workspace and start collecting insights</p>
          </div>

          <form onSubmit={handleSignup} className="auth-form">
            {error && (
              <div className="auth-banner auth-banner--error" role="alert">
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="signup-name">Full Name</label>
              <input
                id="signup-name"
                name="name"
                className="form-input"
                placeholder="Jane Smith"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-email">Work Email</label>
              <input
                id="signup-email"
                name="email"
                type="email"
                className="form-input"
                placeholder="you@company.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                name="password"
                type="password"
                className="form-input"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-org">Organization Name</label>
              <input
                id="signup-org"
                name="orgName"
                className="form-input"
                placeholder="Acme Inc."
                value={formData.orgName}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Creating..." : "Create Organization"}
            </button>
          </form>

          <div className="auth-divider">
            <div className="divider-line"></div>
            <span className="divider-text">or</span>
            <div className="divider-line"></div>
          </div>

          {googleClientId && (
            <div className="google-btn-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google sign-up failed. Please try again.")}
                theme="filled_black"
                shape="rectangular"
                size="large"
                text="continue_with"
                width="380"
              />
            </div>
          )}

          <div className="auth-link">
            Already have an account? <a href="/signin">Sign in</a>
          </div>
        </div>
      </div>
    </div>
  );
}
