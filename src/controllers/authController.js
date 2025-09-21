const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const AppError = require("../errors/appError");
const {
  User,
  Otp,
  SessionToken,
  Referral,
  TokenTransaction,
  RewardConfig,
  Notification,
} = require("../models");
const { ms, sendOtpEmail } = require("../helpers");
const { generateUsername } = require("../helpers/usernameGenerator");
const GOOGLE_CLIENT_ID_ANDROID = process.env.GOOGLE_CLIENT_ID_ANDROID;
const GOOGLE_CLIENT_ID_IOS = process.env.GOOGLE_CLIENT_ID_IOS;
const googleClient = new OAuth2Client();

exports.register = async (req, res, next) => {
  try {
    const {
      fullName,
      username,
      email,
      password,
      dateOfBirth,
      country,
      phoneNumber,
      inviteReferralCode,
    } = req.body;

    // Check for existing email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (!existingUser.emailVerify) {
        // Delete unverified user with same email
        await User.deleteOne({ _id: existingUser._id });
        await Otp.deleteMany({ userId: existingUser._id }); // Clean up old OTPs
      } else {
        return next(new AppError("Email already exists", 409));
      }
    }

    // Generate or validate username
    let finalUsername;
    if (username) {
      // Check if provided username is already taken
      const existingUsername = await User.findOne({
        username: username.toLowerCase(),
      });
      if (existingUsername) {
        return next(new AppError("Username is already taken", 409));
      }
      finalUsername = username.toLowerCase();
    } else {
      // Generate unique username from email or name
      finalUsername = await generateUsername(email, fullName);
    }

    // Generate unique referral code (e.g., 8-char alphanumeric)
    let referralCode;
    let codeExists = true;
    while (codeExists) {
      referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      codeExists = await User.findOne({ referralCode });
    }

    // Create user with referralCode and username
    const user = new User({
      fullName,
      username: finalUsername,
      email,
      password,
      dateOfBirth,
      country,
      phoneNumber, // can be undefined
      referralCode,
    });
    await user.save();

    // If inviteReferralCode is provided, create a referral record
    if (inviteReferralCode) {
      const referrer = await User.findOne({ referralCode: inviteReferralCode });
      if (referrer) {
        await Referral.create({
          referrer: referrer._id,
          referee: user._id,
          referralCode: inviteReferralCode,
          status: "pending",
        });
      }
    }

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
    await sendOtpEmail({
      to: user.email,
      otpValue,
      purpose: "verify your email",
    });

    // Return user info (omit password)
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshTokens;

    res.status(201).json({
      message: "User created successfully. OTP sent to email.",
      user: userObj,
    });
  } catch (err) {
    console.log("🚀 ~ err:", err);
    if (err.name === "ValidationError") {
      return next(new AppError(err.message, 400));
    }
    next(new AppError("Error in creating user", 400));
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password, deviceModel, osVersion, appVersion, deviceType } =
      req.body;
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
    // Store session in SessionToken collection (no FCM token)
    await SessionToken.create({
      userId: user._id,
      authToken: token,
      refreshToken,
      deviceModel: deviceModel || null,
      osVersion: osVersion || null,
      deviceType: deviceType || null,
      appVersion: appVersion || null,
      expiresAt: new Date(
        Date.now() + ms(process.env.AUTH_TOKEN_EXPIRES_IN || "1d")
      ),
    });
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

    // Update the existing session (SessionToken) with new tokens and expiry
    const session = await SessionToken.findOne({
      userId: user._id,
      refreshToken,
    });
    if (session) {
      session.authToken = newToken;
      session.refreshToken = newRefreshToken;
      session.expiresAt = new Date(
        Date.now() + ms(process.env.AUTH_TOKEN_EXPIRES_IN || "1d")
      ); // 1 day
      await session.save();
    }

    res.status(200).json({ token: newToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(new AppError("Could not refresh token", 400));
  }
};

