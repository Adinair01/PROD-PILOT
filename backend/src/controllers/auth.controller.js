const { registerSchema, loginSchema } = require("../validators/auth.validators");
const authService = require("../services/auth.service");

function cookieOptions() {
  return {
    httpOnly: true,
    secure: String(process.env.COOKIE_SECURE) === "true",
    sameSite: "lax",
    path: "/",
  };
}

async function register(req, res, next) {
  try {
    const parsed = registerSchema.parse(req.body);
    const user = await authService.register(parsed);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const parsed = loginSchema.parse(req.body);
    const { user, accessToken, refreshToken } = await authService.login(parsed);

    res.cookie("refreshToken", refreshToken, cookieOptions());
    res.json({ user, accessToken });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ error: "Missing refresh token" });

    const { accessToken, refreshToken } = await authService.refresh(token);
    res.cookie("refreshToken", refreshToken, cookieOptions());
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  res.clearCookie("refreshToken", { path: "/" });
  res.json({ ok: true });
}

module.exports = { register, login, refresh, logout };