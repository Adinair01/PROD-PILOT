const { verifyAccessToken } = require("../utils/jwt");

function requireAuth(req, res, next) {
  try {
    // Try to get token from cookies first, then from Authorization header
    let token = req.cookies.accessToken;

    if (!token) {
      const header = req.headers.authorization;
      if (header?.startsWith("Bearer ")) {
        token = header.split(" ")[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        error: "Authorization token missing",
      });
    }

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