const pino = require("pino");
const { env } = require("../config/env");

/**
 * Structured application logger.
 *
 * Pretty-printed in development, JSON in production (so log aggregators can
 * parse it). Sensitive fields are redacted regardless of environment.
 */
const logger = pino({
  level: env.isProduction ? "info" : "debug",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.passwordHash",
      "*.newPassword",
      "*.accessToken",
      "*.refreshToken",
      "*.token",
    ],
    remove: true,
  },
  // Pretty output only in local development; tests and production emit plain
  // JSON (no worker thread) so they stay quiet and tear down cleanly.
  transport:
    env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard", ignore: "pid,hostname" },
        }
      : undefined,
  enabled: env.NODE_ENV !== "test",
});

module.exports = { logger };
