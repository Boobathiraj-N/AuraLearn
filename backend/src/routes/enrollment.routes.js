const express = require("express");
const router = express.Router();

const {
  enrollCourse,
  getMyCourses,
  getEnrolledCourseContent,
} = require("../controllers/enrollment.controller");

const protect = require("../middleware/auth.middleware");
const authorizeRole = require("../middleware/role.middleware");

router.get(
  "/my-courses",
  protect,
  authorizeRole("student"),
  getMyCourses
);

// GET ENROLLED COURSE CONTENT
router.get(
  "/my-courses/:courseId/content",
  protect,
  authorizeRole("student"),
  getEnrolledCourseContent
);

router.post(
  "/",
  protect,
  authorizeRole("student"),
  enrollCourse
);

module.exports = router;