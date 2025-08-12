const AppError = require("../errors/appError");
const { User, Follow } = require("../models");
const mongoose = require("mongoose");

/**
 * Follow a user
 */
exports.followUser = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const currentUserId = req.user._id;
    const targetUserId = req.params.userId;

    // Validate that user is not trying to follow themselves
    if (currentUserId.toString() === targetUserId) {
      await session.abortTransaction();
      return next(new AppError("You cannot follow yourself", 400));
    }

    // Check if target user exists
    const targetUser = await User.findById(targetUserId).session(session);
    if (!targetUser) {
      await session.abortTransaction();
      return next(new AppError("User not found", 404));
    }

    // Check if already following using the Follow collection
    const existingFollow = await Follow.findOne({
      follower: currentUserId,
      following: targetUserId,
    }).session(session);

    if (existingFollow) {
      await session.abortTransaction();
      return next(new AppError("You are already following this user", 400));
    }

    // Create follow relationship
    await Follow.create(
      [
        {
          follower: currentUserId,
          following: targetUserId,
        },
      ],
      { session }
    );

    // Update follower counts atomically
    await User.findByIdAndUpdate(
      currentUserId,
      { $inc: { followingCount: 1 } },
      { session }
    );

    await User.findByIdAndUpdate(
      targetUserId,
      { $inc: { followersCount: 1 } },
      { session }
    );

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "User followed successfully",
      data: {
        followingId: targetUserId,
        isFollowing: true,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error following user:", error);
    return next(new AppError("Failed to follow user", 500));
  } finally {
    session.endSession();
  }
};

/**
 * Unfollow a user
 */
exports.unfollowUser = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const currentUserId = req.user._id;
    const targetUserId = req.params.userId;

    // Check if target user exists
    const targetUser = await User.findById(targetUserId).session(session);
    if (!targetUser) {
      await session.abortTransaction();
      return next(new AppError("User not found", 404));
    }

    // Check if actually following using the Follow collection
    const existingFollow = await Follow.findOne({
      follower: currentUserId,
      following: targetUserId,
    }).session(session);

    if (!existingFollow) {
      await session.abortTransaction();
      return next(new AppError("You are not following this user", 400));
    }

    // Remove follow relationship
    await Follow.deleteOne({
      follower: currentUserId,
      following: targetUserId,
    }).session(session);

    // Update follower counts atomically
    await User.findByIdAndUpdate(
      currentUserId,
      { $inc: { followingCount: -1 } },
      { session }
    );

    await User.findByIdAndUpdate(
      targetUserId,
      { $inc: { followersCount: -1 } },
      { session }
    );

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "User unfollowed successfully",
      data: {
        followingId: targetUserId,
        isFollowing: false,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error unfollowing user:", error);
    return next(new AppError("Failed to unfollow user", 500));
  } finally {
    session.endSession();
  }
};

/**
 * Get follow status for a user
 */
exports.getFollowStatus = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.userId;

    // Check if following using the Follow collection
    const followRelation = await Follow.findOne({
      follower: currentUserId,
      following: targetUserId,
    });

    const isFollowing = !!followRelation;

    res.status(200).json({
      success: true,
      data: {
        isFollowing,
        targetUserId,
      },
    });
  } catch (error) {
    console.error("Error getting follow status:", error);
    return next(new AppError("Failed to get follow status", 500));
  }
};

/**
 * Get user's followers list
 */
exports.getFollowers = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100 per page
    const skip = (page - 1) * limit;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Get followers using the Follow collection with pagination
    const followers = await Follow.find({ following: userId })
      .populate(
        "follower",
        "fullName profileImage email followersCount followingCount"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalFollowers = await Follow.countDocuments({ following: userId });
    const totalPages = Math.ceil(totalFollowers / limit);

    // Extract follower user data
    const followerUsers = followers.map((follow) => follow.follower);

    res.status(200).json({
      success: true,
      data: {
        followers: followerUsers,
        pagination: {
          page,
          limit,
          totalPages,
          totalItems: totalFollowers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error getting followers:", error);
    return next(new AppError("Failed to get followers", 500));
  }
};

/**
 * Get user's following list
 */
exports.getFollowing = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100 per page
    const skip = (page - 1) * limit;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Get following using the Follow collection with pagination
    const following = await Follow.find({ follower: userId })
      .populate(
        "following",
        "fullName profileImage email followersCount followingCount"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalFollowing = await Follow.countDocuments({ follower: userId });
    const totalPages = Math.ceil(totalFollowing / limit);

    // Extract following user data
    const followingUsers = following.map((follow) => follow.following);

    res.status(200).json({
      success: true,
      data: {
        following: followingUsers,
        pagination: {
          page,
          limit,
          totalPages,
          totalItems: totalFollowing,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error getting following:", error);
    return next(new AppError("Failed to get following", 500));
  }
};

/**
 * Get user profile with follow counts
 */
exports.getUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const currentUserId = req.user ? req.user._id : null;

    const user = await User.findById(userId).select("-password -refreshTokens");

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Check if current user is following this user using Follow collection
    let isFollowing = false;
    if (currentUserId && currentUserId.toString() !== userId) {
      const followRelation = await Follow.findOne({
        follower: currentUserId,
        following: userId,
      });
      isFollowing = !!followRelation;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          profileImage: user.profileImage,
          followersCount: user.followersCount,
          followingCount: user.followingCount,
          country: user.country,
          tokens: user.tokens,
          createdAt: user.createdAt,
        },
        isFollowing,
        isOwnProfile: currentUserId
          ? currentUserId.toString() === userId
          : false,
      },
    });
  } catch (error) {
    console.error("Error getting user profile:", error);
    return next(new AppError("Failed to get user profile", 500));
  }
};
