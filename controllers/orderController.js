const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const crypto = require("crypto");
const razorpay = require("../config/razorpay");

// Create Order
exports.createOrder = async (req, res) => {
  try {
    const { products, shippingAddress, paymentMethod, couponCode } = req.body;

    let subtotal = 0;

    for (const item of products) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      subtotal +=
        product.salePrice > 0
          ? product.salePrice * item.quantity
          : product.price * item.quantity;
    }

    let discount = 0;
    let couponId = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        active: true,
      });

      if (coupon && coupon.expiryDate > new Date()) {
        couponId = coupon._id;

        if (coupon.discountType === "percentage") {
          discount = (subtotal * coupon.discountValue) / 100;

          if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
            discount = coupon.maximumDiscount;
          }
        } else {
          discount = coupon.discountValue;
        }

        coupon.usedCount += 1;
        await coupon.save();
      }
    }

    const shippingCharge = subtotal >= 999 ? 0 : 0;

    const total = subtotal - discount + shippingCharge;

    const order = await Order.create({
      orderNumber: "ORD" + Date.now(),

      user: req.user._id,

      products,

      shippingAddress,

      paymentMethod,

      subtotal,

      discount,

      shippingCharge,

      total,

      coupon: couponId,
    });

    res.status(201).json({
      success: true,
      order,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get All Orders
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "firstName lastName email")
      .populate("products.product")
      .populate("coupon")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get My Orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
    })
      .populate("products.product")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get Single Order
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user")
      .populate("products.product")
      .populate("coupon");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Update Order Status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.orderStatus = orderStatus;

    if (orderStatus === "Delivered") {
      order.deliveredAt = new Date();
    }

    await order.save();

    res.json({
      success: true,
      message: "Order updated",
      order,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Delete Order
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      message: "Order deleted",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
    } = req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }
    let subtotal = 0;
    for (const item of orderData.products) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }
      subtotal +=
        (product.salePrice > 0 ? product.salePrice : product.price) *
        item.quantity;
    }
    let discount = 0;
    let couponId = null;
    if (orderData.couponCode) {
      const coupon = await Coupon.findOne({
        code: orderData.couponCode.toUpperCase(),
        active: true,
      });
      if (coupon && coupon.expiryDate > new Date()) {
        couponId = coupon._id;
        if (coupon.discountType === "percentage") {
          discount = (subtotal * coupon.discountValue) / 100;
          if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
            discount = coupon.maximumDiscount;
          }
        } else {
          discount = coupon.discountValue;
        }
        coupon.usedCount += 1;
        await coupon.save();
      }
    }
    const shippingCharge = subtotal >= 999 ? 0 : 0;
    const total = subtotal - discount + shippingCharge;
    const order = await Order.create({
      orderNumber: "ORD" + Date.now(),
      user: req.user._id,
      products: orderData.products,
      shippingAddress: orderData.shippingAddress,
      paymentMethod: "Razorpay",
      paymentStatus: "Paid",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      subtotal,
      discount,
      shippingCharge,
      total,
      coupon: couponId,
    });

    res.json({
      success: true,
      order,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
