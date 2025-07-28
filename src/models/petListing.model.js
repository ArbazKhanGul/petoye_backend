const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const petListingSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    currencyCode: {
      type: String,
      required: true,
      trim: true,
    },
    currencySymbol: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      trim: true,
    },
    age: {
      type: Number,
    },
    weight: {
      type: String,
      trim: true,
    },
    isVaccinated: {
      type: Boolean,
      default: false,
    },
    personalityTraits: [
      {
        type: String,
        trim: true,
      },
    ],
    favoriteActivities: [
      {
        type: String,
        trim: true,
      },
    ],
    mediaFiles: [
      {
        url: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ["image", "video"],
          required: true,
        },
        name: {
          type: String,
        },
        size: {
          type: Number,
        },
        // Optional thumbnail for videos
        thumbnail: {
          type: String,
        },
      },
    ],
    status: {
      type: String,
      enum: ["active", "sold", "unavailable"],
      default: "active",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    location: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const PetListing = mongoose.model("PetListing", petListingSchema);

module.exports = PetListing;
