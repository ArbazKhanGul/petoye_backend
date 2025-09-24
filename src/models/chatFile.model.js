const mongoose = require("mongoose");

const chatFileSchema = new mongoose.Schema(
  {
    // File information
    filename: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    path: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },

    // File metadata
    size: {
      type: Number,
      required: true,
      min: 0,
    },
    mimeType: {
      type: String,
      required: true,
    },
    mediaType: {
      type: String,
      required: true,
      enum: ["image", "video", "audio", "file"],
      index: true,
    },

    // Upload information
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const ChatFile = mongoose.model("ChatFile", chatFileSchema);

module.exports = ChatFile;
