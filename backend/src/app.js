const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const pinoHttp = require("pino-http");
const mongoose = require("mongoose");

const { env } = require("./config/env");
const { logger } = require("./utils/logger");
const { Sentry } = require("./config/sentry");

const authRoutes = require("./routes/auth.routes");
const inviteRoutes = require("./routes/invite.routes");
const feedbackRoutes = require("./routes/feedback.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const insightsRoutes = require("./routes/insights.routes");
const pmInsightsRoutes = require("./routes/pm-insights.routes");
const decisionEngineRoutes = require("./routes/decision-engine.routes");

const { errorMiddleware } = require("./middlewares/error.middleware");

const app = express();
app.disable("x-powered-by");

// Behind a reverse proxy / load balancer (Render, Railway, Fly, nginx, etc.),
// trust the first hop so req.ip and secure cookies reflect the real client via
// X-Forwarded-For. A fixed hop count (not `true`) prevents clients from spoofing
// the header to bypass rate limiting. Disabled locally where there is no proxy.
if (env.isProduction) {
  app.set("trust proxy", 1);
}

/* ── Global middleware ────────────────────────────────────────────────── */

app.use(helmet());
app.use(pinoHttp({ logger }));

app.use(
  cors({
    origin: env.corsOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

// Baseline limiter for the whole API.
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Tighter limiter for auth + AI endpoints (expensive / abuse-prone). Relaxed
// in tests — Supertest requests all share one in-memory bucket (no real
// client IPs), so a full test run legitimately exceeds real-world limits
// within the same window; the limiter's own behavior isn't what's under test.
const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.isTest ? 10000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please slow down." },
});

/* ── Health checks ────────────────────────────────────────────────────── */

// Liveness: process is up.
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Readiness: dependencies (DB) are reachable.
app.get("/health/ready", (_req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  res
    .status(dbReady ? 200 : 503)
    .json({ status: dbReady ? "ready" : "not-ready", db: dbReady ? "up" : "down" });
});

/* ── Routes ───────────────────────────────────────────────────────────── */

app.use("/v1/auth", strictLimiter, authRoutes);
app.use("/v1/invite", inviteRoutes);
app.use("/v1/feedback", feedbackRoutes);
app.use("/v1/analytics", analyticsRoutes);
app.use("/v1/insights", insightsRoutes);
app.use("/v1/pm-insights", pmInsightsRoutes);
app.use("/v1/decision-engine", strictLimiter, decisionEngineRoutes);

/* ── 404 + error handler (last) ───────────────────────────────────────── */

app.use((_req, res) => res.status(404).json({ error: "Route not found" }));
// Reports errors to Sentry, then passes them on — placed before the app's own
// error middleware so it sees the error first. ApiErrors carry a statusCode,
// so Sentry's default filtering already excludes expected 4xx responses and
// only reports genuine 5xx/unhandled errors.
Sentry.setupExpressErrorHandler(app);
app.use(errorMiddleware);

module.exports = { app };
