const express = require("express");
const protect = require("../middleware/auth.middleware");
const authorizeRole = require("../middleware/role.middleware");
const {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  updateStaffStatus,
} = require("../controllers/admin.controller");


const router = express.Router();

router.post("/staff", protect, authorizeRole("admin"), createStaff);
router.get("/staff", protect, authorizeRole("admin"), getAllStaff);
router.get("/staff/:id", protect, authorizeRole("admin"), getStaffById);
router.put(
  "/staff/:id",
  protect,
  authorizeRole("admin"),
  updateStaff
);
router.patch(
  "/staff/:id/status",
  protect,
  authorizeRole("admin"),
  updateStaffStatus
);

module.exports = router;