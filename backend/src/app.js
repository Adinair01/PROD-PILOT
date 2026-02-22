const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth.routes");
const inviteRoutes = require("./routes/invite.routes");
const feedbackRoutes = require("./routes/feedback.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const insightsRoutes = require("./routes/insights.routes");

const { errorMiddleware } = require("./middlewares/error.middleware");

const app = express();

/*
GLOBAL MIDDLEWARE
*/

app.use(helmet());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:5173"],
    credentials: true,
  })
);

// parse body BEFORE routes
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
  })
);

/*
========================
HEALTH CHECK
========================
*/

app.get("/health", (req, res) => res.json({ ok: true }));

/*
========================
ROUTES
========================
*/

app.use("/v1/auth", authRoutes);
app.use("/v1/invite", inviteRoutes);
app.use("/v1/feedback", feedbackRoutes);
app.use("/v1/analytics", analyticsRoutes);
app.use("/v1/insights", insightsRoutes);

/*
========================
ERROR HANDLER (LAST)
========================
*/

app.use(errorMiddleware);

module.exports = { app };