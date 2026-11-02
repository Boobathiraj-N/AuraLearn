
const express = require("express");
const router = express.Router();

const protect = require("../middleware/auth.middleware");
const authorizeRole = require("../middleware/role.middleware");

const {
  addLeadNote,
  getLeadNotes,
} = require("../controllers/leadNote.controller");

router.get(
  "/:leadId/notes",
  protect,
  authorizeRole("support", "sales"),
  getLeadNotes
);


router.post(
  "/:leadId/notes",
  protect,
  authorizeRole("support", "sales"),
  addLeadNote
);


module.exports = router;
