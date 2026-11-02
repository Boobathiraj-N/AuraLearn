const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
      unique: true,
    },

    currentTeam: {
      type: String,
      enum: ["support", "sales"],
      default: "support",
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: [
        "new",
        "contacted",
        "follow_up",
        "completed",
        "interested",
        "payment_pending",
        "converted",
        "not_interested",
      ],
      default: "new",
    },

    temperature: {
      type: String,
      enum: ["cold", "warm"],
      default: "cold",
    },

    transferredAt: {
      type: Date,
      default: null,
    },

    convertedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

leadSchema.index({ assignedTo: 1, currentTeam: 1 });
leadSchema.index({ student: 1, course: 1 });

module.exports = mongoose.model("Lead", leadSchema);