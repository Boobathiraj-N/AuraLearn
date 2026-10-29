
const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
      minlength: 3,
      maxlength: 150,
    },

    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
    },

    description: {
      type: String,
      required: [true, "Course description is required"],
      trim: true,
    },

    introduction: {
      type: String,
      default: "",
      trim: true,
    },

    category: {
      type: String,
      required: [true, "Course category is required"],
      enum: [
        "Web Development",
        "Mobile App Development",
        "Programming",
        "AI & Machine Learning",
        "Data Science",
        "Cyber Security",
        "UI/UX Design",
        "Other",
      ],
    },

    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    thumbnail: {
      type: String,
      default: "",
      trim: true,
    },

    durationMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Free course = price is zero
courseSchema.virtual("isFree").get(function () {
  return this.price === 0;
});

courseSchema.set("toJSON", { virtuals: true });
courseSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Course", courseSchema);
