const jwt = require("jsonwebtoken");
const AppError = require("../errors/appError");
const User = require("../models/user.model");
const SessionToken = require("../models/sessionToken.model");

/**
 * Middleware to verify refresh tokens and set user and session data on the request
 * This is lighter than the full auth middleware and doesn't require Authorization header
 */
module.exports = async function (req, res, next) {
  try {
    // Get refresh token from request body
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError("Refresh token is required", 400));
    }

    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.SECRET_KEY_JSON_WEB_TOKEN_REFRESH
      );
    } catch (err) {
      console.error("Refresh token verification error:", err.message);
      return next(new AppError("Invalid or expired refresh token", 401));
    }

    // Find the user based on the decoded ID
    const user = await User.findById(decoded._id);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Check if the refresh token exists in the user's refresh tokens array
    if (!user.refreshTokens.includes(refreshToken)) {
      return next(new AppError("Invalid refresh token", 401));
    }

    // Find the session
    const session = await SessionToken.findOne({
      userId: user._id,
      refreshToken,
      revoked: false,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return next(new AppError("Session not found or expired", 401));
    }

    // Set user and session on request
    req.user = user;
    req.session = session;
    req.refreshToken = refreshToken; // Store the token for easy access

    next();
  } catch (err) {
    console.error("Refresh token middleware error:", err);
    next(err);
  }
};
