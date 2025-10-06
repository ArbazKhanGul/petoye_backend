const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const postViewSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    // Track engagement depth (how long they viewed, did they interact)
    engagementScore: {
      type: Number,
      default: 1, // 1 = just viewed, higher = more engagement
    },
    // Track if they interacted with the post
    interacted: {
      type: Boolean,
      default: false,
    },
    // Track view duration in seconds
    viewDuration: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    // Compound indexes for optimization
    indexes: [
      { user: 1, post: 1 }, // Unique compound index to prevent duplicate views
      { user: 1, viewedAt: -1 }, // For getting user's view history
      { post: 1, viewedAt: -1 }, // For post analytics
      { user: 1, interacted: 1, viewedAt: -1 }, // For engagement analysis
    ],
  }
);

// Ensure unique post views per user
postViewSchema.index({ user: 1, post: 1 }, { unique: true });

// Pre-save middleware to update engagement score based on interactions
postViewSchema.pre("save", function (next) {
  if (this.interacted) {
    this.engagementScore = Math.max(2, this.engagementScore);
  }

  // Increase engagement score based on view duration
  if (this.viewDuration > 3) {
    this.engagementScore += Math.min(3, Math.floor(this.viewDuration / 3));
  }

  next();
});

// Static method to mark a post as viewed
postViewSchema.statics.markAsViewed = async function (
  userId,
  postId,
  options = {}
) {
  const { viewDuration = 0, interacted = false } = options;

  try {
    const existingView = await this.findOne({ user: userId, post: postId });

    if (existingView) {
      // Update existing view with new engagement data
      existingView.viewedAt = new Date();
      existingView.viewDuration = Math.max(
        existingView.viewDuration,
        viewDuration
      );
      existingView.interacted = existingView.interacted || interacted;
      await existingView.save();
      return existingView;
    } else {
      // Create new view record
      return await this.create({
        user: userId,
        post: postId,
        viewDuration,
        interacted,
      });
    }
  } catch (error) {
    // Handle duplicate key error gracefully
    if (error.code === 11000) {
      return await this.findOne({ user: userId, post: postId });
    }
    throw error;
  }
};

// Static method to get user's viewed posts
postViewSchema.statics.getUserViewedPosts = async function (
  userId,
  timeRange = null
) {
  let query = { user: userId };

  if (timeRange) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRange); // timeRange in days
    query.viewedAt = { $gte: cutoffDate };
  }

  const views = await this.find(query).select("post viewedAt").lean();
  return views.map((view) => view.post);
};

// Static method to clean old views (optional - for data management)
postViewSchema.statics.cleanOldViews = async function (daysToKeep = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  return await this.deleteMany({
    viewedAt: { $lt: cutoffDate },
    interacted: false, // Keep views where user interacted
  });
};

const PostView = mongoose.model("PostView", postViewSchema);
module.exports = PostView;
