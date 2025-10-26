const AppError = require("../errors/appError");
const { PetListing, User, Follow, PetView } = require("../models");
const { Types } = require("mongoose");

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

      // Check for thumbnail mapping information
      const thumbnailMapping = {};

      // Debug log all request body fields and thumbnails
      console.log("Pet listing - Request body fields:", Object.keys(req.body));
      console.log(`Pet listing - Received ${thumbArr.length} thumbnail files`);

      // Process thumbnail mappings
      Object.keys(req.body).forEach((key) => {
        if (key.startsWith("thumbnail_for_video_")) {
          try {
            const videoIndex = parseInt(
              key.replace("thumbnail_for_video_", "")
            );
            const mapInfo = JSON.parse(req.body[key]);
            console.log(
              `Pet listing - Found mapping for video at index ${videoIndex}:`,
              mapInfo
            );

            // Store the mapping - index to thumbnail file
            if (thumbArr.length > 0) {
              thumbnailMapping[videoIndex] = thumbArr.shift(); // Get the next thumbnail in order
              console.log(
                `Pet listing - Associated thumbnail with video ${videoIndex}`
              );
            } else {
              console.warn(
                `Pet listing - No thumbnail available for video at index ${videoIndex}`
              );
            }
          } catch (err) {
            console.error(
              "Pet listing - Error parsing thumbnail mapping:",
              err
            );
          }
        }
      });

      // Parse mediaTypes if sent as JSON string
      let parsedMediaTypes = mediaTypes;
      if (typeof mediaTypes === "string") {
        try {
          parsedMediaTypes = JSON.parse(mediaTypes);
        } catch {
          parsedMediaTypes = mediaTypes.split(",");
        }
      }

      // Process all media files with their types and thumbnails
      mediaFiles = mediaArr.map((file, index) => {
        console.log(`🔍 Pet listing - Processing file ${index}:`, {
          cloudFrontUrl: file.cloudFrontUrl,
          location: file.location,
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
        });

        // Priority: CloudFront URL > S3 location > local path (same as posts)
        const mediaUrl =
          file.cloudFrontUrl ||
          file.location ||
          `/images/petlisting/${file.filename}`;

        // Determine file type with multiple fallbacks
        let fileType;

        // 1. Use explicitly provided mediaTypes array
        if (
          parsedMediaTypes &&
          Array.isArray(parsedMediaTypes) &&
          parsedMediaTypes[index]
        ) {
          fileType = parsedMediaTypes[index];
        }
        // 2. Use mimetype
        else if (file.mimetype) {
          fileType = file.mimetype.startsWith("image/") ? "image" : "video";
        }
        // 3. Use file extension as last resort
        else {
          const filename = file.originalname || file.filename;
          const isVideo = /\.(mp4|mov|avi|wmv|flv|mkv|webm)$/i.test(filename);
          fileType = isVideo ? "video" : "image";
        }

        console.log(
          `Pet listing - File ${index}: Type determined as ${fileType}, URL: ${mediaUrl}`
        );

        // Create media object
        const mediaObject = {
          url: mediaUrl,
          type: fileType,
          name: file.originalname,
          size: file.size,
        };

        // If it's a video, add thumbnail (prioritize CloudFront for thumbnails too)
        if (fileType === "video" || fileType.startsWith("video/")) {
          console.log(`Pet listing - Processing video at index ${index}`);

          // Check explicit mapping first (our new method)
          if (thumbnailMapping[index]) {
            console.log(
              `Pet listing - Using explicit thumbnail mapping for video ${index}`
            );
            const thumbFile = thumbnailMapping[index];
            mediaObject.thumbnail =
              thumbFile.cloudFrontUrl ||
              thumbFile.location ||
              `/images/petlisting/${thumbFile.filename}`;
            console.log(
              `Pet listing - Thumbnail path set: ${mediaObject.thumbnail}`
            );
          }
          // Fallback to old method
          else if (thumbArr.length > 0) {
            console.log(
              `Pet listing - Using fallback thumbnail for video ${index}`
            );
            // Use the next available thumbnail
            const thumbFile = thumbArr.shift();
            mediaObject.thumbnail =
              thumbFile.cloudFrontUrl ||
              thumbFile.location ||
              `/images/petlisting/${thumbFile.filename}`;
            console.log(
              `Pet listing - Fallback thumbnail path set: ${mediaObject.thumbnail}`
            );
          } else {
            console.log(
              `Pet listing - No thumbnail available for video ${index}`
            );
          }
        }

        return mediaObject;
      });

      // Log the final media files array for debugging
      console.log(
        "Pet listing - Final mediaFiles array:",
        JSON.stringify(mediaFiles, null, 2)
      );
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

      console.log("Pet Update - Received files:", {
        mediaCount: mediaArr.length,
        thumbnailCount: thumbArr.length,
      });

      // Check for thumbnail mapping information
      const thumbnailMapping = {};

      // Process thumbnail mappings from form data
      Object.keys(req.body).forEach((key) => {
        if (key.startsWith("thumbnail_for_video_")) {
          try {
            const videoIndex = parseInt(
              key.replace("thumbnail_for_video_", "")
            );
            const mapInfo = JSON.parse(req.body[key]);
            console.log(
              `Pet Update - Found mapping for video at index ${videoIndex}:`,
              mapInfo
            );

            // Store the mapping - index to thumbnail file
            if (thumbArr.length > 0) {
              thumbnailMapping[videoIndex] = thumbArr.shift(); // Get the next thumbnail in order
              console.log(
                `Pet Update - Associated thumbnail with video ${videoIndex}`
              );
            }
          } catch (err) {
            console.error("Pet Update - Error parsing thumbnail mapping:", err);
          }
        }
      });

      // Parse mediaTypes if sent as JSON string
      let parsedMediaTypes = req.body.mediaTypes;
      if (typeof parsedMediaTypes === "string") {
        try {
          parsedMediaTypes = JSON.parse(parsedMediaTypes);
          console.log("Pet Update - Parsed media types:", parsedMediaTypes);
        } catch (err) {
          console.error("Pet Update - Error parsing mediaTypes:", err);
          parsedMediaTypes = parsedMediaTypes.split(",");
        }
      }

      // Process all media files with their types and thumbnails
      mediaFiles = mediaArr.map((file, index) => {
        console.log(`🔍 Pet Update - Processing file ${index}:`, {
          cloudFrontUrl: file.cloudFrontUrl,
          location: file.location,
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
        });

        // Priority: CloudFront URL > S3 location > local path (same as posts)
        const mediaUrl =
          file.cloudFrontUrl ||
          file.location ||
          `/images/petlisting/${file.filename}`;

        // Determine file type with multiple fallbacks
        let fileType;

        // 1. Use explicitly provided mediaTypes array
        if (
          parsedMediaTypes &&
          Array.isArray(parsedMediaTypes) &&
          parsedMediaTypes[index]
        ) {
          fileType = parsedMediaTypes[index];
        }
        // 2. Use mimetype
        else if (file.mimetype) {
          fileType = file.mimetype.startsWith("image/") ? "image" : "video";
        }
        // 3. Use file extension as last resort
        else {
          const filename = file.originalname || file.filename;
          const isVideo = /\.(mp4|mov|avi|wmv|flv|mkv|webm)$/i.test(filename);
          fileType = isVideo ? "video" : "image";
        }

        console.log(
          `Pet Update - File ${index}: Type determined as ${fileType}, URL: ${mediaUrl}`
        );

        const mediaObject = {
          url: mediaUrl,
          type: fileType,
          name: file.originalname,
          size: file.size,
        };

        // If it's a video, add thumbnail (prioritize CloudFront for thumbnails too)
        if (fileType === "video") {
          // Check explicit mapping first (our new method)
          if (thumbnailMapping[index]) {
            console.log(
              `Pet Update - Using explicit thumbnail mapping for video ${index}`
            );
            const thumbFile = thumbnailMapping[index];
            mediaObject.thumbnail =
              thumbFile.cloudFrontUrl ||
              thumbFile.location ||
              `/images/petlisting/${thumbFile.filename}`;
            console.log(
              `Pet Update - Thumbnail path set: ${mediaObject.thumbnail}`
            );
          }
          // Fallback to old method
          else if (thumbArr.length > 0) {
            console.log(
              `Pet Update - Using fallback thumbnail for video ${index}`
            );
            // Use the next available thumbnail
            const thumbFile = thumbArr.shift();
            mediaObject.thumbnail =
              thumbFile.cloudFrontUrl ||
              thumbFile.location ||
              `/images/petlisting/${thumbFile.filename}`;
            console.log(
              `Pet Update - Fallback thumbnail path set: ${mediaObject.thumbnail}`
            );
          } else {
            console.log(
              `Pet Update - No thumbnail available for video ${index}`
            );
          }
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
    console.log("Delete request received for pet ID:", req.params.id);
    console.log("User from auth middleware:", req.user._id);

    const petListing = await PetListing.findById(req.params.id);

    if (!petListing) {
      console.log("Pet listing not found for ID:", req.params.id);
      return next(new AppError("Pet listing not found", 404));
    }

    console.log("Pet listing owner:", petListing.owner);
    console.log("Current user:", req.user._id);
    console.log(
      "Owner comparison result:",
      petListing.owner.toString() === req.user._id
    );

    // Verify ownership
    if (petListing.owner.toString() !== req.user._id) {
      console.log("Authorization failed - user is not the owner");
      return next(
        new AppError("You are not authorized to delete this listing", 403)
      );
    }

    console.log("Deleting pet listing...");
    await PetListing.findByIdAndDelete(req.params.id);

    console.log("Pet listing deleted successfully");
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

/**
 * Get pet listings by user ID
 * @route GET /api/pets/user/:id
 */
exports.getUserPetListings = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Only show active listings for other users
    const filter = { owner: userId, status: "active" };

    const totalListings = await PetListing.countDocuments(filter);
    const petListings = await PetListing.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("owner", "fullName profileImage country");

    res.status(200).json({
      success: true,
      data: {
        petListings,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalListings / limit),
          totalResults: totalListings,
        },
      },
    });
  } catch (error) {
    console.error("Error getting user pet listings:", error);
    return next(new AppError("Failed to get user pet listings", 500));
  }
};

