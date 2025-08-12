const { User } = require("../models");
const AppError = require("../errors/appError");

/**
 * Get current user profile
 * @route GET /api/profile
 */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -refreshTokens -fcmTokens"
    );

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * @route PUT /api/profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const updates = req.body;

    // Fields that can be updated
    const allowedUpdates = [
      "fullName",
      "username",
      "bio",
      "dateOfBirth",
      "country",
      "phoneNumber",
    ];

    // Filter only allowed updates
    const filteredUpdates = {};
    Object.keys(updates).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    // Check if username is being updated and if it's unique
    if (filteredUpdates.username) {
      const existingUser = await User.findOne({
        username: filteredUpdates.username.toLowerCase(),
        _id: { $ne: userId },
      });

      if (existingUser) {
        return next(new AppError("Username is already taken", 400));
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(userId, filteredUpdates, {
      new: true,
      runValidators: true,
      select: "-password -refreshTokens -fcmTokens",
    });

    if (!updatedUser) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return next(new AppError(`Validation Error: ${errors.join(", ")}`, 400));
    }

    // Handle duplicate key error for username
    if (error.code === 11000 && error.keyPattern?.username) {
      return next(new AppError("Username is already taken", 400));
    }

    next(error);
  }
};

/**
 * Update profile image
 * @route PUT /api/profile/image
 */
exports.updateProfileImage = async (req, res, next) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return next(new AppError("No image file provided", 400));
    }

    // Create relative path for the uploaded image
    const profileImagePath = `/images/profile/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profileImage: profileImagePath },
      {
        new: true,
        select: "-password -refreshTokens -fcmTokens",
      }
    );

    if (!updatedUser) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      data: {
        profileImage: profileImagePath,
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check username availability
 * @route GET /api/profile/check-username/:username
 */
exports.checkUsernameAvailability = async (req, res, next) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user._id;

    if (!username || username.length < 3) {
      return next(
        new AppError("Username must be at least 3 characters long", 400)
      );
    }

    const existingUser = await User.findOne({
      username: username.toLowerCase(),
      _id: { $ne: currentUserId },
    });

    const isAvailable = !existingUser;

    res.status(200).json({
      success: true,
      data: {
        username: username.toLowerCase(),
        isAvailable,
        message: isAvailable
          ? "Username is available"
          : "Username is already taken",
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search users by username or full name
 * @route GET /api/profile/search
 */
exports.searchUsers = async (req, res, next) => {
  try {
    const { q: query, page = 1, limit = 20 } = req.query;
    const currentUserId = req.user._id;

    if (!query || query.trim().length < 2) {
      return res.status(200).json({
        success: true,
        data: {
          users: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: 0,
            totalResults: 0,
          },
        },
      });
    }

    const searchQuery = query.trim();
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Create search conditions for username and fullName
    const searchConditions = {
      $and: [
        { _id: { $ne: currentUserId } }, // Exclude current user
        { emailVerify: true }, // Only verified users
        {
          $or: [
            { username: { $regex: searchQuery, $options: "i" } },
            { fullName: { $regex: searchQuery, $options: "i" } },
          ],
        },
      ],
    };

    // Count total results
    const totalResults = await User.countDocuments(searchConditions);

    // Get users with pagination
    const users = await User.find(searchConditions)
      .select(
        "_id fullName username profileImage bio followersCount followingCount"
      )
      .sort({
        // Prioritize exact username matches, then alphabetical
        username: 1,
        fullName: 1,
      })
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate pagination
    const totalPages = Math.ceil(totalResults / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
          totalResults,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error searching users:", error);
    next(error);
  }
};
