
const express = require("express");
const router = express.Router();

const {
  getMyGroups,
  getGroupMessages,
  sendGroupMessage,
} = require("../controllers/group.controller");

const protect = require("../middleware/auth.middleware");
const authorizeRole = require("../middleware/role.middleware");

router.get(
  "/my-groups",
  protect,
  authorizeRole("student"),
  getMyGroups
);

router.get(
  "/:groupId/messages",
  protect,
  authorizeRole("student"),
  getGroupMessages
);

router.post(
  "/:groupId/messages",
  protect,
  authorizeRole("student"),
  sendGroupMessage
);

module.exports = router;
