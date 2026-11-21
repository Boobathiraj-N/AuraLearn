
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

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

import {
  getMyNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markGroupNotificationsAsRead,
} from "../../services/notificationService";

import { connectSocket } from "../../services/socketService";

function Topbar({ onMenuClick }) {
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const location = useLocation();

  const user = getAuthUser();

  const userName = user?.name || "User";
  const userRole = user?.role || "Unknown";

  const isSupport = userRole === "support";

  const avatar = userName.charAt(0).toUpperCase();

const fetchNotifications = async () => {
  if (!isSupport) return;

  try {
    const [notificationResponse, countResponse] = await Promise.all([
      getMyNotifications(),
      getUnreadCount(),
    ]);

    console.log("Notification response:", notificationResponse);
    console.log("Count response:", countResponse);
    console.log("Unread count:", countResponse.unreadCount);

    setNotifications(notificationResponse.data || []);
    setUnreadCount(countResponse.unreadCount || 0);
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
  }
};

useEffect(() => {
  if (!isSupport) return;

  const token = localStorage.getItem("authToken");
  if (!token) return;

  const socket = connectSocket(token);

  console.log("TOPBAR SOCKET:", socket.id);
  console.log("TOPBAR SOCKET CONNECTED:", socket.connected);

  const handleNewNotification = (data) => {
    console.log("TOPBAR EVENT RECEIVED:", data);
    fetchNotifications();
  };

  socket.on("new-notification", handleNewNotification);

  return () => {
    socket.off("new-notification", handleNewNotification);
  };
}, [isSupport]);

useEffect(() => {
  if (!isSupport) return;

  const groupMatch = location.pathname.match(
    /^\/support\/groups\/([^/]+)$/
  );

  const updateNotifications = async () => {
    if (groupMatch) {
      try {
        await markGroupNotificationsAsRead(groupMatch[1]);
      } catch (error) {
        console.error("Failed to mark group notifications as read:", error);
      }
    }

    await fetchNotifications();
  };

  updateNotifications();
}, [location.pathname, isSupport]);

  const handleNotificationToggle = async () => {
    const nextState = !notificationOpen;
    setNotificationOpen(nextState);

    if (nextState) {
      setNotificationLoading(true);
      await fetchNotifications();
      setNotificationLoading(false);
    }
  };

  const handleOpenNotification = async (notification) => {
    try {
      if (!notification.isRead) {
        await markNotificationAsRead(notification._id);
      }

      setNotifications((previous) =>
        previous.map((item) =>
          item._id === notification._id
            ? { ...item, isRead: true }
            : item
        )
      );

      if (!notification.isRead) {
        setUnreadCount((previous) => Math.max(0, previous - 1));
      }

      setNotificationOpen(false);

      if (notification.group?._id) {
        navigate(`/support/groups/${notification.group._id}`);
      }
    } catch (error) {
      console.error("Failed to open notification:", error);
      await fetchNotifications();

      if (notification.group?._id) {
        navigate(`/support/groups/${notification.group._id}`);
      }
    }
  };

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
        {/* Support Notifications */}
        {isSupport ? (
          <div className="relative">
            <div className="relative inline-flex">
              <button
                type="button"
                onClick={handleNotificationToggle}
                className="notification-button"
                aria-label="Notifications"
              >
                <Bell size={20} />
              </button>

              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 z-20 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[9px] font-bold leading-none text-white shadow-sm pointer-events-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>

            {notificationOpen && (
              <div className="absolute right-0 top-14 z-50 w-80 overflow-hidden rounded-xl border border-white/10 bg-[#18181b] shadow-2xl sm:w-96">
                <div className="border-b border-white/10 px-4 py-3">
                  <h3 className="font-semibold text-white">
                    Notifications
                  </h3>

                  <p className="mt-1 text-xs text-gray-400">
                    {unreadCount} unread messages
                  </p>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notificationLoading ? (
                    <p className="p-5 text-center text-sm text-gray-400">
                      Loading notifications...
                    </p>
                  ) : notifications.length === 0 ? (
                    <p className="p-5 text-center text-sm text-gray-400">
                      No notifications yet.
                    </p>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification._id}
                        type="button"
                        onClick={() =>
                          handleOpenNotification(notification)
                        }
                        className={`w-full border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/5 ${
                          !notification.isRead
                            ? "bg-violet-500/10"
                            : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-violet-300">
                            {notification.sender?.name?.charAt(0) || "U"}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-white">
                                {notification.sender?.name || "Student"}
                              </p>

                              <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
                                🎓 Student
                              </span>
                            </div>

                            <p className="mt-1 truncate text-xs text-gray-400">
                              {notification.message?.messageType === "image"
                                ? "📷 Sent an image"
                                : notification.message?.content || "New message"}
                            </p>

                            <p className="mt-1 text-xs text-violet-400">
                              {notification.group?.name || "Course Group"}
                            </p>
                          </div>

                          {!notification.isRead && (
                            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-violet-400" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleNotificationToggle}
            className="notification-button relative"
            aria-label="Notifications"
          >
            <Bell size={20} />

            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[9px] font-bold leading-none text-white shadow-sm">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          
        )}

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
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
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
