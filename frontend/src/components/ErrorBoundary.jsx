import { Component } from "react";
import * as Sentry from "@sentry/react";

/**
 * Catches render-time errors anywhere below it so a single component failure
 * shows a recoverable fallback instead of a blank white screen.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Safe no-op if Sentry.init() never ran (no VITE_SENTRY_DSN configured).
    Sentry.captureException(error, { extra: info });
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.assign("/");
  };

  render() {
    if (this.state.hasError) {
      // Kept fully self-contained (inline styles + one inline <style> tag,
      // no external CSS import): this is the last-resort fallback for a
      // catastrophic render failure, which could itself be CSS-pipeline
      // related — it must render correctly even if the rest of the app's
      // styling failed to load. var(--token, fallback) keeps it on-theme in
      // the normal case while staying bulletproof if index.css never loaded.
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            background: "var(--bg, #060D1A)",
            color: "var(--text-body, #E2E8F0)",
            fontFamily: "'Inter', system-ui, sans-serif",
            textAlign: "center",
            padding: "2rem",
          }}
        >
          <style>{`
            .eb-reload-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4); }
            .eb-reload-btn:focus-visible { outline: 2px solid var(--indigo, #6366F1); outline-offset: 2px; }
          `}</style>
          <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Something went wrong</h1>
          <p style={{ color: "var(--subtle, #94A3B8)", maxWidth: 420 }}>
            An unexpected error occurred. Reloading usually fixes it.
          </p>
          <button
            onClick={this.handleReload}
            className="eb-reload-btn"
            style={{
              padding: "0.6rem 1.25rem",
              borderRadius: "var(--radius-md, 12px)",
              border: "none",
              background: "var(--indigo, #6366F1)",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
