
const express = require("express");
const router = express.Router();

const protect = require("../middleware/auth.middleware");
const authorizeRole = require("../middleware/role.middleware");

const {
  createSubmission,
  getMySubmissions,
  getMySubmissionById,
} = require("../controllers/submission.controller");

// Submit code for a challenge
router.post(
  "/challenges/:challengeId",
  protect,
  authorizeRole("student"),
  createSubmission
);

// Get all submissions of the logged-in student
router.get(
  "/mine",
  protect,
  authorizeRole("student"),
  getMySubmissions
);

// Get one submission belonging to the logged-in student
router.get(
  "/mine/:id",
  protect,
  authorizeRole("student"),
  getMySubmissionById
);

module.exports = router;
