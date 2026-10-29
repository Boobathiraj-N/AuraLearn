
const mongoose = require("mongoose");

const challengeSchema = new mongoose.Schema(
  {
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: [true, "Lesson ID is required"],
    },

    title: {
      type: String,
      required: [true, "Challenge title is required"],
      trim: true,
      minlength: 3,
      maxlength: 150,
    },

    description: {
      type: String,
      required: [true, "Challenge description is required"],
      trim: true,
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Easy",
    },

    language: {
      type: String,
      enum: ["javascript", "python", "java", "cpp"],
      default: "javascript",
    },

    starterCode: {
      type: String,
      default: "",
    },

    testCases: [
      {
        input: {
          type: String,
          default: "",
        },
        expectedOutput: {
          type: String,
          required: true,
        },
        isHidden: {
          type: Boolean,
          default: false,
        },
      },
    ],

    points: {
      type: Number,
      default: 10,
      min: 0,
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Challenge", challengeSchema);
