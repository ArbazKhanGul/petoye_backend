const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const petViewSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    petListing: {
      type: Schema.Types.ObjectId,
      ref: "PetListing",
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
    // Track if they interacted with the pet listing
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
      { user: 1, petListing: 1 }, // Unique compound index to prevent duplicate views
      { user: 1, viewedAt: -1 }, // For getting user's view history
      { petListing: 1, viewedAt: -1 }, // For pet listing analytics
      { user: 1, interacted: 1, viewedAt: -1 }, // For engagement analysis
    ],
  }
);

// Ensure unique pet listing views per user
petViewSchema.index({ user: 1, petListing: 1 }, { unique: true });

// Pre-save middleware to update engagement score based on interactions
petViewSchema.pre("save", function (next) {
  if (this.interacted) {
    this.engagementScore = Math.max(2, this.engagementScore);
  }

  // Increase engagement score based on view duration
  if (this.viewDuration > 3) {
    this.engagementScore += Math.min(3, Math.floor(this.viewDuration / 3));
  }

  next();
});

// Static method to mark a pet listing as viewed
petViewSchema.statics.markAsViewed = async function (
  userId,
  petListingId,
  options = {}
) {
  const { viewDuration = 0, interacted = false } = options;

  try {
    const existingView = await this.findOne({
      user: userId,
      petListing: petListingId,
    });

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
        petListing: petListingId,
        viewDuration,
        interacted,
      });
    }
  } catch (error) {
    // Handle duplicate key error gracefully
    if (error.code === 11000) {
      return await this.findOne({ user: userId, petListing: petListingId });
    }
    throw error;
  }
};

// Static method to get user's viewed pet listings
petViewSchema.statics.getUserViewedPets = async function (
  userId,
  timeRange = null
) {
  let query = { user: userId };

  if (timeRange) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRange); // timeRange in days
    query.viewedAt = { $gte: cutoffDate };
  }

  const views = await this.find(query).select("petListing viewedAt").lean();
  return views.map((view) => view.petListing);
};

// Static method to clean old views (optional - for data management)
petViewSchema.statics.cleanOldViews = async function (daysToKeep = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  return await this.deleteMany({
    viewedAt: { $lt: cutoffDate },
    interacted: false, // Keep views where user interacted
  });
};

const PetView = mongoose.model("PetView", petViewSchema);
module.exports = PetView;
