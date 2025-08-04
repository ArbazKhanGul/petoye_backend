const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      trim: true,
    },
    mediaFiles: [
      {
        url: {
          type: String, // path to media file
          required: true,
        },
        type: {
          type: String, // "image" or "video"
          required: true,
          enum: ["image", "video"],
        },
        thumbnail: {
          type: String, // path to thumbnail image for videos
          required: false,
        },
      },
    ],
    // Store counts directly for faster retrieval
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure that either content or mediaFiles array is present and not empty
postSchema.pre("validate", function (next) {
  if (
    (!this.content || this.content.trim() === "") &&
    (!this.mediaFiles || this.mediaFiles.length === 0)
  ) {
    this.invalidate(
      "content",
      "Post must have either text content or media files"
    );
  }
  next();
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
