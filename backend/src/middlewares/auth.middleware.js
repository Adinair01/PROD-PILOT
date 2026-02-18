const { verifyAccessToken } = require("../utils/jwt");

function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authorization token missing",
      });
    }

    const token = header.split(" ")[1];

    const decoded = verifyAccessToken(token);

    req.user = decoded; // {userId, orgId, role}

    next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}

module.exports = { requireAuth };