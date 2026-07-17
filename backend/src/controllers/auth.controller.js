const {
  registerAdmin,
  loginUser,
  refreshSession,
  logoutUser,
} = require("../services/auth.service");
const { requestPasswordReset, resetPassword } = require("../services/password-reset.service");
const { asyncHandler } = require("../utils/async-handler");
const { ApiError } = require("../utils/api-error");
const { setAuthCookies, clearAuthCookies } = require("../utils/cookies");

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

const logout = asyncHandler(async (req, res) => {
  // Tolerant of a missing/already-invalid cookie — logout always succeeds
  // from the client's point of view.
  await logoutUser(req.cookies.refreshToken);
  clearAuthCookies(res);
  res.json({ message: "Logged out successfully" });
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    throw ApiError.unauthorized("Refresh token not found");
  }
  try {
    const result = await refreshSession(refreshToken);
    // Rotation issues a new refresh token too — both cookies must be reissued,
    // or the session would be exhausted after a single refresh.
    setAuthCookies(res, result);
    res.json({ message: "Token refreshed" });
  } catch (err) {
    clearAuthCookies(res);
    throw err;
  }
});

const forgotPassword = asyncHandler(async (req, res) => {
  await requestPasswordReset(req.body.email);
  // Same response regardless of whether the email matched an account, and
  // regardless of match count — avoids leaking account existence.
  res.json({ message: "If an account exists for that email, a reset link has been sent." });
});

const resetPasswordHandler = asyncHandler(async (req, res) => {
  await resetPassword(req.body);
  res.json({ message: "Password reset successful. Please sign in." });
});

module.exports = {
  adminSignup,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword: resetPasswordHandler,
};
