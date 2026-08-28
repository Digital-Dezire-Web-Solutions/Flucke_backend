const express = require("express");
const router = express.Router();

const {
  createCoupon,
  getCoupons,
  getCoupon,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
} = require("../controllers/couponController");

const { admin } = require("../middleware/auth");
const fetchuser = require("../middleware/fetchUser");

// Admin
router.post("/", fetchuser, admin, createCoupon);
router.get("/", fetchuser, admin, getCoupons);
router.get("/:id", fetchuser, admin, getCoupon);
router.put("/:id", fetchuser, admin, updateCoupon);
router.delete("/:id", fetchuser, admin, deleteCoupon);

// Customer
router.post("/apply", fetchuser, applyCoupon);

module.exports = router;