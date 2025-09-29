const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: function () {
        // Content is required for text messages, optional for media messages
        return this.messageType === "text";
      },
      trim: true,
      maxlength: 2000,
    },
    messageType: {
      type: String,
      enum: ["text", "media"],
      default: "text",
    },
    // For media messages
    mediaUrl: {
      type: String,
    },
    mediaType: {
      type: String,
      enum: ["image", "video", "audio", "file"],
    },
    // Simple read tracking
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    // Track who deleted the message (soft delete)
    deletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Basic indexes
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

module.exports = mongoose.model("Message", messageSchema);
