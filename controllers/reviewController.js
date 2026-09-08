const Review = require("../models/Review");
const Product = require("../models/Product");

async function recalculateProductRating(productId) {
  const stats = await Review.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: "$product",
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const { avgRating = 0, count = 0 } = stats[0] || {};

  await Product.findByIdAndUpdate(productId, {
    rating: Math.round(avgRating * 10) / 10, // one decimal place
    totalReviews: count,
  });
}

// Create the logged-in user's review for a product, or update it if they
// already left one (upsert on the product+user unique index).
exports.createOrUpdateReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const review = await Review.findOneAndUpdate(
      { product: productId, user: req.user._id },
      { rating, comment, product: productId, user: req.user._id },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    await recalculateProductRating(productId);

    res.status(201).json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// All reviews for a product (product page display)
exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate("user", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Owner can delete their own review
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const productId = review.product;
    await review.deleteOne();
    await recalculateProductRating(productId);

    res.json({ success: true, message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin moderation — remove any review (e.g. spam/abuse)
exports.adminDeleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    const productId = review.product;
    await review.deleteOne();
    await recalculateProductRating(productId);

    res.json({ success: true, message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};