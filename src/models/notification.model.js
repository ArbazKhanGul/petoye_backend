const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema(
  {
    // Notification recipient
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // For fast queries by user
    },

    // Notification type
    type: {
      type: String,
      required: true,
      enum: [
        // Post-related notifications
        "post_like",
        "post_comment",

        // Follow-related notifications
        "new_follower",
        "unfollow",

        // System notifications
        "system_announcement",

        // Coin-related notifications
        "coin_earned_like", // Coins earned from getting likes
        "coin_earned_comment", // Coins earned from getting comments
        "coin_earned_referral", // Coins earned from referral program

        // Referral notifications
        "referral_joined", // Someone joined using your referral code
      ],
      index: true,
    },

    // Notification title
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // Notification message/content
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    // User who triggered this notification (optional)
    triggeredBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Related data based on notification type
    relatedData: {
      // Post-related data (for post_like, post_comment)
      postId: {
        type: Schema.Types.ObjectId,
        ref: "Post",
        default: null,
      },

      // Comment-related data (for post_comment)
      commentId: {
        type: Schema.Types.ObjectId,
        ref: "Comment",
        default: null,
      },

      // Follow-related data (for new_follower, unfollow)
      followId: {
        type: Schema.Types.ObjectId,
        ref: "Follow",
        default: null,
      },

      // Coin-related data (for coin_earned_*)
      coinData: {
        amount: {
          type: Number,
          default: 0,
        },
        reason: {
          type: String,
          enum: ["like", "comment", "referral", "system"],
          default: null,
        },
        transactionId: {
          type: Schema.Types.ObjectId,
          ref: "TokenTransaction",
          default: null,
        },
      },

      // Referral-related data (for referral_joined)
      referralData: {
        referralCode: {
          type: String,
          default: null,
        },
        newUserId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        newUserName: {
          type: String,
          default: null,
        },
      },

      // Additional metadata (flexible object)
      metadata: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },

    // Read status
    isRead: {
      type: Boolean,
      default: false,
      index: true, // For filtering read/unread
    },

    // When the notification was read
    readAt: {
      type: Date,
      default: null,
    },

    // Priority level
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    // Action that user can take (optional)
    actionType: {
      type: String,
      enum: [
        "view_post", // For post_like, post_comment
        "view_profile", // For new_follower, unfollow, referral_joined
        "view_coins", // For coin_earned_* notifications
        "view_announcement", // For system_announcement
        "none", // For notifications with no action
      ],
      default: "none",
    },

    // URL or deep link for the action
    actionUrl: {
      type: String,
      default: null,
    },

    // Expiry date for the notification (optional)
    expiresAt: {
      type: Date,
      default: null,
      index: { expireAfterSeconds: 0 }, // Auto-delete expired notifications
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes for performance
notificationSchema.index({ userId: 1, createdAt: -1 }); // For user's notifications ordered by date
notificationSchema.index({ userId: 1, isRead: 1 }); // For filtering read/unread
notificationSchema.index({ userId: 1, type: 1 }); // For filtering by notification type
notificationSchema.index({ userId: 1, isActive: 1, createdAt: -1 }); // For active notifications
notificationSchema.index({ triggeredBy: 1, createdAt: -1 }); // For notifications triggered by specific user
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // Auto-delete after 90 days

// Virtual for checking if notification is recent (within last 24 hours)
notificationSchema.virtual("isRecent").get(function () {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.createdAt > oneDayAgo;
});

// Virtual for time since notification was created
notificationSchema.virtual("timeAgo").get(function () {
  const now = new Date();
  const diff = now - this.createdAt;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
});

// Instance method to mark as read
notificationSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Instance method to mark as unread
notificationSchema.methods.markAsUnread = function () {
  this.isRead = false;
  this.readAt = null;
  return this.save();
};

// Static method to get user's notification count
notificationSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({
    userId,
    isRead: false,
    isActive: true,
  });
};

// Static method to get user's notifications with pagination
notificationSchema.statics.getUserNotifications = function (
  userId,
  {
    type = null,
    isRead = null,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = -1,
  } = {}
) {
  const filter = { userId, isActive: true };

  if (type) filter.type = type;
  if (isRead !== null) filter.isRead = isRead;

  const skip = (page - 1) * limit;

  return this.find(filter)
    .populate("triggeredBy", "fullName username profileImage")
    .populate("relatedData.postId", "content mediaFiles")
    .populate("relatedData.commentId", "content")
    .populate("relatedData.followId")
    .populate("relatedData.coinData.transactionId")
    .populate(
      "relatedData.referralData.newUserId",
      "fullName username profileImage"
    )
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit)
    .lean();
};

// Static method to mark multiple notifications as read
notificationSchema.statics.markMultipleAsRead = function (
  userId,
  notificationIds = []
) {
  const filter = { userId, isActive: true };

  if (notificationIds.length > 0) {
    filter._id = { $in: notificationIds };
  }

  return this.updateMany(filter, {
    isRead: true,
    readAt: new Date(),
  });
};

// Static method to delete old notifications
notificationSchema.statics.deleteOldNotifications = function (daysOld = 90) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  return this.deleteMany({ createdAt: { $lt: cutoffDate } });
};

// Pre-save middleware to set expiry date if not provided
notificationSchema.pre("save", function (next) {
  if (!this.expiresAt) {
    // Set expiry to 90 days from creation
    this.expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  }
  next();
});

const Notification = mongoose.model("Notification", notificationSchema);

// Create compound indexes for better query performance
notificationSchema.index({ userId: 1, _id: -1 }); // For cursor-based pagination
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 }); // For read/unread filtering
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 }); // For type filtering
notificationSchema.index({ createdAt: 1 }); // For TTL and cleanup
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

module.exports = Notification;
