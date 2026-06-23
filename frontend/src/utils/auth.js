import { api } from "../api/axios";

// Safely read and parse a JSON value from localStorage. Corrupt/stale data
// returns null instead of throwing and white-screening the app.
function readJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export const getUser = () => readJSON("user");
export const getOrganization = () => readJSON("organization");
export const isAuthenticated = () => getUser() !== null;

export function storeSession({ user, organization }) {
  if (user) localStorage.setItem("user", JSON.stringify(user));
  if (organization) localStorage.setItem("organization", JSON.stringify(organization));
}

function clearSession() {
  localStorage.removeItem("user");
  localStorage.removeItem("organization");
}

/**
 * Logs the user out: revokes the server session, clears local state, and
 * navigates to sign-in. Network failures still clear local state so the user
 * is never stuck in a half-logged-in state.
 */
export async function logout(navigate) {
  try {
    await api.post("/auth/logout");
  } catch {
    // Ignore — we clear local state regardless.
  }
  clearSession();
  navigate("/signin");
}
