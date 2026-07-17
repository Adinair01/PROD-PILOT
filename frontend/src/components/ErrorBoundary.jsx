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
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            background: "#0B1120",
            color: "#E2E8F0",
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
            padding: "2rem",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Something went wrong</h1>
          <p style={{ color: "#94A3B8", maxWidth: 420 }}>
            An unexpected error occurred. Reloading usually fixes it.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: "0.6rem 1.25rem",
              borderRadius: 8,
              border: "none",
              background: "#6366F1",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
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