// Logout endpoint
exports.logout = async (req, res, next) => {
  try {
    // These values are guaranteed to be set by refreshTokenMiddleware
    const { user, session, refreshToken } = req;

    // Remove refresh token from user's tokens array
    user.refreshTokens = user.refreshTokens.filter(
      (token) => token !== refreshToken
    );

    // If this session has an FCM token, also remove it from the user's fcmTokens array
    if (session.fcmToken) {
      user.fcmTokens = user.fcmTokens.filter(
        (token) => token !== session.fcmToken
      );

      // Update the user document with both refreshToken and fcmToken changes
      await User.findByIdAndUpdate(user._id, {
        refreshTokens: user.refreshTokens,
        fcmTokens: user.fcmTokens,
      });
    } else {
      // Just update the refreshTokens if no FCM token in the session
      await User.findByIdAndUpdate(user._id, {
        refreshTokens: user.refreshTokens,
      });
    }

    // Mark the session as revoked and clear its FCM token
    await SessionToken.updateOne(
      { _id: session._id },
      {
        $set: {
          revoked: true,
          revokedAt: new Date(),
        },
      }
    );

    res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    console.error("Logout error:", err);
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

    // Award referral if this user was referred and not already rewarded
    const referral = await Referral.findOne({
      referee: user._id,
      status: "pending",
    });
    if (referral) {
      referral.status = "rewarded";
      referral.rewardedAt = new Date();
      await referral.save();
      // Fetch referral reward amount from RewardConfig
      let rewardAmount = 0; // fallback default
      const rewardConfig = await RewardConfig.findOne({ type: "referral" });
      if (rewardConfig && typeof rewardConfig.amount === "number") {
        rewardAmount = rewardConfig.amount;
      }
      await User.findByIdAndUpdate(referral.referrer, {
        $inc: { tokens: rewardAmount },
      });
      // Log token transaction
      await TokenTransaction.create({
        user: referral.referrer,
        amount: rewardAmount,
        type: "referral",
        relatedId: referral._id,
        metadata: {
          refereeId: user._id, // Track who was referred
          referralCode: referral.referralCode, // Track the referral code used
        },
      });

      // === REFERRAL NOTIFICATION ===
      // Send notification to referrer about successful referral reward
      if (rewardAmount > 0) {
        // Get referrer details for notification
        const referrer = await User.findById(
          referral.referrer,
          "fullName username"
        );

        if (referrer) {
          // Create referral reward notification
          const referralNotification = await Notification.create({
            userId: referral.referrer,
            type: "referral_reward",
            title: "Referral Reward Earned!",
            message: `${user.fullName} joined using your referral code. You earned ${rewardAmount} coins!`,
            triggeredBy: user._id,
            relatedData: {
              referralId: referral._id,
              coinData: {
                amount: rewardAmount,
                reason: "referral",
              },
              metadata: {
                refereeName: user.fullName,
                refereeUsername: user.username,
                referralCode: referral.referralCode,
              },
            },
            actionType: "view_coins",
            priority: "medium",
          });

          // Send notification using the io instance
          const io = req.app.get("io");
          if (io && io.notificationService) {
            // Populate the full notification data for socket
            const populatedNotification = await Notification.findById(
              referralNotification._id
            ).populate(
              "triggeredBy",
              "firstName lastName username profileImage"
            );

            await io.notificationService.sendNotification(
              referral.referrer.toString(),
              populatedNotification
            );

            console.log(
              `🎉 Referral reward notification sent to ${referral.referrer} (+${rewardAmount} coins from ${user.fullName})`
            );
          }
        }
      }
    }

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
    await sendOtpEmail({
      to: user.email,
      otpValue,
      purpose: "verify your email",
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

exports.getProfile = async (req, res, next) => {
  try {
    // Get user ID from auth middleware - support both auth middleware and manual ID
    const userId = req.user?._id || req.body.userId;

    if (!userId) {
      return next(new AppError("User ID is required", 400));
    }

    // Find user by ID but exclude sensitive fields
    const user = await User.findById(userId).select("-password -refreshTokens");

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Convert to plain object
    const userObj = user.toObject();

    // Return user data
    res.status(200).json({
      status: "success",
      data: {
        user: userObj,
      },
    });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    next(new AppError("Failed to fetch profile", 500));
  }
};

exports.addFcmToken = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return next(new AppError("FCM token is required", 400));
    }

    console.log(
      `Adding FCM token for user ${userId}: ${fcmToken.slice(0, 10)}...`
    );

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Add FCM token to user if not present
    if (!user.fcmTokens.includes(fcmToken)) {
      user.fcmTokens.push(fcmToken);
      await user.save();
      console.log(
        `Added new FCM token to user ${userId}'s fcmTokens array. Current count: ${user.fcmTokens.length}`
      );
    } else {
      console.log(
        `FCM token already exists in user ${userId}'s fcmTokens array`
      );
    }

    // Update the current session's SessionToken with the FCM token
    if (req.headers["authorization"]) {
      const token = req.headers["authorization"].split(" ")[1];
      const sessionUpdate = await SessionToken.updateOne(
        { userId, authToken: token },
        { $set: { fcmToken } }
      );

      if (sessionUpdate.modifiedCount > 0) {
        console.log(`Updated session FCM token for user ${userId}`);
      } else {
        console.log(`No session found or no change needed for user ${userId}`);
      }
    }

    res.status(200).json({ message: "FCM token added successfully" });
  } catch (err) {
    console.error("Error adding FCM token:", err);
    next(new AppError("Could not add FCM token", 400));
  }
};

exports.googleLogin = async (req, res, next) => {
  try {
    const { idToken, deviceModel, osVersion, appVersion, deviceType } =
      req.body;
    if (!idToken) {
      return next(new AppError("Google ID token is required", 400));
    }
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: [GOOGLE_CLIENT_ID_ANDROID, GOOGLE_CLIENT_ID_IOS],
    });
    const payload = ticket.getPayload();
    console.log("🚀 ~ exports.googleLogin= ~ payload:", payload);
    if (!payload?.email) {
      return next(new AppError("Google authentication failed", 401));
    }
    let user = await User.findOne({ email: payload.email });
    if (!user) {
      // Generate unique username from email (part before @)
      const baseUsername = payload.email.split("@")[0];
      const uniqueUsername = await generateUsername(
        payload.email,
        payload.name || baseUsername
      );

      // Generate unique referral code
      let referralCode;
      let codeExists = true;
      while (codeExists) {
        referralCode = Math.random()
          .toString(36)
          .substring(2, 10)
          .toUpperCase();
        codeExists = await User.findOne({ referralCode });
      }

      // Create user if not exists
      user = new User({
        fullName: payload.name || payload.email.split("@")[0],
        username: uniqueUsername,
        email: payload.email,
        password: crypto.randomBytes(32).toString("hex"), // random password
        dateOfBirth: new Date("1970-01-01"), // placeholder, can be updated later
        country: "", // can be updated later
        phoneNumber: "", // can be updated later
        emailVerify: true,
        profileImage: payload.picture || undefined,
        referralCode,
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
    // Store session in SessionToken collection (no FCM token)
    await SessionToken.create({
      userId: user._id,
      authToken: token,
      refreshToken,
      deviceModel: deviceModel || null,
      osVersion: osVersion || null,
      deviceType: deviceType || null,
      appVersion: appVersion || null,
      expiresAt: new Date(
        Date.now() + ms(process.env.AUTH_TOKEN_EXPIRES_IN || "1d")
      ),
    });

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
    console.log("🚀 ~ exports.googleLogin= ~ err:", err);
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
    await sendOtpEmail({
      to: user.email,
      otpValue,
      purpose: "reset your password",
      subject: "Your Password Reset OTP",
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
    // Delete the OTP document after successful password reset
    await Otp.deleteOne({ _id: otpDoc._id });
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
