const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const petListingSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: String, // Store as string to preserve exact format
      required: true,
      trim: true,
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
    type: {
      type: String,
      trim: true,
    },
    age: {
      type: String,
      trim: true,
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
        uri: {
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
