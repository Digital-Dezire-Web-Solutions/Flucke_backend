const Product = require("../models/Product");
const slugify = require("slugify");
const uploadImage = require("../utils/uploadImage");

// --- helpers ---------------------------------------------------------------

function parseArrayField(value) {
  if (value === undefined || value === null || value === "") return [];
  if (Array.isArray(value)) return value.map(String).map((v) => v.trim()).filter(Boolean);

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map(String).map((v) => v.trim()).filter(Boolean);
    }
  } catch (e) {
    // not JSON — fall through to comma-split
  }

  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

// FormData sends booleans as the strings "true"/"false", so a plain
// `Boolean(value)` would treat "false" as truthy — this handles that.
function parseBoolean(value, fallback = false) {
  if (value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  return value === "true" || value === "1";
}

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
      name: req.body.name,
      description: req.body.description,
      shortDescription: req.body.shortDescription || "",
      price: req.body.price,
      salePrice: req.body.salePrice || 0,
      stock: req.body.stock || 0,
      sizes: parseArrayField(req.body.sizes),
      benefits: parseArrayField(req.body.benefits ?? req.body.benefit),
      howToUse: req.body.howToUse ?? req.body.howtouse ?? "",
      ingredients: req.body.ingredients || "",
      isFeatured: parseBoolean(req.body.isFeatured, false),
      status: parseBoolean(req.body.status, true),
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
    const product = await Product.findById(req.params.id).populate(
      "createdBy",
      "firstName lastName",
    );

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
    const existing = await Product.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const data = {};

    if (req.body.name !== undefined) {
      data.name = req.body.name;
      data.slug = slugify(req.body.name, { lower: true });
    }
    if (req.body.description !== undefined) data.description = req.body.description;
    if (req.body.shortDescription !== undefined) data.shortDescription = req.body.shortDescription;
    if (req.body.price !== undefined) data.price = req.body.price;
    if (req.body.salePrice !== undefined) data.salePrice = req.body.salePrice;
    if (req.body.stock !== undefined) data.stock = req.body.stock;
    if (req.body.sizes !== undefined) data.sizes = parseArrayField(req.body.sizes);
    if (req.body.benefits !== undefined || req.body.benefit !== undefined) {
      data.benefits = parseArrayField(req.body.benefits ?? req.body.benefit);
    }
    if (req.body.howToUse !== undefined || req.body.howtouse !== undefined) {
      data.howToUse = req.body.howToUse ?? req.body.howtouse;
    }
    if (req.body.ingredients !== undefined) data.ingredients = req.body.ingredients;
    if (req.body.isFeatured !== undefined) data.isFeatured = parseBoolean(req.body.isFeatured);
    if (req.body.status !== undefined) data.status = parseBoolean(req.body.status);

    // --- Reconcile images --------------------------------------------------
    // The admin UI sends `imageOrder`, a JSON string like:
    //   [{ type: "existing", value: "<url>" }, { type: "new" }, { type: "existing", value: "<url>" }]
    // describing the final order the admin arranged (after any deletes/
    // drag-reorder). Newly uploaded files show up in req.files in the same
    // relative order as their "new" placeholders, so we zip them back
    // together here. Any existing URL missing from imageOrder was deleted
    // by the admin and is simply left out of the final array.
    if (req.body.imageOrder) {
      let order = [];
      try {
        order = JSON.parse(req.body.imageOrder);
      } catch (e) {
        order = [];
      }

      if (Array.isArray(order) && order.length) {
        let uploadedUrls = [];
        if (req.files?.length) {
          for (const file of req.files) {
            const uploaded = await uploadImage(file.buffer, "products");
            uploadedUrls.push(uploaded.secure_url);
          }
        }

        let newIndex = 0;
        data.images = order
          .map((entry) => {
            if (entry.type === "existing") return entry.value;
            const url = uploadedUrls[newIndex];
            newIndex += 1;
            return url;
          })
          .filter(Boolean);
      } else {
        // imageOrder was sent but empty — admin removed every image.
        data.images = [];
      }
    } else if (req.files?.length) {
      // Fallback for older clients that don't send imageOrder: behave like
      // before and just replace images with whatever was newly uploaded.
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