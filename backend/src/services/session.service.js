const { RefreshToken } = require("../models/refresh-token.model");
const { generateToken, hashToken } = require("../utils/token");
const { REFRESH_TOKEN_MAX_AGE } = require("../utils/cookies");
const { ApiError } = require("../utils/api-error");
const { logger } = require("../utils/logger");

async function createSession(userId) {
  const rawToken = generateToken();
  const doc = new RefreshToken({
    userId,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE),
  });
  doc.familyId = doc._id; // root of a new lineage
  await doc.save();
  return rawToken;
}

async function rotateSession(rawToken) {
  const tokenHash = hashToken(rawToken);
  const now = new Date();

  // Atomic claim: only one concurrent caller (e.g. two tabs racing a refresh
  // off the same cookie) can win this update. The loser falls through to the
  // reuse path below — indistinguishable from a real replay (inherent to
  // rotation), but scoped to one family so it can't take out other devices.
  const claimed = await RefreshToken.findOneAndUpdate(
    { tokenHash, revokedAt: null },
    { $set: { revokedAt: now } }
  );

  if (!claimed) {
    const prior = await RefreshToken.findOne({ tokenHash });
    if (prior) {
      logger.warn(
        { userId: prior.userId, familyId: prior.familyId },
        "Refresh token reuse detected — revoking session family"
      );
      await revokeAllSessions(prior.userId, { familyId: prior.familyId });
    }
    throw ApiError.unauthorized("Invalid refresh token");
  }

  if (claimed.expiresAt < now) {
    throw ApiError.unauthorized("Refresh token expired");
  }

  const newRawToken = generateToken();
  await RefreshToken.create({
    userId: claimed.userId,
    familyId: claimed.familyId,
    tokenHash: hashToken(newRawToken),
    expiresAt: new Date(now.getTime() + REFRESH_TOKEN_MAX_AGE),
  });

  return { userId: claimed.userId, rawToken: newRawToken };
}

async function revokeSession(rawToken) {
  if (!rawToken) return;
  await RefreshToken.findOneAndUpdate(
    { tokenHash: hashToken(rawToken), revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

async function revokeAllSessions(userId, { familyId } = {}) {
  const filter = { userId, revokedAt: null };
  if (familyId) filter.familyId = familyId;
  await RefreshToken.updateMany(filter, { $set: { revokedAt: new Date() } });
}

module.exports = { createSession, rotateSession, revokeSession, revokeAllSessions };
