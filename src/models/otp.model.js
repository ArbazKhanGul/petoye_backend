const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const otpSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["email", "phone", "forgot"],
      required: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
    expiration: {
      type: Date,
      required: true,
    },
    status: {
      type: Boolean,
      default: false, // true means used, false means pending
    },
  },
  { timestamps: true }
);

const Otp = mongoose.model("Otp", otpSchema);
module.exports = Otp;
