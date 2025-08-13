const mongoose = require("mongoose");

const MediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    type: {
      type: String,
      enum: ["image", "video", "document"],
      required: true,
    },
    size: { type: Number },
    mimeType: { type: String },
    thumbnail: { type: String },
  },
  { _id: false }
);

const MessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "image", "video", "document"],
      default: "text",
    },
    text: { type: String, default: "" },
    media: { type: MediaSchema },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

MessageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model("Message", MessageSchema);
