const { OAuth2Client } = require("google-auth-library");
const { env } = require("../config/env");
const { ApiError } = require("./api-error");
const { logger } = require("./logger");

const client = new OAuth2Client();

async function verifyGoogleIdToken(idToken) {
  if (!env.GOOGLE_CLIENT_ID) {
    throw ApiError.badGateway("Google sign-in is not configured");
  }

  let ticket;
  try {
    ticket = await client.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
  } catch (err) {
    // Collapsed to one message deliberately — expired/bad-signature/wrong-
    // audience/malformed all call for the same client action (retry), and
    // distinguishing them would hand an attacker feedback on which check a
    // forged/replayed token failed. Still logged server-side: ApiErrors are
    // excluded from both errorMiddleware's error log and Sentry, so without
    // this, a systemic issue (e.g. GOOGLE_CLIENT_ID mismatched between
    // deployed frontend/backend) would be permanently invisible.
    logger.warn({ err: err.message }, "Google ID token verification failed");
    throw ApiError.unauthorized("Invalid Google credential");
  }

  const payload = ticket.getPayload();
  if (!payload.email_verified) {
    throw ApiError.forbidden("Google email is not verified");
  }

  return { googleId: payload.sub, email: payload.email, name: payload.name || payload.email };
}

module.exports = { verifyGoogleIdToken };
