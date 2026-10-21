const express = require("express");
const rateLimit = require("express-rate-limit");

const {
  registerStudent,
  verifyStudentOtp,
} = require("../controllers/auth.controller");

const router = express.Router();

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many registration requests. Try again later.",
  },
});

const otpVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP verification requests. Try again later.",
  },
});

router.post("/register", registrationLimiter, registerStudent);
router.post("/verify-otp", otpVerificationLimiter, verifyStudentOtp);

module.exports = router;