const jwt = require("jsonwebtoken");
const AppError = require("../errors/appError");
const AdminSession = require("../models/adminSession.model");
const Admin = require("../models/admin.model");

const adminAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("Admin authorization token missing", 401));
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return next(new AppError("Admin token not found", 401));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET_KEY_JSON_WEB_TOKEN_LOGIN);
    } catch (err) {
      console.error("Admin token verification error:", err.message);
      return next(new AppError("Invalid or expired admin token", 401));
    }

    // Check if token type is admin
    if (decoded.type !== "admin") {
      return next(new AppError("Invalid token type", 401));
    }

    // Check admin session
    const session = await AdminSession.findOne({
      adminId: decoded._id,
      authToken: token,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return next(new AppError("Admin session invalid or expired", 401));
    }

    // Get admin details
    const admin = await Admin.findById(decoded._id).select("-password -refreshTokens");
    if (!admin) {
      return next(new AppError("Admin not found", 401));
    }

    if (!admin.isActive) {
      return next(new AppError("Admin account is inactive", 401));
    }

    // Update last activity
    session.lastActivity = new Date();
    await session.save();

    // Set admin in request
    req.admin = admin;
    req.adminSession = session;
    next();
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    next(new AppError("Admin authentication failed", 500));
  }
};

// Middleware to check specific permissions
const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return next(new AppError("Admin authentication required", 401));
    }

    // Super admin has all permissions
    if (req.admin.role === "super_admin") {
      return next();
    }

    // Check if admin has the required permission
    if (!req.admin.permissions.includes(requiredPermission)) {
      return next(new AppError(`Permission '${requiredPermission}' required`, 403));
    }

    next();
  };
};

// Middleware to check admin role
const checkRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return next(new AppError("Admin authentication required", 401));
    }

    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    if (!roles.includes(req.admin.role)) {
      return next(new AppError(`Role '${roles.join(" or ")}' required`, 403));
    }

    next();
  };
};

module.exports = {
  adminAuthMiddleware,
  checkPermission,
  checkRole,
};
