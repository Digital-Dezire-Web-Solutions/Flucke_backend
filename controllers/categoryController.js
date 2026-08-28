const Category = require("../models/Category");
const slugify = require("slugify");

// Create Category
exports.createCategory = async (req, res) => {
  try {
    const { name, description, image } = req.body;

    const exists = await Category.findOne({ name });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    const category = await Category.create({
      name,
      slug: slugify(name, { lower: true }),
      description,
      image,
    });

    res.status(201).json({
      success: true,
      category,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get All Categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      categories,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Single Category
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category)
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });

    res.json({
      success: true,
      category,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Category
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, image, status } = req.body;

    const category = await Category.findById(req.params.id);

    if (!category)
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });

    if (name) {
      category.name = name;
      category.slug = slugify(name, { lower: true });
    }

    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (typeof status === "boolean") category.status = status;

    await category.save();

    res.json({
      success: true,
      message: "Category updated",
      category,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete Category
exports.deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Category deleted",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
