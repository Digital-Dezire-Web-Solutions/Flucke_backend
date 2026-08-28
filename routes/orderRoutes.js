const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrders,
  getOrder,
  getMyOrders,
  updateOrderStatus,
  deleteOrder,
} = require("../controllers/orderController");

const { admin } = require("../middleware/auth");
const fetchuser = require("../middleware/fetchUser");

// Customer
router.post("/", fetchuser, createOrder);
router.get("/my-orders", fetchuser, getMyOrders);

// Admin
router.get("/", fetchuser, admin, getOrders);
router.get("/:id", fetchuser, admin, getOrder);
router.put("/:id/status", fetchuser, admin, updateOrderStatus);
router.delete("/:id", fetchuser, admin, deleteOrder);

module.exports = router;