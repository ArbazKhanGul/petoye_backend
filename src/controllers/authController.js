const AppError = require("../errors/appError");
const User = require("../models/user.model");
const Otp = require("../models/otp.model");
const { sendEmail } = require("../helpers/emailHelper");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { OAuth2Client } = require("google-auth-library");
const GOOGLE_CLIENT_ID_ANDROID = process.env.GOOGLE_CLIENT_ID_ANDROID;
const GOOGLE_CLIENT_ID_IOS = process.env.GOOGLE_CLIENT_ID_IOS;
const googleClient = new OAuth2Client();

exports.register = async (req, res, next) => {
  try {
    const { fullName, email, password, dateOfBirth, country, phoneNumber } =
      req.body;

    // Check for existing email or phone
    const existingUser = await User.findOne({
      $or: [{ email }, { phoneNumber }],
    });
    if (existingUser) {
      return next(new AppError("Email or phone number already exists", 409));
    }

    // Create user
    const user = new User({
      fullName,
      email,
      password,
      dateOfBirth,
      country,
      phoneNumber,
    });
    await user.save();

    // Generate auth token
    const token = await user.generateAuthToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshTokens.push(refreshToken);
    await user.save();

    // Generate OTP (6 digit)
    const otpValue = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
    await Otp.create({
      userId: user._id,
      type: "email",
      value: otpValue,
      expiration,
    });

    // Send OTP email
    await sendEmail({
      to: user.email,
      subject: "Your OTP Code",
      text: `Your OTP code is: ${otpValue}`,
      html: `<p>Your OTP code is: <b>${otpValue}</b></p>`,
    });

    // Return user info (omit password)
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshTokens;

    res.status(201).json({
      message: "User created successfully. OTP sent to email.",
      user: userObj,
      token,
      refreshToken,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      return next(new AppError(err.message, 400));
    }
    next(new AppError("Error in creating user", 400));
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError("Invalid email or password", 401));
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new AppError("Invalid email or password", 401));
    }
    if (!user.emailVerify) {
      return next(
        new AppError("Please verify your email with OTP before login", 403)
      );
    }
    // Generate tokens
    const token = await user.generateAuthToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshTokens.push(refreshToken);
    await user.save();
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshTokens;
    res.status(200).json({
      message: "Login successful",
      user: userObj,
      token,
      refreshToken,
    });
  } catch (err) {
    next(new AppError("Login failed", 400));
  }
};

// Refresh token endpoint
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return next(new AppError("Refresh token is required", 400));
    }
    const payload = User.verifyRefreshToken(refreshToken);
    if (!payload) {
      return next(new AppError("Invalid or expired refresh token", 401));
    }
    const user = await User.findById(payload._id);
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return next(new AppError("Refresh token does not match", 401));
    }
    // Remove used refresh token and add new one
    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    const newRefreshToken = await user.generateRefreshToken();
    user.refreshTokens.push(newRefreshToken);
    await user.save();
    const newToken = await user.generateAuthToken();
    res.status(200).json({ token: newToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(new AppError("Could not refresh token", 400));
  }
};

// Logout endpoint
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return next(new AppError("Refresh token is required", 400));
    }
    const payload = User.verifyRefreshToken(refreshToken);
    if (!payload) {
      return next(new AppError("Invalid or expired refresh token", 401));
    }
    const user = await User.findById(payload._id);
    if (!user) {
      return next(new AppError("User not found", 404));
    }
    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    await user.save();
    res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    next(new AppError("Logout failed", 400));
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError("User not found", 404));
    }
    const otpDoc = await Otp.findOne({
      userId: user._id,
      type: "email",
      value: otp,
      status: false,
      expiration: { $gt: new Date() },
    });
    if (!otpDoc) {
      return next(new AppError("Invalid or expired OTP", 400));
    }
    otpDoc.status = true;
    await otpDoc.save();
    user.emailVerify = true;
    await user.save();
    res.status(200).json({ message: "OTP verified successfully" });
  } catch (err) {
    next(new AppError("OTP verification failed", 400));
  }
};

exports.resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError("User not found", 404));
    }
    // Check for recent unused OTP (within 1 minute)
    const recentOtp = await Otp.findOne({
      userId: user._id,
      type: "email",
      status: false,
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
    });
    if (recentOtp) {
      return next(
        new AppError("Please wait before requesting another OTP", 429)
      );
    }
    // Mark all previous unused OTPs as used/inactive
    await Otp.updateMany(
      {
        userId: user._id,
        type: "email",
        status: false,
        expiration: { $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      { $set: { status: true } }
    );
    // Generate new OTP
    const otpValue = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
    await Otp.create({
      userId: user._id,
      type: "email",
      value: otpValue,
      expiration,
    });
    await sendEmail({
      to: user.email,
      subject: "Your OTP Code",
      text: `Your OTP code is: ${otpValue}`,
      html: `<p>Your OTP code is: <b>${otpValue}</b></p>`,
    });
    res.status(200).json({ message: "OTP resent successfully" });
  } catch (err) {
    next(new AppError("Could not resend OTP", 400));
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.body.userId; // support both auth and manual
    if (!userId) {
      return next(new AppError("User ID is required", 400));
    }
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }
    const { fullName, phoneNumber, country, dateOfBirth } = req.body;
    if (fullName) user.fullName = fullName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (country) user.country = country;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    // Handle profile image
    if (req.file && req.file.path) {
      // Save relative path for image
      user.profileImage = req.file.path
        .replace(/\\/g, "/")
        .replace(/^.*images\//, "/images/");
    }
    await user.save();
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshTokens;
    res
      .status(200)
      .json({ message: "Profile updated successfully", user: userObj });
  } catch (err) {
    next(new AppError("Profile update failed", 400));
  }
};

