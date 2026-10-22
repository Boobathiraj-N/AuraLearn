const express = require("express");
const rateLimit = require("express-rate-limit");
const protect = require("../middleware/auth.middleware");


const {
  registerStudent,
  verifyStudentOtp,
  loginUser,
  activateStaff,
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
router.post("/login", loginUser);
router.post("/activate-staff", activateStaff);

router.get("/me", protect, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Authentication successful",
    user: req.user,
  });
});



module.exports = router;