const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      required: true,
    },

    shortDescription: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      required: true,
    },

    images: [
      {
        type: String,
      },
    ],

    price: {
      type: Number,
      required: true,
    },

    salePrice: {
      type: Number,
      default: 0,
    },

    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    sizes: [
      {
        type: String,
      },
    ],
    benefits: [
      {
        type: String,
      },
    ],
    howToUse: {
      type: String,
      default: "",
    },

    ingredients: {
      type: String,
      default: "",
    },
    amazonLink: {
      type: String,
      default: "",
    },

    // Maintained automatically by the review system (see reviewController) —
    // don't set these directly from the admin form.
    rating: {
      type: Number,
      default: 0,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    status: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Product", productSchema);