/**
 * Personalized pet feed (similar to post feed algorithm)
 * - Prioritizes pets from followed users
 * - Excludes viewed pets
 * - Uses denormalized viewsCount/interestsCount
 * - Per-facet $skip then $limit (no global skip after merge)
 * - Deterministic ordering (no $rand) → stable pagination
 * - Fallback #1 (viewed) and #2 (global) support offsets
 * - Supports filters: type, gender, price, location, age, weight, isVaccinated, personalityTraits, favoriteActivities
 * @route GET /api/pets/feed?limit=10&skip=0&f1Offset=0&f2Offset=0&type=dog&gender=male&minPrice=100&maxPrice=1000
 */
exports.getPetFeed = async (req, res, next) => {
  try {
    // ---- Params & tunables ----
    const userId = new Types.ObjectId(String(req.user._id));
    const limit = Math.max(1, parseInt(req.query.limit) || 10);

    // fresh pagination via per-facet skip
    const rawSkip = parseInt(req.query.skip);
    const skip = Number.isFinite(rawSkip) && rawSkip > 0 ? rawSkip : 0;

    // fallback offsets (continue across requests after fresh is exhausted)
    const f1Offset = Math.max(0, parseInt(req.query.f1Offset) || 0);
    const f2Offset = Math.max(0, parseInt(req.query.f2Offset) || 0);
    const FOLLOWER_RATIO = 1; // follower content priority
    const WINDOW_DAYS = 30; // consider recent listings only (pets stay longer than posts)
    const VIEWED_NIN_CAP = 2000; // cap exclusion list for $nin
    const windowStart = new Date(
      Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000
    );

    // 1) Quotas per page
    const followerQuota = Math.ceil(limit * FOLLOWER_RATIO);

    // 2) Per-facet skips (proportional to overall skip)
    const followerSkip = skip;

    // ---- Build filter object from query params ----
    const additionalFilters = {};

    // Optional type filter (dog, cat, bird, etc.)
    if (req.query.type) {
      additionalFilters.type = req.query.type;
    }

    // Optional gender filter
    if (req.query.gender) {
      additionalFilters.gender = req.query.gender;
    }

    // Optional price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      additionalFilters.price = {};
      if (req.query.minPrice)
        additionalFilters.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice)
        additionalFilters.price.$lte = Number(req.query.maxPrice);
    }

    // Optional location filter (regex search)
    if (req.query.location) {
      additionalFilters.location = {
        $regex: req.query.location,
        $options: "i",
      };
    }

    // Optional age filter (exact or range)
    if (req.query.age) {
      additionalFilters.age = Number(req.query.age);
    } else {
      if (req.query.minAge || req.query.maxAge) {
        additionalFilters.age = {};
        if (req.query.minAge)
          additionalFilters.age.$gte = Number(req.query.minAge);
        if (req.query.maxAge)
          additionalFilters.age.$lte = Number(req.query.maxAge);
      }
    }

    // Optional weight filter
    if (req.query.weight) {
      additionalFilters.weight = req.query.weight;
    }

    // Optional isVaccinated filter
    if (req.query.isVaccinated !== undefined) {
      additionalFilters.isVaccinated = req.query.isVaccinated === "true";
    }

    // Optional personalityTraits filter (array, match any)
    if (req.query.personalityTraits) {
      const traits = Array.isArray(req.query.personalityTraits)
        ? req.query.personalityTraits
        : req.query.personalityTraits.split(",");
      additionalFilters.personalityTraits = { $in: traits };
    }

    // Optional favoriteActivities filter (array, match any)
    if (req.query.favoriteActivities) {
      const favs = Array.isArray(req.query.favoriteActivities)
        ? req.query.favoriteActivities
        : req.query.favoriteActivities.split(",");
      additionalFilters.favoriteActivities = { $in: favs };
    }

    console.log("🐾 ~ Pet feed filters applied:", additionalFilters);

    // ---- Parallel user context ----
    const [viewedRaw, follows] = await Promise.all([
      PetView.getUserViewedPets(userId, 14), // array of PetListing _ids seen recently
      Follow.find({ follower: userId }).select("following"),
    ]);

    // ---- Cast ids to ObjectId ----
    const viewedPetIds = (viewedRaw || [])
      .map((id) => new Types.ObjectId(String(id)))
      .slice(0, VIEWED_NIN_CAP);

    const followingIds = (follows || []).map(
      (f) => new Types.ObjectId(String(f.following))
    );

    // Include current user's own listings in the feed
    followingIds.push(userId);

    // ---- Index-friendly base filter (reused in facets) ----
    const baseMatch = {
      status: "active", // Only show active pet listings
      _id: { $nin: viewedPetIds },
      ...additionalFilters, // Apply user filters
    };

    // ---- Faceted ranking: follower vs discovery (per-facet skip/limit) ----
    const facetStage = {
      $facet: {
        follower: [
          { $match: { ...baseMatch, owner: { $in: followingIds } } },
          {
            $set: {
              viewsCount: { $ifNull: ["$viewsCount", 0] },
              interestsCount: { $ifNull: ["$interestsCount", 0] },
            },
          },
          {
            $addFields: {
              recencyScore: {
                $max: [
                  0,
                  {
                    $subtract: [
                      300, // Higher base for pets since they stay relevant longer
                      {
                        $divide: [
                          { $subtract: [new Date(), "$createdAt"] },
                          3600000,
                        ],
                      },
                    ],
                  },
                ],
              },
              engagementScore: {
                $add: [
                  { $multiply: ["$viewsCount", 2] },
                  { $multiply: ["$interestsCount", 5] },
                ],
              },
              finalScore: {
                $add: [2000, 500, "$recencyScore", "$engagementScore"],
              },
              isFollowerListing: true,
              isFresh: true,
            },
          },
          { $sort: { finalScore: -1, createdAt: -1, _id: -1 } },
          ...(followerSkip ? [{ $skip: followerSkip }] : []),
          { $limit: Math.max(0, followerQuota) },

          // Enrich with owner details
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
              pipeline: [
                {
                  $project: { fullName: 1, profileImage: 1, country: 1 },
                },
              ],
            },
          },
          {
            $set: {
              ownerDetails: {
                $ifNull: [{ $arrayElemAt: ["$ownerDetails", 0] }, null],
              },
            },
          },

          {
            $project: {
              _id: 1,
              name: 1,
              gender: 1,
              price: 1,
              currencyCode: 1,
              currencySymbol: 1,
              description: 1,
              location: 1,
              type: 1,
              age: 1,
              weight: 1,
              isVaccinated: 1,
              personalityTraits: 1,
              favoriteActivities: 1,
              mediaFiles: 1,
              status: 1,
              createdAt: 1,
              updatedAt: 1,
              ownerId: "$owner",
              ownerDetails: 1,
              viewsCount: 1,
              interestsCount: 1,
              isFollowerListing: 1,
              isFresh: 1,
            },
          },
        ],
      },
    };

    // ---- Get follower listings directly ----
    const freshListings = await PetListing.aggregate(
      [
        { $match: baseMatch },
        facetStage,
        { $project: { follower: 1 } },
        { $unwind: "$follower" },
        { $replaceRoot: { newRoot: "$follower" } },
      ],
      { allowDiskUse: true }
    );

    let finalListings = freshListings;

    // For fallbacks, exclude already chosen fresh IDs
    const excludeIdsSet = new Set(finalListings.map((p) => String(p._id)));
    console.log("🐾 ~ finalListings: before fallback 1", finalListings.length);

    // ---------------- Fallback #1: global (still short) ----------------
    let globalFallback = [];
    if (finalListings.length < limit) {
      const need = limit - finalListings.length;

      // Convert all existing listing IDs to ObjectId for exclusion
      const allExistingIds = [
        ...Array.from(excludeIdsSet).map((id) => new Types.ObjectId(id)),
        ...viewedPetIds,
      ];

      globalFallback = await PetListing.aggregate(
        [
          {
            $match: {
              owner: { $nin: followingIds }, // Exclude listings from followed users
              status: "active",
              _id: {
                $nin: allExistingIds,
              },
              ...additionalFilters, // Apply user filters to global fallback
            },
          },
          {
            $set: {
              viewsCount: { $ifNull: ["$viewsCount", 0] },
              interestsCount: { $ifNull: ["$interestsCount", 0] },
            },
          },
          // Deterministic ranking for cold-start fill
          {
            $addFields: {
              popScore: {
                $add: ["$viewsCount", { $multiply: ["$interestsCount", 3] }],
              },
              ageHrs: {
                $divide: [{ $subtract: [new Date(), "$createdAt"] }, 3600000],
              },
              jitter: {
                $mod: [
                  {
                    $convert: {
                      input: "$_id",
                      to: "long",
                      onError: 0,
                    },
                  },
                  25,
                ],
              },
              finalScore: {
                $add: [
                  { $min: ["$popScore", 200] },
                  {
                    $subtract: [150, { $min: [{ $floor: "$ageHrs" }, 150] }],
                  },
                  "$jitter",
                ],
              },
              isFollowerListing: { $in: ["$owner", followingIds] },
              isFresh: true,
            },
          },
          { $sort: { finalScore: -1, createdAt: -1, _id: -1 } },
          ...(f2Offset ? [{ $skip: f2Offset }] : []),
          { $limit: need },

          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
              pipeline: [
                { $project: { fullName: 1, profileImage: 1, country: 1 } },
              ],
            },
          },
          {
            $set: {
              ownerDetails: {
                $ifNull: [{ $arrayElemAt: ["$ownerDetails", 0] }, null],
              },
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              gender: 1,
              price: 1,
              currencyCode: 1,
              currencySymbol: 1,
              description: 1,
              location: 1,
              type: 1,
              age: 1,
              weight: 1,
              isVaccinated: 1,
              personalityTraits: 1,
              favoriteActivities: 1,
              mediaFiles: 1,
              status: 1,
              createdAt: 1,
              updatedAt: 1,
              ownerId: "$owner",
              ownerDetails: 1,
              viewsCount: 1,
              interestsCount: 1,
              isFollowerListing: 1,
              isFresh: 1,
            },
          },
        ],
        { allowDiskUse: true }
      );

      finalListings = [...finalListings, ...globalFallback];
      globalFallback = globalFallback || [];
    }

    console.log("🐾 ~ finalListings: before fallback 2", finalListings.length);

    // ---------------- Fallback #2: previously viewed (not fresh) ----------------
    let viewedFallback = [];
    if (finalListings.length < limit && viewedPetIds.length > 0) {
      const need = limit - finalListings.length;

      // Exclude fresh and global fallback IDs
      finalListings.forEach((listing) =>
        excludeIdsSet.add(String(listing._id))
      );
      const alreadyChosenIds = Array.from(excludeIdsSet).map(
        (id) => new Types.ObjectId(id)
      );

      viewedFallback = await PetListing.aggregate(
        [
          {
            $match: {
              status: "active",
              _id: {
                $in: viewedPetIds,
                $nin: alreadyChosenIds,
              },
              ...additionalFilters, // Apply user filters to viewed fallback
            },
          },
          {
            $set: {
              viewsCount: { $ifNull: ["$viewsCount", 0] },
              interestsCount: { $ifNull: ["$interestsCount", 0] },
            },
          },
          {
            $addFields: {
              popScore: {
                $add: ["$viewsCount", { $multiply: ["$interestsCount", 3] }],
              },
              ageHrs: {
                $divide: [{ $subtract: [new Date(), "$createdAt"] }, 3600000],
              },
              jitter: {
                $mod: [
                  {
                    $convert: {
                      input: "$_id",
                      to: "long",
                      onError: 0,
                    },
                  },
                  25,
                ],
              },
              finalScore: {
                $add: [
                  { $min: ["$popScore", 150] },
                  {
                    $subtract: [100, { $min: [{ $floor: "$ageHrs" }, 100] }],
                  },
                  "$jitter",
                ],
              },
              isFollowerListing: { $in: ["$owner", followingIds] },
              isFresh: false,
            },
          },
          { $sort: { finalScore: -1, createdAt: -1, _id: -1 } },
          ...(f1Offset ? [{ $skip: f1Offset }] : []),
          { $limit: need },

          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
              pipeline: [
                { $project: { fullName: 1, profileImage: 1, country: 1 } },
              ],
            },
          },
          {
            $set: {
              ownerDetails: {
                $ifNull: [{ $arrayElemAt: ["$ownerDetails", 0] }, null],
              },
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              gender: 1,
              price: 1,
              currencyCode: 1,
              currencySymbol: 1,
              description: 1,
              location: 1,
              type: 1,
              age: 1,
              weight: 1,
              isVaccinated: 1,
              personalityTraits: 1,
              favoriteActivities: 1,
              mediaFiles: 1,
              status: 1,
              createdAt: 1,
              updatedAt: 1,
              ownerId: "$owner",
              ownerDetails: 1,
              viewsCount: 1,
              interestsCount: 1,
              isFollowerListing: 1,
              isFresh: 1,
            },
          },
        ],
        { allowDiskUse: true }
      );

      finalListings = [...finalListings, ...viewedFallback];
      viewedFallback = viewedFallback || [];
    }

    console.log("🐾 ~ finalListings:", finalListings.length);

    // Track actual fresh listings consumed for accurate pagination
    const freshListingsConsumed = freshListings.length;

    // ---- Response ----
    res.status(200).json({
      success: true,
      data: {
        petListings: finalListings.slice(0, limit),
        pagination: {
          page: 1,
          limit,
          skip,
          hasNextPage: finalListings.length === limit,
          hasPrevPage: skip > 0,
          freshListingsConsumed,
          f1Returned: (viewedFallback || []).length,
          f2Returned: (globalFallback || []).length,
        },
      },
    });
  } catch (error) {
    console.error("🚨 Pet feed generation error:", error);
    next(error);
  }
};

