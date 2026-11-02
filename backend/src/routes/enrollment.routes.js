const express = require("express");
const router = express.Router();

const { enrollCourse } = require("../controllers/enrollment.controller");
const protect = require("../middleware/auth.middleware");
const authorizeRole = require("../middleware/role.middleware");

router.post(
  "/",
  protect,
  authorizeRole("student"),
  enrollCourse
);

module.exports = router;