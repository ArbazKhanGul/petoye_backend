const AppError = require("../errors/appError");
const { PetListing, User } = require("../models");

/**
 * Create a new pet listing
 */
exports.createPetListing = async (req, res, next) => {
  try {
    const {
      name,
      price,
      currencyCode,
      currencySymbol,
      description,
      type,
      age,
      weight,
      isVaccinated,
      personalityTraits,
      favoriteActivities,
      mediaFiles,
    } = req.body;

    // Get user ID from auth middleware
    const userId = req.user.id;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Create new pet listing
    const petListing = await PetListing.create({
      name,
      price,
      currencyCode,
      currencySymbol,
      description,
      type,
      age,
      weight,
      isVaccinated,
      personalityTraits,
      favoriteActivities,
      mediaFiles,
      owner: userId,
      location: user.country, // Default to user's country
    });

    // Return success response
    res.status(201).json({
      success: true,
      message: "Pet listing created successfully",
      data: petListing,
    });
  } catch (error) {
    console.error("Error creating pet listing:", error);
    return next(new AppError("Failed to create pet listing", 500));
  }
};

/**
 * Get all pet listings
 */
exports.getAllPetListings = async (req, res, next) => {
  try {
    // Default to active listings only
    const status = req.query.status || "active";

    // Basic filtering
    const filter = { status };

    // Optional type filter
    if (req.query.type) {
      filter.type = req.query.type;
    }

    // Optional price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = req.query.minPrice;
      if (req.query.maxPrice) filter.price.$lte = req.query.maxPrice;
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get listings
    const petListings = await PetListing.find(filter)
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .populate("owner", "fullName profileImage country");

    // Count total
    const total = await PetListing.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        petListings,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Error getting pet listings:", error);
    return next(new AppError("Failed to get pet listings", 500));
  }
};

/**
 * Get a single pet listing
 */
exports.getPetListing = async (req, res, next) => {
  try {
    const petListing = await PetListing.findById(req.params.id).populate(
      "owner",
      "fullName profileImage country email phoneNumber"
    );

    if (!petListing) {
      return next(new AppError("Pet listing not found", 404));
    }

    res.status(200).json({
      success: true,
      data: petListing,
    });
  } catch (error) {
    console.error("Error getting pet listing:", error);
    return next(new AppError("Failed to get pet listing", 500));
  }
};

/**
 * Update a pet listing
 */
exports.updatePetListing = async (req, res, next) => {
  try {
    const petListing = await PetListing.findById(req.params.id);

    if (!petListing) {
      return next(new AppError("Pet listing not found", 404));
    }

    // Verify ownership
    if (petListing.owner.toString() !== req.user.id) {
      return next(
        new AppError("You are not authorized to update this listing", 403)
      );
    }

    // Update listing
    const updatedListing = await PetListing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Pet listing updated successfully",
      data: updatedListing,
    });
  } catch (error) {
    console.error("Error updating pet listing:", error);
    return next(new AppError("Failed to update pet listing", 500));
  }
};

/**
 * Delete a pet listing
 */
exports.deletePetListing = async (req, res, next) => {
  try {
    const petListing = await PetListing.findById(req.params.id);

    if (!petListing) {
      return next(new AppError("Pet listing not found", 404));
    }

    // Verify ownership
    if (petListing.owner.toString() !== req.user.id) {
      return next(
        new AppError("You are not authorized to delete this listing", 403)
      );
    }

    await PetListing.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Pet listing deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting pet listing:", error);
    return next(new AppError("Failed to delete pet listing", 500));
  }
};

/**
 * Get user's own pet listings
 */
exports.getMyPetListings = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get listings
    const petListings = await PetListing.find({ owner: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Count total
    const total = await PetListing.countDocuments({ owner: userId });

    res.status(200).json({
      success: true,
      data: {
        petListings,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Error getting my pet listings:", error);
    return next(new AppError("Failed to get your pet listings", 500));
  }
};

/**
 * Mark a pet as sold
 */
exports.markAsSold = async (req, res, next) => {
  try {
    const petListing = await PetListing.findById(req.params.id);

    if (!petListing) {
      return next(new AppError("Pet listing not found", 404));
    }

    // Verify ownership
    if (petListing.owner.toString() !== req.user.id) {
      return next(
        new AppError("You are not authorized to update this listing", 403)
      );
    }

    // Update status
    petListing.status = "sold";
    await petListing.save();

    res.status(200).json({
      success: true,
      message: "Pet marked as sold successfully",
      data: petListing,
    });
  } catch (error) {
    console.error("Error marking pet as sold:", error);
    return next(new AppError("Failed to update pet status", 500));
  }
};
