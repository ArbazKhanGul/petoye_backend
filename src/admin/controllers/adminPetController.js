const PetListing = require("../../models/petListing.model");
const { User } = require("../../models");
const AppError = require("../../errors/appError");

// Get all pet listings with pagination and filters
exports.getAllPetListings = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      status = "",
      type = "",
      gender = "",
      isVaccinated = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      ownerId = "",
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }
    if (status) query.status = status;
    if (type) query.type = type;
    if (gender) query.gender = gender;
    if (isVaccinated !== "") query.isVaccinated = isVaccinated === "true";
    if (ownerId) query.owner = ownerId;

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const petListings = await PetListing.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip)
      .populate("owner", "fullName username profileImage email");

    const total = await PetListing.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        petListings,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get single pet listing by ID
exports.getPetListingById = async (req, res, next) => {
  try {
    const { petId } = req.params;

    const petListing = await PetListing.findById(petId).populate(
      "owner",
      "fullName username profileImage email phoneNumber"
    );

    if (!petListing) {
      return next(new AppError("Pet listing not found", 404));
    }

    res.status(200).json({
      success: true,
      data: { petListing },
    });
  } catch (error) {
    next(error);
  }
};

// Update pet listing
exports.updatePetListing = async (req, res, next) => {
  try {
    const { petId } = req.params;
    const updateData = req.body;

    const petListing = await PetListing.findById(petId);
    if (!petListing) {
      return next(new AppError("Pet listing not found", 404));
    }

    // Update fields
    const allowedFields = [
      "name",
      "gender",
      "price",
      "currencyCode",
      "currencySymbol",
      "description",
      "location",
      "type",
      "age",
      "weight",
      "isVaccinated",
      "personalityTraits",
      "favoriteActivities",
      "status",
    ];

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        petListing[field] = updateData[field];
      }
    });

    petListing.updatedAt = new Date();
    await petListing.save();

    res.status(200).json({
      success: true,
      message: "Pet listing updated successfully",
      data: { petListing },
    });
  } catch (error) {
    next(error);
  }
};

// Delete pet listing
exports.deletePetListing = async (req, res, next) => {
  try {
    const { petId } = req.params;

    const petListing = await PetListing.findById(petId);
    if (!petListing) {
      return next(new AppError("Pet listing not found", 404));
    }

    await PetListing.findByIdAndDelete(petId);

    res.status(200).json({
      success: true,
      message: "Pet listing deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Update pet listing status
exports.updatePetListingStatus = async (req, res, next) => {
  try {
    const { petId } = req.params;
    const { status } = req.body;

    if (!["active", "sold", "unavailable"].includes(status)) {
      return next(
        new AppError(
          "Invalid status. Must be active, sold, or unavailable",
          400
        )
      );
    }

    const petListing = await PetListing.findById(petId);
    if (!petListing) {
      return next(new AppError("Pet listing not found", 404));
    }

    petListing.status = status;
    petListing.updatedAt = new Date();
    await petListing.save();

    res.status(200).json({
      success: true,
      message: "Pet listing status updated successfully",
      data: { petListing },
    });
  } catch (error) {
    next(error);
  }
};

// Get pet listing statistics
exports.getPetListingStats = async (req, res, next) => {
  try {
    const totalListings = await PetListing.countDocuments();
    const activeListings = await PetListing.countDocuments({ status: "active" });
    const soldListings = await PetListing.countDocuments({ status: "sold" });
    const unavailableListings = await PetListing.countDocuments({
      status: "unavailable",
    });

    // Get new listings in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newListings = await PetListing.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Get new listings in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthlyNewListings = await PetListing.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Get vaccinated pets
    const vaccinatedPets = await PetListing.countDocuments({
      isVaccinated: true,
    });

    // Get listings by type
    const listingsByType = await PetListing.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Get listings by gender
    const listingsByGender = await PetListing.aggregate([
      {
        $group: {
          _id: "$gender",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get most viewed listings
    const mostViewedListings = await PetListing.find()
      .sort({ viewsCount: -1 })
      .limit(10)
      .populate("owner", "fullName username profileImage");

    // Get most interested listings
    const mostInterestedListings = await PetListing.find()
      .sort({ interestsCount: -1 })
      .limit(10)
      .populate("owner", "fullName username profileImage");

    res.status(200).json({
      success: true,
      data: {
        totalListings,
        activeListings,
        soldListings,
        unavailableListings,
        newListingsLast7Days: newListings,
        newListingsLast30Days: monthlyNewListings,
        vaccinatedPets,
        listingsByType,
        listingsByGender,
        mostViewedListings,
        mostInterestedListings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get pet listings by owner
exports.getPetListingsByOwner = async (req, res, next) => {
  try {
    const { ownerId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const owner = await User.findById(ownerId);
    if (!owner) {
      return next(new AppError("Owner not found", 404));
    }

    const petListings = await PetListing.find({ owner: ownerId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate("owner", "fullName username profileImage");

    const total = await PetListing.countDocuments({ owner: ownerId });

    res.status(200).json({
      success: true,
      data: {
        owner: {
          _id: owner._id,
          fullName: owner.fullName,
          username: owner.username,
          profileImage: owner.profileImage,
        },
        petListings,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete multiple pet listings
exports.deleteMultiplePetListings = async (req, res, next) => {
  try {
    const { petIds } = req.body;

    if (!Array.isArray(petIds) || petIds.length === 0) {
      return next(new AppError("Pet IDs array is required", 400));
    }

    const result = await PetListing.deleteMany({ _id: { $in: petIds } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} pet listings deleted successfully`,
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Search pet listings
exports.searchPetListings = async (req, res, next) => {
  try {
    const { query, limit = 20 } = req.query;

    if (!query) {
      return next(new AppError("Search query is required", 400));
    }

    const petListings = await PetListing.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { location: { $regex: query, $options: "i" } },
        { type: { $regex: query, $options: "i" } },
      ],
    })
      .limit(parseInt(limit))
      .populate("owner", "fullName username profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { petListings },
    });
  } catch (error) {
    next(error);
  }
};
