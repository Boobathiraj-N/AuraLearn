
const express = require("express");
const router = express.Router();

const protect = require("../middleware/auth.middleware");
const authorizeRole = require("../middleware/role.middleware");

const {
  getCourseProgress,
  completeLesson,
} = require("../controllers/progress.controller");

// Get logged-in student's course progress
router.get(
  "/courses/:courseId",
  protect,
  authorizeRole("student"),
  getCourseProgress
);

// Mark a lesson as completed
router.patch(
  "/courses/:courseId/lessons/:lessonId/complete",
  protect,
  authorizeRole("student"),
  completeLesson
);

module.exports = router;
