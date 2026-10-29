
const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload.middleware");
const { uploadImage } = require("../controllers/upload.controller");
const protect = require("../middleware/auth.middleware");
const authorizeRole = require("../middleware/role.middleware");

router.post(
  "/image",
  protect,
  authorizeRole("admin"),
  upload.single("image"),
  uploadImage
);

module.exports = router;
