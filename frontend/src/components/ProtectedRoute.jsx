import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

/**
 * Gates authenticated areas. Renders children only when a session exists,
 * otherwise redirects to sign-in. (A valid httpOnly cookie is still required
 * server-side; this is the client-side gate that prevents rendering protected
 * UI to anonymous visitors.)
 */
export default function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/signin" replace />;
  }
  return children;
}
