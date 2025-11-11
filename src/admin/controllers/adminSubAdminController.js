const Admin = require("../models/admin.model");
const AppError = require("../../errors/appError");

// Get all sub-admins
exports.getAllSubAdmins = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = "", role = "" } = req.query;
    const skip = (page - 1) * limit;

    // Build query - exclude super_admins and current admin
    const query = {
      _id: { $ne: req.admin._id }, // Exclude current admin
    };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      query.role = role;
    }

    const admins = await Admin.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate("createdBy", "fullName email")
      .select("-password -refreshTokens");

    const total = await Admin.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        admins,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get single sub-admin by ID
exports.getSubAdminById = async (req, res, next) => {
  try {
    const { adminId } = req.params;

    const admin = await Admin.findById(adminId)
      .populate("createdBy", "fullName email")
      .select("-password -refreshTokens");

    if (!admin) {
      return next(new AppError("Admin not found", 404));
    }

    // Don't allow viewing super admin details unless current user is super admin
    if (admin.role === "super_admin" && req.admin.role !== "super_admin") {
      return next(new AppError("Access denied", 403));
    }

    res.status(200).json({
      success: true,
      data: { admin },
    });
  } catch (error) {
    next(error);
  }
};

// Create new sub-admin
exports.createSubAdmin = async (req, res, next) => {
  try {
    const { fullName, email, password, role, permissions, phoneNumber } = req.body;

    // Check if current admin has permission to create admins
    if (!req.admin.permissions.admins.create && req.admin.role !== "super_admin") {
      return next(new AppError("Access denied: Cannot create admin accounts", 403));
    }

    // Only super admin can create other super admins
    if (role === "super_admin" && req.admin.role !== "super_admin") {
      return next(new AppError("Only super admins can create super admin accounts", 403));
    }

    // Check if email already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return next(new AppError("Email already exists", 400));
    }

    const newAdmin = new Admin({
      fullName,
      email,
      password,
      role: role || "admin",
      phoneNumber,
      createdBy: req.admin._id,
    });

    // Set default permissions based on role
    newAdmin.setDefaultPermissions();

    // Override with custom permissions if provided
    if (permissions) {
      newAdmin.permissions = { ...newAdmin.permissions, ...permissions };
    }

    await newAdmin.save();

    res.status(201).json({
      success: true,
      message: "Sub-admin created successfully",
      data: { admin: newAdmin },
    });
  } catch (error) {
    next(error);
  }
};

// Update sub-admin
exports.updateSubAdmin = async (req, res, next) => {
  try {
    const { adminId } = req.params;
    const { fullName, email, role, permissions, isActive, phoneNumber } = req.body;

    // Check if current admin has permission to edit admins
    if (!req.admin.permissions.admins.edit && req.admin.role !== "super_admin") {
      return next(new AppError("Access denied: Cannot edit admin accounts", 403));
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return next(new AppError("Admin not found", 404));
    }

    // Prevent editing super admin unless current user is super admin
    if (admin.role === "super_admin" && req.admin.role !== "super_admin") {
      return next(new AppError("Cannot edit super admin account", 403));
    }

    // Prevent non-super admins from promoting to super admin
    if (role === "super_admin" && req.admin.role !== "super_admin") {
      return next(new AppError("Only super admins can assign super admin role", 403));
    }

    // Update fields
    if (fullName) admin.fullName = fullName;
    if (email) admin.email = email;
    if (phoneNumber !== undefined) admin.phoneNumber = phoneNumber;
    if (isActive !== undefined) admin.isActive = isActive;

    if (role && role !== admin.role) {
      admin.role = role;
      admin.setDefaultPermissions(); // Reset to default permissions for new role
    }

    if (permissions) {
      admin.permissions = { ...admin.permissions, ...permissions };
    }

    await admin.save();

    res.status(200).json({
      success: true,
      message: "Sub-admin updated successfully",
      data: { admin },
    });
  } catch (error) {
    next(error);
  }
};

// Delete sub-admin
exports.deleteSubAdmin = async (req, res, next) => {
  try {
    const { adminId } = req.params;

    // Check if current admin has permission to delete admins
    if (!req.admin.permissions.admins.delete && req.admin.role !== "super_admin") {
      return next(new AppError("Access denied: Cannot delete admin accounts", 403));
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return next(new AppError("Admin not found", 404));
    }

    // Prevent deleting super admin unless current user is super admin
    if (admin.role === "super_admin" && req.admin.role !== "super_admin") {
      return next(new AppError("Cannot delete super admin account", 403));
    }

    // Prevent self-deletion
    if (admin._id.toString() === req.admin._id.toString()) {
      return next(new AppError("Cannot delete your own account", 400));
    }

    await Admin.findByIdAndDelete(adminId);

    res.status(200).json({
      success: true,
      message: "Sub-admin deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Update sub-admin permissions
exports.updateSubAdminPermissions = async (req, res, next) => {
  try {
    const { adminId } = req.params;
    const { permissions } = req.body;

    // Check if current admin has permission to edit admins
    if (!req.admin.permissions.admins.edit && req.admin.role !== "super_admin") {
      return next(new AppError("Access denied: Cannot modify permissions", 403));
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return next(new AppError("Admin not found", 404));
    }

    // Prevent editing super admin permissions unless current user is super admin
    if (admin.role === "super_admin" && req.admin.role !== "super_admin") {
      return next(new AppError("Cannot edit super admin permissions", 403));
    }

    admin.permissions = { ...admin.permissions, ...permissions };
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Permissions updated successfully",
      data: { admin },
    });
  } catch (error) {
    next(error);
  }
};

// Get admin statistics
exports.getAdminStats = async (req, res, next) => {
  try {
    const total = await Admin.countDocuments({ _id: { $ne: req.admin._id } });
    const active = await Admin.countDocuments({ 
      isActive: true, 
      _id: { $ne: req.admin._id } 
    });
    const inactive = await Admin.countDocuments({ 
      isActive: false, 
      _id: { $ne: req.admin._id } 
    });

    const roleStats = await Admin.aggregate([
      { $match: { _id: { $ne: req.admin._id } } },
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      }
    ]);

    const recentAdmins = await Admin.find({ _id: { $ne: req.admin._id } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("createdBy", "fullName")
      .select("fullName email role isActive createdAt");

    res.status(200).json({
      success: true,
      data: {
        total,
        active,
        inactive,
        roleStats,
        recentAdmins,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Reset sub-admin password
exports.resetSubAdminPassword = async (req, res, next) => {
  try {
    const { adminId } = req.params;
    const { newPassword } = req.body;

    // Check if current admin has permission to edit admins
    if (!req.admin.permissions.admins.edit && req.admin.role !== "super_admin") {
      return next(new AppError("Access denied: Cannot reset passwords", 403));
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return next(new AppError("Admin not found", 404));
    }

    // Prevent editing super admin unless current user is super admin
    if (admin.role === "super_admin" && req.admin.role !== "super_admin") {
      return next(new AppError("Cannot reset super admin password", 403));
    }

    admin.password = newPassword;
    admin.refreshTokens = []; // Clear all refresh tokens to force re-login
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    next(error);
  }
};