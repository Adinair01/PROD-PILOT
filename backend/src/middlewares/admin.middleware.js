module.exports = function requireAdmin(req, res, next) {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      error: "Admins only",
    });
  }

  next();
};