const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const referralSchema = new Schema(
  {
    referrer: { type: Schema.Types.ObjectId, ref: "User", required: true }, // who invited
    referee: { type: Schema.Types.ObjectId, ref: "User", required: true }, // who joined
    referralCode: { type: String, required: true }, // code used
    status: { type: String, enum: ["pending", "rewarded"], default: "pending" },
    rewardedAt: { type: Date },
  },
  { timestamps: true }
);

const Referral = mongoose.model("Referral", referralSchema);
module.exports = Referral;
