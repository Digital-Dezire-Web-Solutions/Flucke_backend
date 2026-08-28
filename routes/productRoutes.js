const express = require("express");
const router = express.Router();

const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const { admin } = require("../middleware/auth");
const fetchuser = require("../middleware/fetchUser");

router.post("/", fetchuser, admin, createProduct);
router.get("/", getProducts);
router.get("/:id", getProduct);
router.put("/:id", fetchuser, admin, updateProduct);
router.delete("/:id", fetchuser, admin, deleteProduct);

module.exports = router;