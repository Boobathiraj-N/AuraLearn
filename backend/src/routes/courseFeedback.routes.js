const express = require("express");
const router = express.Router();

const protect = require("../middleware/auth.middleware");
const authorizeRole = require("../middleware/role.middleware");

const {
  submitCourseFeedback,
  getCourseFeedback,
  getPendingCourseFeedback,
} = require("../controllers/courseFeedback.controller");

// Get pending course feedback
router.get(
  "/pending",
  protect,
  authorizeRole("student"),
  getPendingCourseFeedback
);

// Submit course feedback
router.post(
  "/:courseId",
  protect,
  authorizeRole("student"),
  submitCourseFeedback
);

// Get course feedback
router.get(
  "/:courseId",
  getCourseFeedback
);

module.exports = router;