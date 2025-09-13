const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const rewardConfigSchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        "referral",
        "like",
        "daily_checkin",
        "profile_complete",
        "share_content",
        "weekly_challenge",
      ],
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["action", "achievement", "referral"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "coming_soon", "disabled"],
      default: "active",
    },
    hasAction: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const RewardConfig = mongoose.model("RewardConfig", rewardConfigSchema);

module.exports = RewardConfig;
