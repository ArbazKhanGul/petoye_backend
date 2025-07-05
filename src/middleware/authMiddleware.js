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
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return next(new AppError("Invalid or expired token", 401));
    }
    // Only check session, don't query user
    const session = await SessionToken.findOne({
      userId: decoded.id,
      authToken: token,
      revoked: false,
      expiresAt: { $gt: new Date() },
    });
    if (!session) {
      return next(new AppError("Session invalid or logged out", 401));
    }
    req.user = { _id: decoded.id, id: decoded.id, role: decoded.role };
    req.session = session;
    next();
  } catch (err) {
    next(err);
  }
};
