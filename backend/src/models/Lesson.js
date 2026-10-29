
const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: [true, "Module ID is required"],
    },

    title: {
      type: String,
      required: [true, "Lesson title is required"],
      trim: true,
      minlength: 3,
      maxlength: 150,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    videoUrl: {
      type: String,
      default: "",
      trim: true,
    },

    durationMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    order: {
      type: Number,
      required: true,
      min: 1,
    },

    isFreePreview: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
  },
  { timestamps: true }
);

// Avoid duplicate lesson positions inside the same module
lessonSchema.index({ module: 1, order: 1 }, { unique: true });

module.exports = mongoose.model("Lesson", lessonSchema);
