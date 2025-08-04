const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const commentSchema = new Schema(
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
    content: {
      type: String,
      required: true,
      trim: true,
    },
    // For nested comments (replies)
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    // For quick access to top-level comments
    isReply: {
      type: Boolean,
      default: false,
    },
    // Track if comment has been edited
    isEdited: {
      type: Boolean,
      default: false,
    },
    // Likes functionality removed temporarily
    // likes: [
    //   {
    //     type: Schema.Types.ObjectId,
    //     ref: "User"
    //   }
    // ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for getting replies to a comment
commentSchema.virtual("replies", {
  ref: "Comment",
  localField: "_id",
  foreignField: "parentComment",
});

const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;
