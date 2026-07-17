const { Resend } = require("resend");
const { env } = require("../config/env");
const { logger } = require("../utils/logger");

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
const EMAIL_TIMEOUT_MS = 8000;

// Resend's SDK doesn't expose a timeout/abort option — this only stops
// *waiting* on the call, it doesn't cancel the underlying HTTP request.
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Email send timed out after ${ms}ms`)), ms)
    ),
  ]);
}

function escapeHtml(str) {
  return String(str).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );
}

function renderPasswordResetHtml(accounts) {
  if (accounts.length === 1) {
    const { name, resetUrl } = accounts[0];
    return `<p>Hi ${escapeHtml(name)},</p><p>Click below to reset your PROD PILOT password. This link expires in 1 hour.</p><p><a href="${resetUrl}">Reset your password</a></p>`;
  }
  const items = accounts
    .map((a) => `<li>${escapeHtml(a.orgName)}: <a href="${a.resetUrl}">Reset password</a></li>`)
    .join("");
  return `<p>We found more than one PROD PILOT account for this email address. Choose the one you want to reset (links expire in 1 hour):</p><ul>${items}</ul>`;
}

// accounts: [{ name, orgName, resetUrl }, ...] — one email, one link per
// matched account (a single email address can map to users in multiple orgs).
async function sendPasswordResetEmail({ to, accounts }) {
  if (!resend) {
    logger.warn("[Email] RESEND_API_KEY not set, skipping password reset email");
    return;
  }
  try {
    // Resend's SDK does not always throw on failure — per its docs, API-level
    // errors come back as `{ data: null, error }` instead of a rejection. Both
    // paths must be handled; catching only rejections would silently swallow
    // this (e.g. an unverified `from` domain).
    const { error } = await withTimeout(
      resend.emails.send({
        from: env.EMAIL_FROM,
        to,
        subject: "Reset your PROD PILOT password",
        html: renderPasswordResetHtml(accounts),
      }),
      EMAIL_TIMEOUT_MS
    );
    if (error) {
      logger.warn({ err: error }, "[Email] Resend rejected the password reset email");
    }
  } catch (err) {
    logger.warn({ err: err.message }, "[Email] Failed to send password reset email");
  }
}

module.exports = { sendPasswordResetEmail };
