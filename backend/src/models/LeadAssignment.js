const mongoose = require("mongoose");

const leadAssignmentSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    team: {
      type: String,
      enum: ["support", "sales"],
      required: true,
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reason: {
      type: String,
      enum: ["initial_assignment", "team_transfer", "manual_reassignment"],
      required: true,
    },

    assignedAt: {
      type: Date,
      default: Date.now,
    },

    endedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

leadAssignmentSchema.index({ lead: 1, assignedAt: -1 });

module.exports = mongoose.model(
  "LeadAssignment",
  leadAssignmentSchema
);