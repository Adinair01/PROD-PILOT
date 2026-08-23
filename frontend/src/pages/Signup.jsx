import { useState } from "react";
import { api } from "../api/axios";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { Zap, ShieldCheck, Lightbulb, Building2, ArrowLeft, Check } from "lucide-react";
import { storeSession } from "../utils/auth";
import "../styles/Auth.css";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const STEPS = [
  { label: "Workspace" },
  { label: "Account" },
];

function passwordStrength(password) {
  if (!password) return { score: 0, label: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const levels = ["Weak", "Fair", "Good", "Strong", "Excellent"];
  return { score: Math.min(score, 5), label: levels[Math.min(score, 5) - 1] || "Weak" };
}

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
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

  const canContinue = formData.orgName.trim().length >= 2 && formData.name.trim().length >= 2;

  const goToAccountStep = (e) => {
    e.preventDefault();
    setError("");
    if (!canContinue) {
      setError("Enter your organization and full name to continue.");
      return;
    }
    setStep(1);
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

  const strength = passwordStrength(formData.password);

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

          {/* Step progress */}
          <div className="auth-progress" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={STEPS.length}>
            {STEPS.map((s, i) => (
              <div className="auth-progress-step" key={s.label}>
                <div
                  className={
                    "auth-progress-dot" +
                    (i < step ? " auth-progress-dot--done" : "") +
                    (i === step ? " auth-progress-dot--active" : "")
                  }
                >
                  {i < step ? <Check size={13} strokeWidth={3} /> : i + 1}
                </div>
                <span className={"auth-progress-label" + (i === step ? " auth-progress-label--active" : "")}>
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={"auth-progress-line" + (i < step ? " auth-progress-line--done" : "")} />
                )}
              </div>
            ))}
          </div>

          {step === 0 ? (
            <>
              <div className="auth-header">
                <h2 className="auth-title">Create Your Workspace</h2>
                <p className="auth-subtitle">Tell us who you are and what you're building.</p>
              </div>

              <form onSubmit={goToAccountStep} className="auth-form">
                {error && (
                  <div className="auth-banner auth-banner--error" role="alert">
                    {error}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="signup-org">Organization Name</label>
                  <input
                    id="signup-org"
                    name="orgName"
                    className="form-input"
                    placeholder="Acme Inc."
                    value={formData.orgName}
                    onChange={handleChange}
                    autoFocus
                    required
                  />
                </div>

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

                <button type="submit" className="auth-btn" disabled={!canContinue}>
                  Continue
                </button>
              </form>

              <div className="auth-link">
                Already have an account? <a href="/signin">Sign in</a>
              </div>
            </>
          ) : (
            <>
              <button type="button" className="auth-step-back" onClick={() => setStep(0)}>
                <ArrowLeft size={15} strokeWidth={2.5} />
                Back
              </button>

              <div className="auth-header">
                <h2 className="auth-title">Secure Your Account</h2>
                <p className="auth-subtitle">
                  <Building2 size={14} strokeWidth={2.5} className="auth-subtitle-icon" />
                  {formData.orgName}
                </p>
              </div>

              <form onSubmit={handleSignup} className="auth-form">
                {error && (
                  <div className="auth-banner auth-banner--error" role="alert">
                    {error}
                  </div>
                )}

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
                    autoFocus
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
                  {formData.password && (
                    <div className="password-strength">
                      <div className="password-strength-track">
                        <div
                          className={`password-strength-fill password-strength-fill--${strength.score}`}
                          style={{ width: `${(strength.score / 5) * 100}%` }}
                        />
                      </div>
                      <span className={`password-strength-label password-strength-label--${strength.score}`}>
                        {strength.label}
                      </span>
                    </div>
                  )}
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

              <div className="trust-strip">
                <span className="trust-item">
                  <ShieldCheck size={14} strokeWidth={2.5} />
                  Org-isolated data
                </span>
                <span className="trust-item">
                  <Check size={14} strokeWidth={2.5} />
                  No credit card required
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
