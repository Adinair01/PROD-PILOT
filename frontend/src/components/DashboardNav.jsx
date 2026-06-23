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
    <nav className="navbar">
      <div className="nav-left">
        <h1 className="logo">PROD PILOT</h1>
        {org && (
          <span className="org-badge">
            <Building2 size={14} />
            {org.name}
          </span>
        )}
        {roleLabel && (
          <span className={`role-badge ${roleClass}`}>
            {RoleIcon && <RoleIcon size={14} />}
            {roleLabel}
          </span>
        )}
      </div>
      <div className="nav-right">
        <button onClick={() => navigate("/dashboard")} className="back-btn">
          <ArrowLeft size={16} />
          <span>Switch Role</span>
        </button>
        <button onClick={() => logout(navigate)} className="logout-btn">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}
