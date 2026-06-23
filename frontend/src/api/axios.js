import axios from "axios";

// API base URL is configurable per environment (see .env.example). Falls back
// to the local backend so `npm run dev` works with zero configuration.
const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/v1";

export const api = axios.create({
  baseURL,
  withCredentials: true, // send/receive httpOnly auth cookies
});

/**
 * Global 401 handling: if any authenticated request comes back unauthorized,
 * clear the cached session and bounce the user to sign-in. Login/refresh calls
 * are exempt so a bad password doesn't trigger a redirect loop.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";
    const isAuthCall = url.includes("/auth/");

    if (status === 401 && !isAuthCall) {
      localStorage.removeItem("user");
      localStorage.removeItem("organization");
      if (window.location.pathname !== "/signin") {
        window.location.assign("/signin");
      }
    }
    return Promise.reject(error);
  }
);
