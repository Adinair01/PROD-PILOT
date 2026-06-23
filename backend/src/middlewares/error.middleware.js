const { ZodError } = require("zod");
const mongoose = require("mongoose");
const { ApiError } = require("../utils/api-error");
const { logger } = require("../utils/logger");

/**
 * Central error handler. Maps known error types to safe client responses and
 * logs everything server-side. Unexpected errors never leak internals — the
 * client always sees a generic 500 message.
 */
// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  // Input validation failures (from Zod schemas / validate middleware).
  if (err instanceof ZodError) {
    return res.status(422).json({
      error: "Validation failed",
      details: err.issues.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // Invalid ObjectId etc. that slipped past validation.
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: `Invalid value for '${err.path}'` });
  }

  // Duplicate key (e.g. unique email per org).
  if (err?.code === 11000) {
    return res.status(409).json({ error: "Resource already exists" });
  }

  // Expected, operational errors — message is safe to expose.
  if (err instanceof ApiError || err?.statusCode) {
    return res.status(err.statusCode || 400).json({ error: err.message || "Request failed" });
  }

  // Anything else is unexpected: log full detail, return generic message.
  logger.error({ err, path: req.originalUrl, method: req.method }, "Unhandled error");
  return res.status(500).json({ error: "Internal server error" });
}

module.exports = { errorMiddleware };
