
const express = require("express");
const router = express.Router();

const {
  getMyGroups,
  getMySupportGroups,
  getGroupMessages,
  sendGroupMessage,
  uploadGroupImage,
  assignSupportToGroup,
} = require("../controllers/group.controller");

const protect = require("../middleware/auth.middleware");
const authorizeRole = require("../middleware/role.middleware");
const upload = require("../middleware/upload.middleware");

router.get(
  "/my-groups",
  protect,
  authorizeRole("student"),
  getMyGroups
);

router.get(
  "/my-support-groups",
  protect,
  authorizeRole("support"),
  getMySupportGroups
);

router.get(
  "/:groupId/messages",
  protect,
  authorizeRole("student", "support"),
  getGroupMessages
);

router.post(
  "/:groupId/messages",
  protect,
  authorizeRole("student", "support"),
  sendGroupMessage
);

router.post(
  "/:groupId/images",
  protect,
  upload.single("image"),
  uploadGroupImage
);

// Admin assigns support staff to a course group
router.patch(
  "/:groupId/assign-support",
  protect,
  authorizeRole("admin"),
  assignSupportToGroup
);

module.exports = router;
