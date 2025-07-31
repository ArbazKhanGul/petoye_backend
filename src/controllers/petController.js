const AppError = require("../errors/appError");
const { PetListing, User } = require("../models");

/**
 * Create a new pet listing
 */
exports.createPetListing = async (req, res, next) => {
  try {
    const {
      name,
      gender,
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
      location,
      mediaTypes,
    } = req.body;

    // Get user ID from auth middleware
    const userId = req.user._id;

    // Process uploaded files
    let mediaFiles = [];
    if (req.files && (req.files["mediaFiles"] || req.files["thumbnails"])) {
      const mediaArr = req.files["mediaFiles"] || [];
      const thumbArr = req.files["thumbnails"] || [];
      // Parse mediaTypes if sent as JSON string
      let parsedMediaTypes = mediaTypes;
      if (typeof mediaTypes === "string") {
        try {
          parsedMediaTypes = JSON.parse(mediaTypes);
        } catch {
          parsedMediaTypes = mediaTypes.split(",");
        }
      }
      mediaFiles = mediaArr.map((file, index) => {
        const relativePath = `/images/petlisting/${file.filename}`;
        let fileType =
          parsedMediaTypes && Array.isArray(parsedMediaTypes)
            ? parsedMediaTypes[index]
            : file.mimetype.startsWith("image/")
            ? "image"
            : "video";
        const mediaObject = {
          url: relativePath,
          type: fileType,
          name: file.originalname,
          size: file.size,
        };
        // If it's a video and a thumbnail was uploaded, associate it
        if (fileType === "video" && thumbArr[index]) {
          mediaObject.thumbnail = `/images/petlisting/${thumbArr[index].filename}`;
        }
        return mediaObject;
      });
    }

    // Create new pet listing
    const petListing = await PetListing.create({
      name,
      gender,
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
      location,
      mediaFiles,
      owner: userId,
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
    const filter = { status };

    // Optional type filter
    if (req.query.type) {
      filter.type = req.query.type;
    }

    // Optional gender filter
    if (req.query.gender) {
      filter.gender = req.query.gender;
    }

    // Optional price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
    }

    // Optional location filter
    if (req.query.location) {
      filter.location = { $regex: req.query.location, $options: "i" };
    }

    // Optional age filter (exact or range)
    if (req.query.age) {
      filter.age = Number(req.query.age);
    } else {
      if (req.query.minAge || req.query.maxAge) {
        filter.age = {};
        if (req.query.minAge) filter.age.$gte = Number(req.query.minAge);
        if (req.query.maxAge) filter.age.$lte = Number(req.query.maxAge);
      }
    }

    // Optional weight filter
    if (req.query.weight) {
      filter.weight = req.query.weight;
    }

    // Optional isVaccinated filter
    if (req.query.isVaccinated !== undefined) {
      filter.isVaccinated = req.query.isVaccinated === "true";
    }

    // Optional personalityTraits filter (array, match any)
    if (req.query.personalityTraits) {
      const traits = Array.isArray(req.query.personalityTraits)
        ? req.query.personalityTraits
        : req.query.personalityTraits.split(",");
      filter.personalityTraits = { $in: traits };
    }

    // Optional favoriteActivities filter (array, match any)
    if (req.query.favoriteActivities) {
      const favs = Array.isArray(req.query.favoriteActivities)
        ? req.query.favoriteActivities
        : req.query.favoriteActivities.split(",");
      filter.favoriteActivities = { $in: favs };
    }

    // Optional createdAt filter (date range)
    if (req.query.createdAfter || req.query.createdBefore) {
      filter.createdAt = {};
      if (req.query.createdAfter)
        filter.createdAt.$gte = new Date(req.query.createdAfter);
      if (req.query.createdBefore)
        filter.createdAt.$lte = new Date(req.query.createdBefore);
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
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        petListings,
        pagination: {
          page,
          limit,
          totalPages,
          totalResults: total,
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
    console.log("🚀 ~ petListing:", petListing);

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
    if (petListing.owner.toString() !== req.user._id) {
      return next(
        new AppError("You are not authorized to update this listing", 403)
      );
    }

    // --- Handle media file uploads (if any) ---
    let mediaFiles = petListing.mediaFiles; // default: keep old
    if (req.files && (req.files["mediaFiles"] || req.files["thumbnails"])) {
      const mediaArr = req.files["mediaFiles"] || [];
      const thumbArr = req.files["thumbnails"] || [];
      // Parse mediaTypes if sent as JSON string
      let parsedMediaTypes = req.body.mediaTypes;
      if (typeof parsedMediaTypes === "string") {
        try {
          parsedMediaTypes = JSON.parse(parsedMediaTypes);
        } catch {
          parsedMediaTypes = parsedMediaTypes.split(",");
        }
      }
      mediaFiles = mediaArr.map((file, index) => {
        const relativePath = `/images/petlisting/${file.filename}`;
        let fileType =
          parsedMediaTypes && Array.isArray(parsedMediaTypes)
            ? parsedMediaTypes[index]
            : file.mimetype.startsWith("image/")
            ? "image"
            : "video";
        const mediaObject = {
          url: relativePath,
          type: fileType,
          name: file.originalname,
          size: file.size,
        };
        if (fileType === "video" && thumbArr[index]) {
          mediaObject.thumbnail = `/images/petlisting/${thumbArr[index].filename}`;
        }
        return mediaObject;
      });
    }

    // Build update object
    const updateFields = {
      ...req.body,
      mediaFiles,
    };

    // Actually update
    const updatedListing = await PetListing.findByIdAndUpdate(
      req.params.id,
      updateFields,
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
    if (petListing.owner.toString() !== req.user._id) {
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
    const userId = req.user._id;

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
