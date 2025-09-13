const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tokenTransactionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true }, // the user who earned tokens
    amount: { type: Number, required: true }, // positive for earn, negative for spend
    type: {
      type: String,
      enum: ["like", "referral"],
      required: true,
    },
    relatedId: { type: Schema.Types.ObjectId }, // e.g., postId for like, userId for referral, etc.
    metadata: {
      // Additional tracking data
      likerId: { type: Schema.Types.ObjectId, ref: "User" }, // Who gave the like (for like rewards)
      likeId: { type: Schema.Types.ObjectId, ref: "Like" }, // Specific like ID
      referrerId: { type: Schema.Types.ObjectId, ref: "User" }, // Who made the referral
      // Can add more tracking fields as needed
    },
  },
  { timestamps: true }
);

// Index for efficient reward checking
tokenTransactionSchema.index({
  user: 1,
  type: 1,
  relatedId: 1,
  "metadata.likerId": 1,
});

const TokenTransaction = mongoose.model(
  "TokenTransaction",
  tokenTransactionSchema
);
module.exports = TokenTransaction;
