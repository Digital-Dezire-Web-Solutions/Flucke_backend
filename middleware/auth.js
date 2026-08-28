const jwt = require("jsonwebtoken");
const User = require("../models/User");

const admin = (req, res, next) => {
  if (req.user.role === "admin") {
    return next();
  }

  return res.status(403).json({
    message: "Admin access only",
  });
};

module.exports = {
  admin,
};
