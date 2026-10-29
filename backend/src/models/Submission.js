
const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challenge",
      required: true,
    },

    code: {
      type: String,
      required: [true, "Submitted code is required"],
    },

    language: {
      type: String,
      enum: ["javascript", "python", "java", "cpp"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "error"],
      default: "pending",
    },

    passedTestCases: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalTestCases: {
      type: Number,
      default: 0,
      min: 0,
    },

    pointsAwarded: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

submissionSchema.index({ student: 1, challenge: 1 });

module.exports = mongoose.model("Submission", submissionSchema);
