const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const likeSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    // To track the post owner for token distribution
    postOwner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index to ensure a user can only like a post once
likeSchema.index({ user: 1, post: 1 }, { unique: true });

// Index for efficiently querying likes by post (for pagination)
likeSchema.index({ post: 1, createdAt: -1 });

// Index for querying by postOwner (for token distribution)
likeSchema.index({ postOwner: 1 });

const Like = mongoose.model("Like", likeSchema);
module.exports = Like;
