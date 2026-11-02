
import { NavLink, useNavigate } from "react-router-dom";
import { logoutUser, getAuthUser } from "../../services/authService";

import {
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  GraduationCap,
  X,
  LogOut,
  ClipboardList,
} from "lucide-react";

const adminMenuItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Staff Management", path: "/admin/staff", icon: Users },
  { label: "Courses", path: "/admin/courses", icon: BookOpen },
  { label: "Lessons", path: "/admin/lessons", icon: BookOpen },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

const staffMenuItems = (role) => [
  {
    label: "Dashboard",
    path: `/${role}`,
    icon: LayoutDashboard,
  },
  {
    label: "Leads",
    path: `/${role}/leads`,
    icon: ClipboardList,
  },
];

function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const user = getAuthUser();
  const role = user?.role;

  const menuItems =
    role === "admin"
      ? adminMenuItems
      : role === "support" || role === "sales"
        ? staffMenuItems(role)
        : [];

  const handleLogout = () => {
    logoutUser();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {open && (
        <button
          className="sidebar-overlay"
          onClick={onClose}
          aria-label="Close navigation"
        />
      )}

      <aside className={`dashboard-sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">
            <GraduationCap size={24} />
          </div>

          <div>
            <h2>AuraLearn <span>AI</span></h2>
            <p>Learning platform</p>
          </div>

          <button
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <p className="sidebar-section-label">WORKSPACE</p>

        <nav className="sidebar-nav">
          {menuItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === `/${role}`}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
              onClick={onClose}
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-avatar">AI</div>

          <div className="sidebar-user-info">
            <strong>AuraLearn AI</strong>
            <p>{role ? role.charAt(0).toUpperCase() + role.slice(1) : "Workspace"}</p>
          </div>

          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={19} />
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
