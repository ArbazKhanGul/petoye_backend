const mongoose = require("mongoose");

const ParticipantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { _id: false }
);

const ConversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [ParticipantSchema],
      required: true,
      validate: (v) => v.length >= 2,
    },
    lastMessage: {
      text: { type: String, default: "" },
      type: {
        type: String,
        enum: ["text", "image", "video", "document"],
        default: "text",
      },
      at: { type: Date },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    // Map of userId -> unread count
    unreadCounts: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

ConversationSchema.index({ "participants.user": 1, updatedAt: -1 });

module.exports = mongoose.model("Conversation", ConversationSchema);
