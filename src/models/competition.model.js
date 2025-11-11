const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const competitionSchema = new Schema(
  {
    // Competition date (YYYY-MM-DD format for easy querying)
    date: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Competition status
    status: {
      type: String,
      enum: ["upcoming", "active", "completed", "cancelled"],
      default: "upcoming",
      index: true,
    },
    // Entry fee in tokens
    entryFee: {
      type: Number,
      required: true,
      default: 10,
    },
    // Total prize pool (sum of all entry fees)
    prizePool: {
      type: Number,
      default: 0,
    },
    // Start and end times
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
      index: true,
    },
    // Entry window times
    entryStartTime: {
      type: Date,
      required: true,
    },
    entryEndTime: {
      type: Date,
      required: true,
    },
    // Statistics
    totalEntries: {
      type: Number,
      default: 0,
    },
    totalVotes: {
      type: Number,
      default: 0,
    },
    // Winners (populated after competition ends)
    winners: {
      first: {
        entryId: { type: Schema.Types.ObjectId, ref: "CompetitionEntry" },
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        votes: { type: Number, default: 0 },
        prize: { type: Number, default: 0 },
      },
      second: {
        entryId: { type: Schema.Types.ObjectId, ref: "CompetitionEntry" },
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        votes: { type: Number, default: 0 },
        prize: { type: Number, default: 0 },
      },
      third: {
        entryId: { type: Schema.Types.ObjectId, ref: "CompetitionEntry" },
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        votes: { type: Number, default: 0 },
        prize: { type: Number, default: 0 },
      },
    },
    // Prize distribution completed flag
    prizesDistributed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
competitionSchema.index({ date: 1, status: 1 });
competitionSchema.index({ startTime: 1, endTime: 1 });

const Competition = mongoose.model("Competition", competitionSchema);
module.exports = Competition;
