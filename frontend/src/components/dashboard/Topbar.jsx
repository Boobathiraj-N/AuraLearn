
import { Bell, Menu, Search } from "lucide-react";

function Topbar({ onMenuClick }) {
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
        <button className="notification-button" aria-label="Notifications">
          <Bell size={20} />
          <span />
        </button>

        <div className="topbar-profile">
          <div className="profile-avatar">A</div>
          <div className="profile-details">
            <strong>Administrator</strong>
            <span>Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
