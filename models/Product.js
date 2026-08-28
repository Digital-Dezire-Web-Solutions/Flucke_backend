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

    description: {
      type: String,
      required: true,
    },

    // category: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Category",
    //   required: true,
    // },

    brand: {
      type: String,
      default: "",
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
    sku: {
      type: String,
      unique: true,
    },

    ingredients: {
      type: String,
      default: "",
    },

    benefits: [
      {
        type: String,
      },
    ],

    howToUse: {
      type: String,
      default: "",
    },

    skinType: [
      {
        type: String,
      },
    ],

    tags: [
      {
        type: String,
      },
    ],

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
