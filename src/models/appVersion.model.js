const mongoose = require("mongoose");

const appVersionSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ["android", "ios"],
      required: true,
    },
    minimumVersion: {
      type: String,
      required: true, // Force update below this version
      description: "Minimum app version required (force update below this)",
    },
    latestVersion: {
      type: String,
      required: true,
      description: "Latest app version available (soft update recommended)",
    },
    updateMessage: {
      type: String,
      default: "A new version of the app is available.",
    },
    forceUpdateMessage: {
      type: String,
      default: "You must update the app to continue using it.",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound unique index on platform
appVersionSchema.index({ platform: 1 }, { unique: true });

module.exports = mongoose.model("AppVersion", appVersionSchema);
