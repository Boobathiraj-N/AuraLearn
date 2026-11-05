const express = require("express");
const router = express.Router();

const {
  getPublishedCourses,
  getPublicCourseDetails,
} = require("../controllers/course.controller");

// Public route - no authentication required
router.get("/", getPublishedCourses);

// GET PUBLIC COURSE DETAILS WITH FREE PREVIEW
router.get("/:id/details", getPublicCourseDetails);

module.exports = router;