const { env, REFRESH_COOKIE_PATH } = require("../config/env");

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Cookie options are centralized so that login, signup, refresh and logout all
 * use identical attributes. `sameSite` mitigates CSRF; `secure` is driven by
 * the validated COOKIE_SECURE env flag (must be true behind HTTPS).
 */
const baseCookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SECURE ? "none" : "lax",
};

const accessCookieOptions = {
  ...baseCookieOptions,
  maxAge: ACCESS_TOKEN_MAX_AGE,
};

const refreshCookieOptions = {
  ...baseCookieOptions,
  path: REFRESH_COOKIE_PATH,
  maxAge: REFRESH_TOKEN_MAX_AGE,
};

function setAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie("accessToken", accessToken, accessCookieOptions);
  if (refreshToken) {
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);
  }
}

function setAccessCookie(res, accessToken) {
  res.cookie("accessToken", accessToken, accessCookieOptions);
}

function clearAuthCookies(res) {
  // clearCookie must receive matching attributes (path/sameSite/secure) to work.
  res.clearCookie("accessToken", { ...baseCookieOptions, maxAge: undefined });
  res.clearCookie("refreshToken", {
    ...baseCookieOptions,
    path: REFRESH_COOKIE_PATH,
    maxAge: undefined,
  });
}

module.exports = {
  setAuthCookies,
  setAccessCookie,
  clearAuthCookies,
  accessCookieOptions,
  refreshCookieOptions,
  REFRESH_TOKEN_MAX_AGE,
};
