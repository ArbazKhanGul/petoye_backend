const { User, TokenTransaction, RewardConfig } = require("../models");
const AppError = require("../errors/appError");

/**
 * Get user's token balance and transaction history
 * @route GET /api/coins/balance
 */
exports.getUserTokenBalance = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get user's current token balance
    const user = await User.findById(userId, "tokens fullName profileImage");
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Get recent token transactions (last 10)
    const recentTransactions = await TokenTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate({
        path: "relatedId",
        select: "content mediaUrls createdAt",
        model: "Post",
      });

    // Calculate total tokens earned and spent
    const tokenStats = await TokenTransaction.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalEarned: {
            $sum: {
              $cond: [{ $gt: ["$amount", 0] }, "$amount", 0],
            },
          },
          totalSpent: {
            $sum: {
              $cond: [{ $lt: ["$amount", 0] }, { $abs: "$amount" }, 0],
            },
          },
          totalTransactions: { $sum: 1 },
        },
      },
    ]);

    const stats = tokenStats[0] || {
      totalEarned: 0,
      totalSpent: 0,
      totalTransactions: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        currentBalance: user.tokens || 0,
        totalEarned: stats.totalEarned,
        totalSpent: stats.totalSpent,
        totalTransactions: stats.totalTransactions,
        recentTransactions,
        user: {
          fullName: user.fullName,
          profileImage: user.profileImage,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed transaction history with pagination
 * @route GET /api/coins/transactions
 */
exports.getTransactionHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get transaction type filter
    const typeFilter = req.query.type;
    const query = { user: userId };

    if (typeFilter && ["like", "referral"].includes(typeFilter)) {
      query.type = typeFilter;
    }

    // Get transactions with pagination
    const transactions = await TokenTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "relatedId",
        select: "content mediaUrls createdAt userId",
        model: "Post",
        populate: {
          path: "userId",
          select: "fullName profileImage",
          model: "User",
        },
      })
      .populate({
        path: "metadata.likerId",
        select: "fullName profileImage",
        model: "User",
      });

    // Get total count for pagination
    const totalTransactions = await TokenTransaction.countDocuments(query);
    const totalPages = Math.ceil(totalTransactions / limit);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: page,
          totalPages,
          totalTransactions,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get token earning opportunities
 * @route GET /api/coins/opportunities
 */
exports.getEarningOpportunities = async (req, res, next) => {
  try {
    // This could include daily tasks, referral bonuses, etc.
    // For now, we'll return basic earning methods

    const opportunities = [
      {
        type: "like",
        title: "Get Likes on Your Posts",
        description: "Earn tokens when other users like your posts",
        tokenReward: 5, // This should come from RewardConfig
        icon: "heart",
        action: "Create engaging posts to get more likes",
      },
      {
        type: "referral",
        title: "Invite Friends",
        description: "Earn tokens for each friend you refer",
        tokenReward: 100, // This should come from RewardConfig
        icon: "users",
        action: "Share your referral code with friends",
      },
      // Future opportunities could include:
      // - Daily check-in bonuses
      // - Completing profile
      // - First post bonus
      // - Weekly challenges
    ];

    res.status(200).json({
      success: true,
      data: {
        opportunities,
        message: "Keep engaging with the community to earn more tokens!",
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all earning methods from reward config
 * @route GET /api/coins/earning-methods
 */
exports.getEarningMethods = async (req, res, next) => {
  try {
    // Get all reward configs sorted by priority
    const earningMethods = await RewardConfig.find({}).sort({
      priority: 1,
      createdAt: 1,
    });

    res.status(200).json({
      success: true,
      data: {
        methods: earningMethods,
        total: earningMethods.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
