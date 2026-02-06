const { verifyAccessToken } = require("../utils/jwt");

function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing access token" });

    req.user = verifyAccessToken(token); // {sub, orgId, role}
    next();
  } catch {
    return res.status(401).json({ error: "Invalid/expired access token" });
  }
}

module.exports = { requireAuth };