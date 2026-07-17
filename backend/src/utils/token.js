const crypto = require("crypto");

// Opaque, high-entropy session/reset tokens. Stored hashed (never raw) so a DB
// read alone can't produce a usable token — this is a lookup key, not a secret
// meant to survive a password-style slow hash; sha256 is the correct tool here.
function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

module.exports = { generateToken, hashToken };
