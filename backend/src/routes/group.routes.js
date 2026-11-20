
const express = require("express");
const router = express.Router();

const {
  getMyGroups,
  getGroupMessages,
  sendGroupMessage,
  uploadGroupImage,
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

router.post(
  "/:groupId/images",
  protect,
  upload.single("image"),
  uploadGroupImage
);

module.exports = router;
