const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const rewardConfigSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["referral", "like", "comment"],
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const RewardConfig = mongoose.model("RewardConfig", rewardConfigSchema);

module.exports = RewardConfig;
