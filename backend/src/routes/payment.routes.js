const express = require("express");
const router = express.Router();

const protect = require("../middleware/auth.middleware");
const authorizeRole = require("../middleware/role.middleware");

const {
  createPaymentOrder,
  verifyPayment,
} = require("../controllers/payment.controller");

router.post(
  "/create-order",
  protect,
  authorizeRole("student"),
  createPaymentOrder
);

router.post(
  "/verify",
  protect,
  authorizeRole("student"),
  verifyPayment
);

module.exports = router;