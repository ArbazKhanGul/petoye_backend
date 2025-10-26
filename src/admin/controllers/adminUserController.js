const { User, Post, Follow, TokenTransaction, Notification } = require("../../models");
const AppError = require("../../errors/appError");

// Get all users with pagination and filters
exports.getAllUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      role = "",
      emailVerify = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }
    if (role) query.role = role;
    if (emailVerify !== "") query.emailVerify = emailVerify === "true";

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const users = await User.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip)
      .select("-password -refreshTokens");

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
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

// Get single user by ID with detailed information
exports.getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-password -refreshTokens");

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Get user statistics
    const postsCount = await Post.countDocuments({ userId: user._id });
    const followersCount = user.followersCount || 0;
    const followingCount = user.followingCount || 0;

    // Get recent posts
    const recentPosts = await Post.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("userId", "fullName username profileImage");

    // Get token transactions
    const tokenTransactions = await TokenTransaction.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        user,
        stats: {
          postsCount,
          followersCount,
          followingCount,
          tokens: user.tokens || 0,
        },
        recentPosts,
        tokenTransactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update user information
exports.updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { fullName, username, email, bio, country, phoneNumber, role } =
      req.body;

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Check if username is being changed and is already taken
    if (username && username !== user.username) {
      const existingUser = await User.findOne({
        username: username.toLowerCase(),
      });
      if (existingUser) {
        return next(new AppError("Username is already taken", 409));
      }
      user.username = username.toLowerCase();
    }

    // Check if email is being changed and is already taken
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return next(new AppError("Email is already taken", 409));
      }
      user.email = email.toLowerCase();
    }

    // Update other fields
    if (fullName !== undefined) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;
    if (country !== undefined) user.country = country;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (role !== undefined) user.role = role;

    await user.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// Delete user
exports.deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Delete user's posts
    await Post.deleteMany({ userId: user._id });

    // Delete user's follows
    await Follow.deleteMany({
      $or: [{ follower: user._id }, { following: user._id }],
    });

    // Delete user's token transactions
    await TokenTransaction.deleteMany({ user: user._id });

    // Delete user's notifications
    await Notification.deleteMany({ userId: user._id });

    // Delete user
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: "User and all related data deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Verify user email
exports.verifyUserEmail = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    user.emailVerify = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User email verified successfully",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// Update user tokens
exports.updateUserTokens = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { tokens, action } = req.body; // action: 'set', 'add', 'subtract'

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (action === "set") {
      user.tokens = tokens;
    } else if (action === "add") {
      user.tokens = (user.tokens || 0) + tokens;
    } else if (action === "subtract") {
      user.tokens = Math.max(0, (user.tokens || 0) - tokens);
    }

    await user.save();

    // Create transaction record
    await TokenTransaction.create({
      user: user._id,
      amount: action === "subtract" ? -tokens : tokens,
      type: "admin_adjustment",
      metadata: {
        adminId: req.admin._id,
        action,
      },
    });

    res.status(200).json({
      success: true,
      message: "User tokens updated successfully",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// Get user activity
exports.getUserActivity = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 20, activityType = "all" } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const activity = {};

    if (activityType === "all" || activityType === "posts") {
      activity.posts = await Post.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));
    }

    if (activityType === "all" || activityType === "tokens") {
      activity.tokenTransactions = await TokenTransaction.find({
        user: user._id,
      })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));
    }

    if (activityType === "all" || activityType === "notifications") {
      activity.notifications = await Notification.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));
    }

    res.status(200).json({
      success: true,
      data: { activity },
    });
  } catch (error) {
    next(error);
  }
};

// Search users
exports.searchUsers = async (req, res, next) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query) {
      return next(new AppError("Search query is required", 400));
    }

    const users = await User.find({
      $or: [
        { fullName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
      ],
    })
      .limit(parseInt(limit))
      .select("-password -refreshTokens");

    res.status(200).json({
      success: true,
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};

// Get user statistics
exports.getUserStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ emailVerify: true });
    const adminUsers = await User.countDocuments({ role: "admin" });
    const regularUsers = await User.countDocuments({ role: "user" });

    // Get new users in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Get new users in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthlyNewUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        verifiedUsers,
        unverifiedUsers: totalUsers - verifiedUsers,
        adminUsers,
        regularUsers,
        newUsersLast7Days: newUsers,
        newUsersLast30Days: monthlyNewUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};
