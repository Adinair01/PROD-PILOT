const { registerAdmin, loginUser, refreshAccessToken } = require("../services/auth.service");
const { asyncHandler } = require("../utils/async-handler");
const { ApiError } = require("../utils/api-error");
const { setAuthCookies, setAccessCookie, clearAuthCookies } = require("../utils/cookies");

const adminSignup = asyncHandler(async (req, res) => {
  const result = await registerAdmin(req.body);
  setAuthCookies(res, result);
  res.status(201).json({
    message: "Organization created. Admin registered.",
    data: { user: result.user, organization: result.organization },
  });
});

const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body);
  setAuthCookies(res, result);
  res.json({
    message: "Login successful",
    data: { user: result.user, organization: result.organization },
  });
});

const logout = asyncHandler(async (_req, res) => {
  clearAuthCookies(res);
  res.json({ message: "Logged out successfully" });
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    throw ApiError.unauthorized("Refresh token not found");
  }
  const result = await refreshAccessToken(refreshToken);
  setAccessCookie(res, result.accessToken);
  res.json({ message: "Token refreshed" });
});

module.exports = { adminSignup, login, logout, refresh };
