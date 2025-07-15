const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tokenTransactionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true }, // the user who earned tokens
    amount: { type: Number, required: true }, // positive for earn, negative for spend
    type: {
      type: String,
      enum: ["like", "referral", "comment"],
      required: true,
    },
    relatedId: { type: Schema.Types.ObjectId }, // e.g., postId for like, userId for referral, etc.
  },
  { timestamps: true }
);

const TokenTransaction = mongoose.model(
  "TokenTransaction",
  tokenTransactionSchema
);
module.exports = TokenTransaction;
