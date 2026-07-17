const { User } = require("../models/user");
const { PasswordResetToken } = require("../models/password-reset-token.model");
const { generateToken, hashToken } = require("../utils/token");
const { hashPassword } = require("../utils/hash");
const { sendPasswordResetEmail } = require("./email.service");
const { revokeAllSessions } = require("./session.service");
const { ApiError } = require("../utils/api-error");
const { env } = require("../config/env");

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // ~1h, intentionally hardcoded

// Returns nothing — the controller always replies with the same generic
// message regardless of match count (0, 1, or many across orgs, since email
// is unique per-org, not globally), so there's no result here that could
// tempt a caller into branching on whether a match existed.
async function requestPasswordReset(email) {
  const users = await User.find({ email }).populate("organizationId");
  if (users.length === 0) return;

  const accounts = [];
  for (const user of users) {
    const rawToken = generateToken();
    await PasswordResetToken.create({
      userId: user._id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });
    accounts.push({
      name: user.name,
      orgName: user.organizationId.name,
      resetUrl: `${env.FRONTEND_URL}/reset-password?token=${rawToken}`,
    });
  }

  await sendPasswordResetEmail({ to: email, accounts });
}

async function resetPassword({ token, newPassword }) {
  const tokenHash = hashToken(token);

  // Atomic claim-then-act: prevents a double-submit from changing the
  // password twice or double-revoking. Claim BEFORE updating the password so
  // a losing racer gets a clean "invalid/expired" error, not a silent
  // overwrite of a password someone else just set.
  const claimed = await PasswordResetToken.findOneAndUpdate(
    { tokenHash, usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } }
  );
  if (!claimed) {
    throw ApiError.badRequest("Invalid or expired reset link");
  }

  const passwordHash = await hashPassword(newPassword);
  await User.findByIdAndUpdate(claimed.userId, { passwordHash });
  await revokeAllSessions(claimed.userId);
}

module.exports = { requestPasswordReset, resetPassword };
