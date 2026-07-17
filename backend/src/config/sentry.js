const Sentry = require("@sentry/node");
const { env } = require("./env");

function initSentry() {
  if (env.SENTRY_DSN) {
    Sentry.init({ dsn: env.SENTRY_DSN, environment: env.NODE_ENV });
  }
}

module.exports = { Sentry, initSentry };
