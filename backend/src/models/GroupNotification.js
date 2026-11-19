
const mongoose = require("mongoose");

const groupNotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseGroup",
      required: true,
    },

    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroupMessage",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    notificationType: {
      type: String,
      enum: ["new_message"],
      default: "new_message",
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Efficiently fetch unread notifications
groupNotificationSchema.index({
  recipient: 1,
  isRead: 1,
  createdAt: -1,
});

// Prevent duplicate notifications for the same message
groupNotificationSchema.index(
  { recipient: 1, message: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "GroupNotification",
  groupNotificationSchema
);
