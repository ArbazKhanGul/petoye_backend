const jwt = require("jsonwebtoken");
const AppError = require("../errors/appError");
const User = require("../models/user.model");

module.exports = async function (req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("Authorization token missing", 401));
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return next(new AppError("Token not found", 401));
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return next(new AppError("Invalid or expired token", 401));
    }
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError("User not found", 401));
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
