const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const competitionEntrySchema = new Schema(
  {
    // Reference to competition
    competitionId: {
      type: Schema.Types.ObjectId,
      ref: "Competition",
      required: true,
      index: true,
    },
    // User who submitted the entry
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // index: true,
    },
    // Pet details
    petName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    // Single photo (S3 URL)
    photoUrl: {
      type: String,
      required: true,
    },
    // Entry status
    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
      index: true,
    },
    // Vote count (denormalized for performance)
    votesCount: {
      type: Number,
      default: 0,
      index: true,
    },
    // Entry fee paid
    entryFeePaid: {
      type: Number,
      required: true,
    },
    // Refund status (if cancelled)
    refunded: {
      type: Boolean,
      default: false,
    },
    refundedAt: {
      type: Date,
    },
    // Final rank in competition (populated after competition ends)
    rank: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one entry per user per competition
competitionEntrySchema.index({ competitionId: 1, userId: 1 });

// Index for leaderboard queries
competitionEntrySchema.index({ competitionId: 1, votesCount: -1 });

const CompetitionEntry = mongoose.model(
  "CompetitionEntry",
  competitionEntrySchema
);
module.exports = CompetitionEntry;
