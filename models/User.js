const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    house: String,
    area: String,
    city: String,
    state: String,
    country: String,
    pincode: String,
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    phone: {
      type: String,
      //   unique: true,
      //   sparse: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },

    avatar: {
      type: String,
      default: "",
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    addresses: [addressSchema],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
