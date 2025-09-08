const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const adminSessionSchema = new Schema(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    authToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    deviceInfo: {
      deviceType: String,
      browser: String,
      os: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for automatic cleanup of expired sessions
adminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for faster lookups
adminSessionSchema.index({ adminId: 1, authToken: 1 });
adminSessionSchema.index({ adminId: 1, isActive: 1 });

const AdminSession = mongoose.model("AdminSession", adminSessionSchema);
module.exports = AdminSession;
