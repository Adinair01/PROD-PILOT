import axios from "axios";

// API base URL is configurable per environment (see .env.example). Falls back
// to the local backend so `npm run dev` works with zero configuration.
const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/v1";

export const api = axios.create({
  baseURL,
  withCredentials: true, // send/receive httpOnly auth cookies
});

function clearSessionAndRedirect() {
  localStorage.removeItem("user");
  localStorage.removeItem("organization");
  if (window.location.pathname !== "/signin") {
    window.location.assign("/signin");
  }
}

// The access-token cookie expires after 15 minutes (see
// backend/src/utils/cookies.js ACCESS_TOKEN_MAX_AGE); the refresh-token
// cookie lasts 7 days. Without this, any request made after 15 minutes of
// inactivity got a 401 and bounced straight to sign-in even though the
// session was still perfectly valid — this is what silently renews it.
// Concurrent 401s share one in-flight refresh call instead of each firing
// their own (and racing to rotate the same refresh token against each other).
let refreshPromise = null;

function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = api.post("/auth/refresh").finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/**
 * Global 401 handling: on a first-time 401 from a non-auth call, try a
 * silent refresh and retry the original request once. If the refresh call
 * itself fails (refresh token also expired/revoked), or the retry still
 * comes back 401, clear the cached session and bounce to sign-in.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const config = error.config ?? {};
    const isAuthCall = (config.url ?? "").includes("/auth/");

    if (status === 401 && !isAuthCall) {
      if (!config._retriedAfterRefresh) {
        config._retriedAfterRefresh = true;
        try {
          await refreshSession();
          return api(config);
        } catch {
          clearSessionAndRedirect();
          return Promise.reject(error);
        }
      }
      clearSessionAndRedirect();
    }
    return Promise.reject(error);
  }
);
