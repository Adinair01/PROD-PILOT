import { useNavigate } from "react-router-dom";
import { 
  BarChart3, 
  Bug, 
  Palette, 
  Server, 
  TrendingUp,
  LogOut,
  Cpu,
} from "lucide-react";
import "../styles/RoleSelector.css";

export default function RoleSelector() {
  const navigate = useNavigate();

  const roles = [
    {
      id: "pm",
      name: "Product Manager",
      Icon: BarChart3,
      description: "Strategic overview and product health insights",
      color: "#6366F1",
    },
    {
      id: "qa",
      name: "QA Engineer",
      Icon: Bug,
      description: "Bug tracking and quality assurance",
      color: "#EF4444",
    },
    {
      id: "fe",
      name: "Frontend Developer",
      Icon: Palette,
      description: "UI/UX feedback and performance monitoring",
      color: "#8B5CF6",
    },
    {
      id: "be",
      name: "Backend Developer",
      Icon: Server,
      description: "API issues and backend performance",
      color: "#F59E0B",
    },
    {
      id: "data",
      name: "Data Engineer",
      Icon: TrendingUp,
      description: "Data analytics and insights",
      color: "#22C55E",
    },
  ];

  const handleRoleSelect = (roleId) => {
    navigate(`/dashboard/${roleId}`);
  };

  const handleLogout = async () => {
    navigate("/");
  };

  return (
    <div className="role-selector-container">
      <nav className="navbar">
        <div className="nav-left">
          <h1 className="logo">PROD PILOT</h1>
        </div>
        <div className="nav-right">
          <button onClick={() => navigate("/decision-engine")} className="de-nav-btn">
            <Cpu size={15} />
            <span>Decision Engine</span>
          </button>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <div className="role-selector-content">
        <div className="selector-header">
          <h1>Select Your <span>Dashboard</span></h1>
          <p>Choose your role to access personalized insights and analytics</p>
        </div>

        <div className="roles-grid">
          {roles.map((role) => {
            const IconComponent = role.Icon;
            return (
              <div
                key={role.id}
                className="role-card"
                onClick={() => handleRoleSelect(role.id)}
                style={{ 
                  borderColor: role.color,
                  '--role-color': role.color 
                }}
              >
                <div className="role-icon-wrapper" style={{ background: `${role.color}15` }}>
                  <IconComponent 
                    size={48} 
                    color={role.color}
                    strokeWidth={1.5}
                  />
                </div>
                <h3>{role.name}</h3>
                <p>{role.description}</p>
                <button
                  className="role-btn"
                  style={{ background: role.color }}
                >
                  Open Dashboard
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
