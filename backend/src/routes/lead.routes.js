const express = require("express");
const router = express.Router();

const protect = require("../middleware/auth.middleware");
const authorizeRole = require("../middleware/role.middleware");

const {
  getMyLeads,
  updateLeadStatus,
} = require("../controllers/lead.controller");

// Support and Sales - view assigned leads
router.get(
  "/my-leads",
  protect,
  authorizeRole("support", "sales"),
  getMyLeads
);

router.patch(
  "/:leadId",
  protect,
  authorizeRole("support", "sales"),
  updateLeadStatus
);

module.exports = router;