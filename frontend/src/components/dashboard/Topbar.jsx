
import { Bell, Menu, Search } from "lucide-react";
import { getAuthUser } from "../../services/authService";

function Topbar({ onMenuClick }) {
  const user = getAuthUser();

  const userName = user?.name || "User";
  const userRole = user?.role || "Unknown";

  const avatar = userName.charAt(0).toUpperCase();

  return (
    <header className="dashboard-topbar">
      <button
        className="mobile-menu-button"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu size={22} />
      </button>

      <div className="topbar-search">
        <Search size={18} />
        <input
          type="search"
          placeholder="Search your workspace..."
          aria-label="Search workspace"
        />
      </div>

      <div className="topbar-actions">
        <button
          className="notification-button"
          aria-label="Notifications"
        >
          <Bell size={20} />
          <span />
        </button>

        <div className="topbar-profile">
          <div className="profile-avatar">{avatar}</div>

          <div className="profile-details">
            <strong>{userName}</strong>
            <span>
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
