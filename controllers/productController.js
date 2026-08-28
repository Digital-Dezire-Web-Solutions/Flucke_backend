const Product = require("../models/Product");
const slugify = require("slugify");
const uploadImage = require("../utils/uploadImage");

// Create Product
exports.createProduct = async (req, res) => {
  try {
    let imageUrls = [];

    if (req.files?.length) {
      for (const file of req.files) {
        const uploaded = await uploadImage(file.buffer, "products");

        imageUrls.push(uploaded.secure_url);
      }
    }

    const product = await Product.create({
      ...req.body,
      images: imageUrls,
      slug: slugify(req.body.name, { lower: true }),
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      product,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get All Products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      products,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Single Product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("createdBy", "firstName lastName");

    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    res.json({
      success: true,
      product,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Product
exports.updateProduct = async (req, res) => {
  try {
    const data = { ...req.body };

    if (req.body.name) {
      data.slug = slugify(req.body.name, {
        lower: true,
      });
    }

    if (req.files?.length) {
      let imageUrls = [];

      for (const file of req.files) {
        const uploaded = await uploadImage(file.buffer, "products");

        imageUrls.push(uploaded.secure_url);
      }

      data.images = imageUrls;
    }

    const product = await Product.findByIdAndUpdate(req.params.id, data, {
      new: true,
    });

    res.json({
      success: true,
      product,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Delete Product
exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Product deleted",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
