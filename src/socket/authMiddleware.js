const jwt = require("jsonwebtoken");
const SessionToken = require("../models/sessionToken.model");
const User = require("../models/user.model");

/**
 * Socket.IO Authentication Middleware
 * Validates user token and attaches user data to socket
 */
async function socketAuthMiddleware(socket, next) {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      console.log("❌ Socket connection rejected: No token provided");
      return next(new Error("Authentication token required"));
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET_KEY_JSON_WEB_TOKEN_LOGIN);
    } catch (err) {
      console.log("❌ Socket connection rejected: Invalid token", err.message);
      return next(new Error("Invalid or expired token"));
    }

    // Check session validity (same as your existing auth middleware)
    const session = await SessionToken.findOne({
      userId: decoded._id,
      authToken: token,
      revoked: false,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      console.log(
        "❌ Socket connection rejected: Invalid session for user",
        decoded._id
      );
      return next(new Error("Session invalid or logged out"));
    }

    // Get user data for auto-joining
    const user = await User.findById(decoded._id).select(
      "fullName email profileImage username bio"
    );

    if (!user) {
      console.log("❌ Socket connection rejected: User not found", decoded._id);
      return next(new Error("User not found"));
    }

    // Attach user data to socket for auto-joining
    socket.userId = decoded._id;
    socket.userRole = decoded.role;
    socket.authToken = token;
    socket.session = session;

    // User profile data for auto-joining
    socket.userFullName = user.fullName;
    socket.userEmail = user.email;
    socket.userProfileImage = user.profileImage;
    socket.userName = user.username;
    socket.userBio = user.bio;

    console.log(
      `🔐 Socket authenticated for user: ${user.fullName} (${decoded._id})`
    );
    next();
  } catch (error) {
    console.error("Socket auth middleware error:", error);
    next(new Error("Authentication failed"));
  }
}

module.exports = socketAuthMiddleware;
