const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

// Load and validate environment before anything else reads it.
const { env } = require("./config/env");

// Must run before ./app (and ./config/db) are required — Sentry's
// auto-instrumentation of express/mongoose/http only works if init happens
// before those modules are first required.
const { initSentry, Sentry } = require("./config/sentry");
initSentry();

const { app } = require("./app");
const { connectDB, disconnectDB } = require("./config/db");
const { logger } = require("./utils/logger");

let server;

async function start() {
  await connectDB(env.MONGO_URI);
  server = app.listen(env.PORT, () => logger.info(`API running on :${env.PORT} (${env.NODE_ENV})`));
}

// Graceful shutdown: stop accepting connections, then close the DB.
async function shutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully`);
  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDB();
    // captureException only queues the event; without an explicit flush the
    // process can exit before it reaches Sentry's ingest endpoint.
    await Sentry.flush(2000).catch(() => {});
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "Error during shutdown");
    await Sentry.flush(2000).catch(() => {});
    process.exit(1);
  }
}

["SIGTERM", "SIGINT"].forEach((signal) => process.on(signal, () => shutdown(signal)));

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection");
  Sentry.captureException(reason);
  shutdown("unhandledRejection");
});

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception");
  Sentry.captureException(err);
  shutdown("uncaughtException");
});

start().catch((err) => {
  logger.error({ err }, "Failed to start server");
  Sentry.captureException(err);
  Sentry.flush(2000)
    .catch(() => {})
    .finally(() => process.exit(1));
});
