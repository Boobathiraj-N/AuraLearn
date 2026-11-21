const express = require("express");
const router = express.Router();

const protect = require("../middleware/auth.middleware");
const authorizeRole = require("../middleware/role.middleware");

const {
  createPaymentOrder,
  verifyPayment,
  getMyPurchases,
} = require("../controllers/payment.controller");

router.get(
  "/my-purchases",
  protect,
  authorizeRole("student"),
  getMyPurchases
);

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