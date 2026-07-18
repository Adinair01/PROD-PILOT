import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Building2 } from "lucide-react";
import { getOrganization, logout } from "../utils/auth";

/**
 * Shared dashboard navbar: brand, org badge, role badge, switch-role and a
 * real logout. Replaces the near-identical navbar + logout copy that lived in
 * each role dashboard.
 */
export default function DashboardNav({ roleLabel, roleClass = "", RoleIcon }) {
  const navigate = useNavigate();
  const org = getOrganization();

  return (
    <nav className="dash-navbar">
      <div className="dash-nav-left">
        <h1 className="dash-logo">PROD PILOT</h1>
        {org && (
          <span className="dash-org-badge">
            <Building2 size={14} />
            {org.name}
          </span>
        )}
        {roleLabel && (
          <span className={`dash-role-badge ${roleClass}`}>
            {RoleIcon && <RoleIcon size={14} />}
            {roleLabel}
          </span>
        )}
      </div>
      <div className="dash-nav-right">
        <button onClick={() => navigate("/dashboard")} className="dash-back-btn">
          <ArrowLeft size={16} />
          <span>Switch Role</span>
        </button>
        <button onClick={() => logout(navigate)} className="dash-logout-btn">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}
