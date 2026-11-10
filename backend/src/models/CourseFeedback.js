const mongoose = require("mongoose");

const courseFeedbackSchema = new mongoose.Schema(
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

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    review: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  { timestamps: true }
);

// One student can submit only one feedback per course
courseFeedbackSchema.index(
  { student: 1, course: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "CourseFeedback",
  courseFeedbackSchema
);