
const mongoose = require("mongoose");

const groupMembershipSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseGroup",
      required: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    lastReadAt: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// One student can join a group only once
groupMembershipSchema.index(
  { group: 1, student: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "GroupMembership",
  groupMembershipSchema
);
