
const express = require("express");
const router = express.Router();

const protect = require("../middleware/auth.middleware");
const authorizeRole = require("../middleware/role.middleware");

const {
  getCourseProgress,
  completeLesson,
  getCourseCertificate,
  downloadCourseCertificate,
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

// Certificate 
router.get(
  "/courses/:courseId/certificate",
  protect,
  authorizeRole("student"),
  getCourseCertificate
);

// Download course certificate PDF
router.get(
  "/courses/:courseId/certificate/download",
  protect,
  authorizeRole("student"),
  downloadCourseCertificate
);

module.exports = router;