exports.addFcmToken = async (req, res, next) => {
  try {
    const { userId, fcmToken } = req.body;
    if (!userId || !fcmToken) {
      return next(new AppError("User ID and FCM token are required", 400));
    }
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }
    if (!user.fcmTokens.includes(fcmToken)) {
      user.fcmTokens.push(fcmToken);
      await user.save();
    }
    res.status(200).json({ message: "FCM token added successfully" });
  } catch (err) {
    next(new AppError("Could not add FCM token", 400));
  }
};

exports.googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return next(new AppError("Google ID token is required", 400));
    }
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: [GOOGLE_CLIENT_ID_ANDROID, GOOGLE_CLIENT_ID_IOS],
    });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      return next(new AppError("Google authentication failed", 401));
    }
    let user = await User.findOne({ email: payload.email });
    if (!user) {
      // Create user if not exists
      user = new User({
        fullName: payload.name || payload.email.split("@")[0],
        email: payload.email,
        password: crypto.randomBytes(32).toString("hex"), // random password
        dateOfBirth: new Date("1970-01-01"), // placeholder, can be updated later
        country: "", // can be updated later
        phoneNumber: "", // can be updated later
        emailVerify: true,
        profileImage: payload.picture || undefined,
      });
      await user.save();
    } else if (!user.emailVerify) {
      user.emailVerify = true;
      await user.save();
    }
    // Generate tokens
    const token = await user.generateAuthToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshTokens.push(refreshToken);
    await user.save();
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshTokens;
    res.status(200).json({
      message: "Google login successful",
      user: userObj,
      token,
      refreshToken,
    });
  } catch (err) {
    next(new AppError("Google login failed", 400));
  }
};

exports.forgotPasswordSendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError("User not found", 404));
    }
    // Check for recent unused OTP (within 1 minute)
    const recentOtp = await Otp.findOne({
      userId: user._id,
      type: "forgot",
      status: false,
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
    });
    if (recentOtp) {
      return next(
        new AppError("Please wait before requesting another OTP", 429)
      );
    }
    // Mark all previous unused OTPs as used/inactive
    await Otp.updateMany(
      {
        userId: user._id,
        type: "forgot",
        status: false,
        expiration: { $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      { $set: { status: true } }
    );
    // Generate new OTP
    const otpValue = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
    await Otp.create({
      userId: user._id,
      type: "forgot",
      value: otpValue,
      expiration,
    });
    await sendEmail({
      to: user.email,
      subject: "Your Password Reset OTP",
      text: `Your password reset OTP is: ${otpValue}`,
      html: `<p>Your password reset OTP is: <b>${otpValue}</b></p>`,
    });
    res.status(200).json({ message: "Password reset OTP sent to email" });
  } catch (err) {
    next(new AppError("Could not send password reset OTP", 400));
  }
};

exports.forgotPasswordVerifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError("User not found", 404));
    }
    const otpDoc = await Otp.findOne({
      userId: user._id,
      type: "forgot",
      value: otp,
      status: false,
      expiration: { $gt: new Date() },
    });
    if (!otpDoc) {
      return next(new AppError("Invalid or expired OTP", 400));
    }
    otpDoc.status = true;
    await otpDoc.save();
    // Mark user as allowed to reset password (could use a flag or just allow next step)
    res.status(200).json({
      message: "OTP verified. You can now reset your password.",
    });
  } catch (err) {
    next(new AppError("OTP verification failed", 400));
  }
};

exports.forgotPasswordReset = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError("User not found", 404));
    }
    const otpDoc = await Otp.findOne({
      userId: user._id,
      type: "forgot",
      value: otp,
      status: true, // must be verified
      expiration: { $gt: new Date(Date.now() - 10 * 60 * 1000) }, // within last 10 min
    });
    if (!otpDoc) {
      return next(new AppError("OTP not verified or expired", 400));
    }
    user.password = newPassword;
    await user.save();
    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    next(new AppError("Password reset failed", 400));
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    if (!userId || !oldPassword || !newPassword) {
      return next(
        new AppError(
          "User ID, old password, and new password are required",
          400
        )
      );
    }
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return next(new AppError("Old password is incorrect", 401));
    }
    user.password = newPassword;
    await user.save();
    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    next(new AppError("Password update failed", 400));
  }
};
