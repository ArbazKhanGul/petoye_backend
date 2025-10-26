const Admin = require("../models/admin.model");
const SessionToken = require("../../models/sessionToken.model");
const AppError = require("../../errors/appError");

// Admin Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return next(new AppError("Invalid email or password", 401));
    }

    // Check if admin is active
    if (!admin.isActive) {
      return next(new AppError("Admin account is deactivated", 403));
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return next(new AppError("Invalid email or password", 401));
    }

    // Generate tokens
    const authToken = admin.generateAuthToken();
    const refreshToken = admin.generateRefreshToken();

    // Save refresh token
    admin.refreshTokens.push(refreshToken);
    admin.lastLogin = new Date();
    await admin.save();

    // Create session token record
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await SessionToken.create({
      userId: admin._id,
      authToken,
      refreshToken,
      expiresAt,
      userType: "admin",
    });

    res.status(200).json({
      success: true,
      message: "Admin logged in successfully",
      data: {
        admin,
        authToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin Logout
exports.logout = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("Authorization token missing", 401));
    }

    const token = authHeader.split(" ")[1];

    // Revoke session token
    await SessionToken.findOneAndUpdate(
      { authToken: token, userId: req.admin._id },
      { revoked: true }
    );

    // Remove refresh token from admin
    const admin = await Admin.findById(req.admin._id);
    if (admin) {
      const session = await SessionToken.findOne({ authToken: token });
      if (session) {
        admin.refreshTokens = admin.refreshTokens.filter(
          (rt) => rt !== session.refreshToken
        );
        await admin.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Admin logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get Admin Profile
exports.getProfile = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return next(new AppError("Admin not found", 404));
    }

    res.status(200).json({
      success: true,
      data: { admin },
    });
  } catch (error) {
    next(error);
  }
};

// Update Admin Profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { fullName, phoneNumber, profileImage } = req.body;

    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return next(new AppError("Admin not found", 404));
    }

    // Update fields
    if (fullName) admin.fullName = fullName;
    if (phoneNumber !== undefined) admin.phoneNumber = phoneNumber;
    if (profileImage !== undefined) admin.profileImage = profileImage;

    await admin.save();

    res.status(200).json({
      success: true,
      message: "Admin profile updated successfully",
      data: { admin },
    });
  } catch (error) {
    next(error);
  }
};

// Change Password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return next(new AppError("Admin not found", 404));
    }

    // Verify current password
    const isPasswordValid = await admin.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return next(new AppError("Current password is incorrect", 401));
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    // Revoke all existing sessions
    await SessionToken.updateMany(
      { userId: admin._id, userType: "admin" },
      { revoked: true }
    );

    // Clear refresh tokens
    admin.refreshTokens = [];
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully. Please login again.",
    });
  } catch (error) {
    next(error);
  }
};

// Refresh Token
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError("Refresh token is required", 400));
    }

    // Verify refresh token
    const jwt = require("jsonwebtoken");
    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.SECRET_KEY_JSON_WEB_TOKEN_REFRESH
      );
    } catch (err) {
      return next(new AppError("Invalid or expired refresh token", 401));
    }

    // Find admin
    const admin = await Admin.findById(decoded._id);
    if (!admin || !admin.isActive) {
      return next(new AppError("Admin not found or inactive", 401));
    }

    // Check if refresh token exists
    if (!admin.refreshTokens.includes(refreshToken)) {
      return next(new AppError("Invalid refresh token", 401));
    }

    // Generate new tokens
    const newAuthToken = admin.generateAuthToken();
    const newRefreshToken = admin.generateRefreshToken();

    // Replace old refresh token with new one
    admin.refreshTokens = admin.refreshTokens.filter(
      (rt) => rt !== refreshToken
    );
    admin.refreshTokens.push(newRefreshToken);
    await admin.save();

    // Revoke old session and create new one
    await SessionToken.updateMany(
      { refreshToken, userId: admin._id },
      { revoked: true }
    );

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await SessionToken.create({
      userId: admin._id,
      authToken: newAuthToken,
      refreshToken: newRefreshToken,
      expiresAt,
      userType: "admin",
    });

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        authToken: newAuthToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};
