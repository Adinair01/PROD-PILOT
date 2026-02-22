const {
  registerAdmin,
  loginUser,
  refreshAccessToken,
} = require("../services/auth.service");

const adminSignup = async (req, res, next) => {
  try {
    const result = await registerAdmin(req.body);

    // Set tokens in cookies
    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      message: "Organization created. Admin registered.",
      data: {
        user: result.user,
        organization: result.organization,
      },
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);

    // Set tokens in cookies
    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: "Login successful",
      data: { user: result.user },
    });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      const error = new Error("Refresh token not found");
      error.statusCode = 401;
      throw error;
    }

    const result = await refreshAccessToken(refreshToken);

    // Set new access token
    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.json({ message: "Token refreshed" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  adminSignup,
  login,
  logout,
  refresh,
};