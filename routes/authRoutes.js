const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  getProfile,
  updateProfile,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,

  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/authController");

const { admin } = require("../middleware/auth");
const fetchuser = require("../middleware/fetchUser");

// Public
router.post("/signup", signup);
router.post("/login", login);

// Customer
router.get("/profile", fetchuser, getProfile);
router.put("/profile", fetchuser, updateProfile);

// Admin
router.get("/", fetchuser, admin, getUsers);
router.get("/:id", fetchuser, admin, getUserById);
router.put("/:id", fetchuser, admin, updateUser);
router.delete("/:id", fetchuser, admin, deleteUser);

// address
router.post("/addresses", fetchuser, addAddress);
router.put("/addresses/:addressId", fetchuser, updateAddress);
router.delete("/addresses/:addressId", fetchuser, deleteAddress);
router.put("/addresses/default/:addressId", fetchuser, setDefaultAddress);

module.exports = router;
