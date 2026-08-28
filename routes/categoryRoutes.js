const express = require("express");
const router = express.Router();

const {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const { admin } = require("../middleware/auth");
const fetchuser = require("../middleware/fetchUser");

router.post("/", fetchuser, admin, createCategory);
router.get("/", getCategories);
router.get("/:id", getCategory);
router.put("/:id", fetchuser, admin, updateCategory);
router.delete("/:id", fetchuser, admin, deleteCategory);

module.exports = router;