
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Bell,
  Menu,
  Search,
  ChevronDown,
  LockKeyhole,
  LogOut,
} from "lucide-react";

import {
  getAuthUser,
  logoutUser,
} from "../../services/authService";

function Topbar({ onMenuClick }) {
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);

  const user = getAuthUser();

  const userName = user?.name || "User";
  const userRole = user?.role || "Unknown";

  const avatar = userName.charAt(0).toUpperCase();

  const handleChangePassword = () => {
    setProfileOpen(false);
    navigate("/change-password");
  };

  const handleLogout = () => {
    logoutUser();
    navigate("/login", { replace: true });
  };

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

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            className="topbar-profile cursor-pointer"
            aria-expanded={profileOpen}
            aria-haspopup="menu"
          >
            <div className="profile-avatar">{avatar}</div>

            <div className="profile-details">
              <strong>{userName}</strong>
              <span>
                {userRole.charAt(0).toUpperCase() +
                  userRole.slice(1)}
              </span>
            </div>

            <ChevronDown
              size={16}
              className={`transition-transform ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-2 shadow-xl"
              role="menu"
            >
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-semibold text-gray-800">
                  {userName}
                </p>
                <p className="text-xs capitalize text-gray-500">
                  {userRole}
                </p>
              </div>

              <button
                type="button"
                onClick={handleChangePassword}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 transition hover:bg-gray-100"
                role="menuitem"
              >
                <LockKeyhole size={17} />
                Change Password
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-600 transition hover:bg-red-50"
                role="menuitem"
              >
                <LogOut size={17} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
