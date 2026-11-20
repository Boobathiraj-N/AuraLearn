
const express = require("express");
const router = express.Router();

const protect = require("../middleware/auth.middleware");
const {
  getMyNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  markGroupNotificationsAsRead,
} = require("../controllers/notification.controller");
// Get all notifications
router.get("/", protect, getMyNotifications);

// Get unread notification count
router.get("/unread-count", protect, getUnreadCount);

// Mark all notifications as read
router.patch("/read-all", protect, markAllNotificationsAsRead);

// Mark single notification as read
router.patch("/:notificationId/read", protect, markNotificationAsRead);

router.patch(
  "/groups/:groupId/read",
  protect,
  markGroupNotificationsAsRead
);

module.exports = router;
