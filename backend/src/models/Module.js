
const mongoose = require("mongoose");

const moduleSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course ID is required"],
    },

    title: {
      type: String,
      required: [true, "Module title is required"],
      trim: true,
      minlength: 3,
      maxlength: 150,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    order: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
  },
  { timestamps: true }
);

// Prevent duplicate module positions within the same course
moduleSchema.index({ course: 1, order: 1 }, { unique: true });

module.exports = mongoose.model("Module", moduleSchema);
