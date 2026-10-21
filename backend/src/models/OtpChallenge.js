const mongoose = require("mongoose");

const otpChallengeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    mobile: { type: String, required: true },
    profileType: {
      type: String,
      enum: ["student", "working", "fresher"],
      required: true,
    },
    otpHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// MongoDB automatically removes expired challenges eventually.
otpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("OtpChallenge", otpChallengeSchema);