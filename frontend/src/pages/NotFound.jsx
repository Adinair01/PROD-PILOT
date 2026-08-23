import { Link } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg, #060D1A)",
        color: "var(--text-body, #E2E8F0)",
        fontFamily: "'Inter', system-ui, sans-serif",
        textAlign: "center",
        padding: "2rem",
        gap: "1rem",
      }}
    >
      <MapPin size={48} strokeWidth={1.5} style={{ color: "#6366F1", opacity: 0.7 }} />
      <h1 style={{ fontSize: "3rem", fontWeight: 700, margin: 0 }}>404</h1>
      <p style={{ color: "var(--subtle, #94A3B8)", maxWidth: 360, fontSize: "1rem" }}>
        This page doesn&apos;t exist or has been moved.
      </p>
      <Link
        to="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.6rem 1.25rem",
          borderRadius: "var(--radius-md, 12px)",
          border: "none",
          background: "#6366F1",
          color: "#fff",
          fontWeight: 600,
          cursor: "pointer",
          textDecoration: "none",
          fontSize: "0.9rem",
          marginTop: "0.5rem",
        }}
      >
        <ArrowLeft size={15} />
        Back to Home
      </Link>
    </div>
  );
}
