const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // receiver
    type: {
      type: String,
      enum: ["like", "comment", "follow", "referral", "reward"],
      required: true,
    },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // who caused it
    actors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    targetId: { type: String }, // related entity id (postId, referralId, etc.)
    targetType: {
      type: String,
      enum: ["post", "user", "referral", "token", undefined],
    },
    message: { type: String },
    meta: { type: Object },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

NotificationSchema.index({ user: 1, _id: -1 });
NotificationSchema.index({ user: 1, isRead: 1 });

module.exports = mongoose.model("Notification", NotificationSchema);
