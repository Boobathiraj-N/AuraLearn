const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    profileType: {
      type: String,
      enum: ["student", "working", "fresher"],
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "support", "sales", "admin"],
      default: "student",
      immutable: true,
    },
    isMobileVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    activationTokenHash: {
      type: String,
      select: false,
    },
    activationTokenExpiry: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);