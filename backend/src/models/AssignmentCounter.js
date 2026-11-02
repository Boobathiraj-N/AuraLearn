const mongoose = require("mongoose");

const assignmentCounterSchema = new mongoose.Schema(
  {
    team: {
      type: String,
      enum: ["support", "sales"],
      required: true,
      unique: true,
    },

    lastAssignedIndex: {
      type: Number,
      default: -1,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "AssignmentCounter",
  assignmentCounterSchema
);