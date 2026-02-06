function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) return res.status(401).json({ error: "Unauthenticated" });
    if (!allowedRoles.includes(role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

module.exports = { requireRole };