const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const sendEmail = require("../utils/sendEmail");

const STATUS_MESSAGES = {
  Pending: "Your order has been placed and is waiting for confirmation.",
  Confirmed: "Your order has been confirmed and is being prepared.",
  Packed: "Your order has been packed and is ready for dispatch.",
  Shipped: "Your order is on its way!",
  Delivered: "Your order has been delivered. We hope you love it!",
  Cancelled:
    "Your order has been cancelled. We will initiate your payment within 24hrs",
};

async function notifyAdminOfNewOrder(orderId) {
  try {
    const order = await Order.findById(orderId)
      .populate("user", "name email phone")
      .populate("products.product", "name");

    if (!order) return;

    const addr = order.shippingAddress || {};

    const itemsHtml = order.products
      .map(
        (item) =>
          `<li>${item.product?.name || "Product"} &times; ${item.quantity} — ₹${item.price}</li>`,
      )
      .join("");

    await sendEmail({
      to: process.env.SMTP_USER,
      subject: `New Order — ${order.orderNumber}`,
      html: `
        <p>A new order has been placed.</p>
 
        <p>
          <strong>Order:</strong> ${order.orderNumber}<br/>
          <strong>Payment:</strong> ${order.paymentMethod} (${order.paymentStatus})
        </p>
 
        <h3>Customer</h3>
        <p>
          Name: ${addr.fullName || order.user?.name || "—"}<br/>
          Phone: ${addr.phone || order.user?.phone || "—"}<br/>
          Email: ${order.user?.email || "—"}
        </p>
 
        <h3>Shipping Address</h3>
        <p>
          ${addr.house ? addr.house + "<br/>" : ""}
          ${addr.area ? addr.area + "<br/>" : ""}
          ${addr.city || ""}${addr.state ? ", " + addr.state : ""}<br/>
          ${addr.country || ""}${addr.pincode ? " - " + addr.pincode : ""}
        </p>
 
        <h3>Items</h3>
        <ul>${itemsHtml}</ul>
 
        <p>
          Subtotal: ₹${order.subtotal}<br/>
          Discount: ₹${order.discount || 0}<br/>
          Shipping: ₹${order.shippingCharge || 0}<br/>
          <strong>Total: ₹${order.total}</strong>
        </p>
      `,
    });
  } catch (mailErr) {
    console.error("New-order admin email failed:", mailErr.message);
  }
}

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
    await notifyAdminOfNewOrder(order._id);

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
    const { orderStatus, orderNote } = req.body;

    const order = await Order.findById(req.params.id).populate(
      "user",
      "firstName lastName email",
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.orderStatus = orderStatus;
    if (orderNote !== undefined) order.orderNote = orderNote;

    if (orderStatus === "Delivered") {
      order.deliveredAt = new Date();
    }

    await order.save();
    // A failed email shouldn't roll back or fail the status update itself —
    // the order state change is the important part, the email is a courtesy.
    if (order.user?.email) {
      try {
        await sendEmail({
          to: order.user.email,
          subject: `Order ${order.orderNumber} — ${orderStatus}`,
          html: `
            <p>Hi ${order.user.name || "there"},</p>
            <p>${
              STATUS_MESSAGES[orderStatus] ||
              `Your order status has been updated to ${orderStatus}.`
            }</p>
            ${order.orderNote ? `<p>Note from us: ${order.orderNote}</p>` : ""}
            <p>Order number: <strong>${order.orderNumber}</strong></p>
            <p>Flucke Skincare</p>
          `,
        });
      } catch (mailErr) {
        console.error("Order status email failed:", mailErr.message);
      }
    }

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
    console.log(err);
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

    await notifyAdminOfNewOrder(order._id);

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
