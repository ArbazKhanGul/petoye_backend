const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const competitionVoteSchema = new Schema(
  {
    // Reference to competition
    competitionId: {
      type: Schema.Types.ObjectId,
      ref: "Competition",
      required: true,
      index: true,
    },
    // Reference to entry being voted for
    entryId: {
      type: Schema.Types.ObjectId,
      ref: "CompetitionEntry",
      required: true,
      index: true,
    },
    // User who voted
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Device fingerprint for security
    deviceFingerprint: {
      type: String,
      required: true,
      index: true,
    },
    // Device details for fraud detection
    deviceInfo: {
      deviceId: String, // ANDROID_ID or iOS UUID from Keychain
      deviceModel: String,
      osVersion: String,
      platform: {
        type: String,
        enum: ["android", "ios"],
      },
    },
    // Network information (for pattern analysis)
    ipAddress: {
      type: String,
    },
    // Vote validation status
    isValid: {
      type: Boolean,
      default: true,
    },
    flaggedForReview: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one vote per user per entry
competitionVoteSchema.index(
  { competitionId: 1, entryId: 1, userId: 1 },
  { unique: true }
);

// Index for fraud detection queries
competitionVoteSchema.index({ deviceFingerprint: 1, competitionId: 1 });
competitionVoteSchema.index({ ipAddress: 1, competitionId: 1 });

const CompetitionVote = mongoose.model(
  "CompetitionVote",
  competitionVoteSchema
);
module.exports = CompetitionVote;
