const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const followSchema = new Schema(
  {
    follower: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    following: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { 
    timestamps: true,
    // Compound index to prevent duplicate follows and optimize queries
    indexes: [
      { follower: 1, following: 1 }, // Unique compound index
      { follower: 1, createdAt: -1 }, // For getting user's following list
      { following: 1, createdAt: -1 } // For getting user's followers list
    ]
  }
);

// Ensure unique follow relationships
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Prevent users from following themselves
followSchema.pre('save', function(next) {
  if (this.follower.toString() === this.following.toString()) {
    const error = new Error('Users cannot follow themselves');
    error.status = 400;
    return next(error);
  }
  next();
});

const Follow = mongoose.model("Follow", followSchema);
module.exports = Follow;
