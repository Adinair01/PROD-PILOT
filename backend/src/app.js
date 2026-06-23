const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const pinoHttp = require("pino-http");
const mongoose = require("mongoose");

const { env } = require("./config/env");
const { logger } = require("./utils/logger");

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

// Tighter limiter for auth + AI endpoints (expensive / abuse-prone).
const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
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
app.use(errorMiddleware);

module.exports = { app };
