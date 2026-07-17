const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // Shared by every token descended from the same login. Reuse detection
    // revokes by familyId, not userId, so one compromised session lineage
    // doesn't log out the user's other devices.
    familyId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// TTL sweep runs on ~60s granularity, not instantly — application logic still
// checks expiresAt explicitly rather than assuming a doc is gone the instant
// it expires.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Guards against OverwriteModelError when this module is evaluated more than
// once (e.g. Vitest/Vite's module graph can load the same CJS file twice).
const RefreshToken =
  mongoose.models.RefreshToken || mongoose.model("RefreshToken", refreshTokenSchema);

module.exports = { RefreshToken };
