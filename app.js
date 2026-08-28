require("dotenv").config();
const cron = require("node-cron");
const connectToMongo = require("./db");
connectToMongo();

const express = require("express");
const cors = require("cors");

// Connect to MongoDB
const app = express();
const PORT = process.env.PORT || 8045;

// Middleware
app.use(cors({ origin: "*" }));
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Available routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/coupons", require("./routes/couponRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));

app.get("/", (req, res) => {
  res.json({ message: "Hello MERN Stack! " });
});

// Start server
app.listen(PORT, () => {
  console.log(`flucke backend listening on port ${PORT}`);
});
