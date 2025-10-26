const jwt = require("jsonwebtoken");
const Admin = require("../models/admin.model");
const AppError = require("../../errors/appError");

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("Authorization token missing", 401));
    }

    const token = authHeader.split(" ")[1];
    
    if (!token) {
      return next(new AppError("Token not found", 401));
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET_KEY_JSON_WEB_TOKEN_LOGIN);
    } catch (err) {
      console.error("Token verification error:", err.message);
      return next(new AppError("Invalid or expired token", 401));
    }

    // Check if it's an admin token
    if (decoded.type !== "admin") {
      return next(new AppError("Access denied. Admin privileges required", 403));
    }

    // Verify admin exists and is active
    const admin = await Admin.findById(decoded._id);
    if (!admin) {
      return next(new AppError("Admin not found", 404));
    }

    if (!admin.isActive) {
      return next(new AppError("Admin account is deactivated", 403));
    }

    // Attach admin info to request
    req.admin = {
      _id: admin._id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
    };

    next();
  } catch (err) {
    console.error("Admin auth middleware error:", err);
    next(err);
  }
};

// Super admin check middleware (optional for future use)
const superAdminAuth = async (req, res, next) => {
  try {
    if (!req.admin) {
      return next(new AppError("Admin authentication required", 401));
    }

    const admin = await Admin.findById(req.admin._id);
    if (admin.role !== "super_admin") {
      return next(
        new AppError("Access denied. Super admin privileges required", 403)
      );
    }

    next();
  } catch (err) {
    console.error("Super admin auth middleware error:", err);
    next(err);
  }
};

module.exports = {
  adminAuth,
  superAdminAuth,
};
