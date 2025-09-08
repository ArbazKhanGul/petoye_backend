const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userActivityLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        // Authentication actions
        "LOGIN",
        "LOGOUT", 
        "PASSWORD_CHANGE",
        "EMAIL_VERIFY",
        "OTP_REQUEST",
        "OTP_VERIFY",
        "FORGOT_PASSWORD",
        "REFRESH_TOKEN",
        
        // Profile actions
        "PROFILE_UPDATE",
        "PROFILE_IMAGE_UPDATE",
        "USERNAME_CHANGE",
        
        // Post actions
        "POST_CREATE",
        "POST_UPDATE", 
        "POST_DELETE",
        "POST_VIEW",
        
        // Interaction actions
        "LIKE_ADD",
        "LIKE_REMOVE",
        "COMMENT_ADD",
        "COMMENT_UPDATE",
        "COMMENT_DELETE",
        
        // Follow actions
        "FOLLOW_ADD",
        "FOLLOW_REMOVE",
        
        // Pet listing actions
        "PET_LISTING_CREATE",
        "PET_LISTING_UPDATE",
        "PET_LISTING_DELETE",
        
        // Chat actions
        "MESSAGE_SEND",
        "MESSAGE_READ",
        "CONVERSATION_CREATE",
        
        // Token actions
        "TOKEN_EARN",
        "TOKEN_SPEND",
        
        // Referral actions
        "REFERRAL_SEND",
        "REFERRAL_ACCEPT",
        
        // App actions
        "APP_OPEN",
        "APP_CLOSE",
        "SCREEN_VIEW"
      ]
    },
    targetType: {
      type: String,
      enum: ["User", "Post", "Comment", "PetListing", "Message", "Token", "Referral", "App", null],
    },
    targetId: {
      type: Schema.Types.ObjectId,
    },
    details: {
      type: mongoose.Schema.Types.Mixed, // Flexible object for action details
    },
    // Device and session information
    deviceInfo: {
      deviceModel: String,
      osVersion: String,
      deviceType: String, // "ios", "android", "web"
      appVersion: String,
      fcmToken: String,
    },
    sessionInfo: {
      sessionId: String,
      authToken: String,
      ipAddress: String,
      userAgent: String,
    },
    // Geographic information
    location: {
      country: String,
      city: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    // Additional metadata
    metadata: {
      duration: Number, // for actions that have duration
      success: { type: Boolean, default: true },
      errorMessage: String,
      fromScreen: String, // which screen/page the action was performed from
      toScreen: String, // which screen/page user navigated to
    },
  },
  { 
    timestamps: true,
    // Add expiry for log rotation (optional - remove if you want to keep all logs)
    // expires: 60 * 60 * 24 * 365 // 1 year
  }
);

// Indexes for efficient querying
userActivityLogSchema.index({ userId: 1, createdAt: -1 });
userActivityLogSchema.index({ action: 1, createdAt: -1 });
userActivityLogSchema.index({ targetType: 1, targetId: 1 });
userActivityLogSchema.index({ createdAt: -1 });
userActivityLogSchema.index({ "sessionInfo.ipAddress": 1 });
userActivityLogSchema.index({ "deviceInfo.deviceType": 1 });

// Compound indexes for common queries
userActivityLogSchema.index({ userId: 1, action: 1, createdAt: -1 });
userActivityLogSchema.index({ userId: 1, targetType: 1, createdAt: -1 });

const UserActivityLog = mongoose.model("UserActivityLog", userActivityLogSchema);
module.exports = UserActivityLog;
