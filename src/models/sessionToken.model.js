const mongoose = require("mongoose");

const sessionTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    fcmToken: { type: String },
    deviceModel: { type: String },
    osVersion: { type: String },
    deviceType: { type: String },
    appVersion: { type: String },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    revoked: { type: Boolean, default: false },
    revokedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SessionToken", sessionTokenSchema);
