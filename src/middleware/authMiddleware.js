const jwt = require("jsonwebtoken");
const AppError = require("../errors/appError");
const SessionToken = require("../models/sessionToken.model");

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
      decoded = jwt.verify(token, process.env.SECRET_KEY_JSON_WEB_TOKEN_LOGIN);
    } catch (err) {
      console.error("Token verification error:", err.message);
      return next(new AppError("Invalid or expired token", 401));
    }
    // Only check session, don't query user
    const session = await SessionToken.findOne({
      userId: decoded._id,
      authToken: token,
      revoked: false,
      expiresAt: { $gt: new Date() },
    });
    if (!session) {
      return next(new AppError("Session invalid or logged out", 401));
    }
    // Use only _id for consistency across the application
    req.user = { _id: decoded._id, role: decoded.role };
    req.session = session;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    next(err);
  }
};