/**
 * Mark pet listings as viewed (for tracking what user has seen)
 * @route POST /api/pets/mark-viewed
 */
exports.markPetListingsAsViewed = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { petListingIds } = req.body;
    console.log("🐾 ~ petListingIds: viewed", petListingIds);

    if (
      !petListingIds ||
      !Array.isArray(petListingIds) ||
      petListingIds.length === 0
    ) {
      return next(new AppError("petListingIds array is required", 400));
    }

    const results = [];

    // Mark each pet listing as viewed
    for (const petListingId of petListingIds) {
      try {
        const view = await PetView.markAsViewed(userId, petListingId);

        // Optionally increment viewsCount on the pet listing
        await PetListing.findByIdAndUpdate(petListingId, {
          $inc: { viewsCount: 1 },
        });

        results.push({
          petListingId,
          success: true,
          viewId: view._id,
        });
      } catch (error) {
        console.error(
          `Error marking pet listing ${petListingId} as viewed:`,
          error
        );
        results.push({
          petListingId,
          success: false,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Pet listings marked as viewed",
      data: {
        results,
        successCount: results.filter((r) => r.success).length,
        failureCount: results.filter((r) => !r.success).length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's view history for pet listings (for analytics/debugging)
 * @route GET /api/pets/view-history
 */
exports.getUserPetViewHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const totalViews = await PetView.countDocuments({ user: userId });
    const viewHistory = await PetView.find({ user: userId })
      .sort({ viewedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "petListing",
        select: "name type price mediaFiles createdAt owner",
        populate: {
          path: "owner",
          select: "fullName profileImage",
        },
      })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        viewHistory,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalViews / limit),
          totalResults: totalViews,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
