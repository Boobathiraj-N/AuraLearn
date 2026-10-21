const express = require("express");
const protect = require("../middleware/auth.middleware");
const authorizeRole = require("../middleware/role.middleware");
const { createStaff } = require("../controllers/admin.controller");

const router = express.Router();

router.post("/staff", protect, authorizeRole("admin"), createStaff);

module.exports = router;