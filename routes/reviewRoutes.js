const express = require("express");
const router = express.Router();

const {
  createOrUpdateReview,
  getProductReviews,
  deleteReview,
  adminDeleteReview,
} = require("../controllers/reviewController");

const fetchuser = require("../middleware/fetchUser");
const { admin } = require("../middleware/auth");

router.get("/:productId", getProductReviews);
router.post("/:productId", fetchuser, createOrUpdateReview);
router.delete("/:id", fetchuser, deleteReview);
router.delete("/admin/:id", fetchuser, admin, adminDeleteReview);

module.exports = router;