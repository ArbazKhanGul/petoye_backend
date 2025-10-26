const {
  User,
  Post,
  Like,
  Comment,
  TokenTransaction,
  Notification,
  Follow,
  Conversation,
  Message,
} = require("../../models");
const PetListing = require("../../models/petListing.model");
const AppError = require("../../errors/appError");

// Get dashboard overview statistics
exports.getDashboardStats = async (req, res, next) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ emailVerify: true });

    // Post statistics
    const totalPosts = await Post.countDocuments();
    const totalLikes = await Like.countDocuments();
    const totalComments = await Comment.countDocuments();

    // Pet listing statistics
    const totalPetListings = await PetListing.countDocuments();
    const activePetListings = await PetListing.countDocuments({
      status: "active",
    });

    // Token statistics
    const totalTokens = await User.aggregate([
      {
        $group: {
          _id: null,
          totalTokens: { $sum: "$tokens" },
        },
      },
    ]);

    const totalTokenTransactions = await TokenTransaction.countDocuments();

    // Follow statistics
    const totalFollows = await Follow.countDocuments();

    // Conversation and message statistics
    const totalConversations = await Conversation.countDocuments();
    const totalMessages = await Message.countDocuments();

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsersLast7Days = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });
    const newPostsLast7Days = await Post.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });
    const newPetListingsLast7Days = await PetListing.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          verified: verifiedUsers,
          unverified: totalUsers - verifiedUsers,
          newLast7Days: newUsersLast7Days,
        },
        posts: {
          total: totalPosts,
          totalLikes,
          totalComments,
          newLast7Days: newPostsLast7Days,
        },
        petListings: {
          total: totalPetListings,
          active: activePetListings,
          newLast7Days: newPetListingsLast7Days,
        },
        tokens: {
          totalInCirculation:
            totalTokens.length > 0 ? totalTokens[0].totalTokens : 0,
          totalTransactions: totalTokenTransactions,
        },
        engagement: {
          totalFollows,
          totalConversations,
          totalMessages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get user growth analytics
exports.getUserGrowthAnalytics = async (req, res, next) => {
  try {
    const { period = "30days" } = req.query;

    let daysAgo;
    let groupByFormat;

    switch (period) {
      case "7days":
        daysAgo = 7;
        groupByFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        break;
      case "30days":
        daysAgo = 30;
        groupByFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        break;
      case "90days":
        daysAgo = 90;
        groupByFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        break;
      case "1year":
        daysAgo = 365;
        groupByFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
        break;
      default:
        daysAgo = 30;
        groupByFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    }

    const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: groupByFormat,
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        period,
        userGrowth,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get post activity analytics
exports.getPostActivityAnalytics = async (req, res, next) => {
  try {
    const { period = "30days" } = req.query;

    let daysAgo;
    let groupByFormat;

    switch (period) {
      case "7days":
        daysAgo = 7;
        groupByFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        break;
      case "30days":
        daysAgo = 30;
        groupByFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        break;
      case "90days":
        daysAgo = 90;
        groupByFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        break;
      default:
        daysAgo = 30;
        groupByFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    }

    const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    const postActivity = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: groupByFormat,
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Get likes and comments activity
    const likesActivity = await Like.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const commentsActivity = await Comment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        period,
        postActivity,
        likesActivity,
        commentsActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get top users by activity
exports.getTopUsers = async (req, res, next) => {
  try {
    const { limit = 10, sortBy = "posts" } = req.query;

    let topUsers;

    if (sortBy === "posts") {
      // Get users with most posts
      topUsers = await Post.aggregate([
        {
          $group: {
            _id: "$userId",
            postsCount: { $sum: 1 },
          },
        },
        {
          $sort: { postsCount: -1 },
        },
        {
          $limit: parseInt(limit),
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $project: {
            _id: "$user._id",
            fullName: "$user.fullName",
            username: "$user.username",
            email: "$user.email",
            profileImage: "$user.profileImage",
            postsCount: 1,
          },
        },
      ]);
    } else if (sortBy === "followers") {
      // Get users with most followers
      topUsers = await User.find()
        .sort({ followersCount: -1 })
        .limit(parseInt(limit))
        .select("fullName username email profileImage followersCount");
    } else if (sortBy === "tokens") {
      // Get users with most tokens
      topUsers = await User.find()
        .sort({ tokens: -1 })
        .limit(parseInt(limit))
        .select("fullName username email profileImage tokens");
    }

    res.status(200).json({
      success: true,
      data: { topUsers },
    });
  } catch (error) {
    next(error);
  }
};

// Get engagement metrics
exports.getEngagementMetrics = async (req, res, next) => {
  try {
    const { period = "30days" } = req.query;

    const daysAgo = period === "7days" ? 7 : period === "90days" ? 90 : 30;
    const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    // Average likes per post
    const avgLikesPerPost = await Post.aggregate([
      {
        $group: {
          _id: null,
          avgLikes: { $avg: "$likesCount" },
        },
      },
    ]);

    // Average comments per post
    const avgCommentsPerPost = await Post.aggregate([
      {
        $group: {
          _id: null,
          avgComments: { $avg: "$commentsCount" },
        },
      },
    ]);

    // Posts with most engagement (recent)
    const topEngagementPosts = await Post.find({
      createdAt: { $gte: startDate },
    })
      .sort({ likesCount: -1, commentsCount: -1 })
      .limit(10)
      .populate("userId", "fullName username profileImage");

    // Daily active users (users who created posts, liked, or commented)
    const dailyActiveUsers = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            userId: "$userId",
          },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          activeUsers: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        averages: {
          likesPerPost:
            avgLikesPerPost.length > 0 ? avgLikesPerPost[0].avgLikes : 0,
          commentsPerPost:
            avgCommentsPerPost.length > 0
              ? avgCommentsPerPost[0].avgComments
              : 0,
        },
        topEngagementPosts,
        dailyActiveUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get token economy analytics
exports.getTokenEconomyAnalytics = async (req, res, next) => {
  try {
    const { period = "30days" } = req.query;

    const daysAgo = period === "7days" ? 7 : period === "90days" ? 90 : 30;
    const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    // Token distribution by type
    const tokensByType = await TokenTransaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$type",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Daily token transactions
    const dailyTokenTransactions = await TokenTransaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Top token earners
    const topTokenEarners = await User.find()
      .sort({ tokens: -1 })
      .limit(10)
      .select("fullName username email profileImage tokens");

    res.status(200).json({
      success: true,
      data: {
        tokensByType,
        dailyTokenTransactions,
        topTokenEarners,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get content moderation statistics
exports.getContentModerationStats = async (req, res, next) => {
  try {
    // Posts with high engagement (potential viral content)
    const highEngagementPosts = await Post.find({
      $or: [{ likesCount: { $gte: 100 } }, { commentsCount: { $gte: 50 } }],
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("userId", "fullName username profileImage email");

    // Recent posts (for moderation review)
    const recentPosts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("userId", "fullName username profileImage");

    // Users with most posts (potential spammers)
    const topPosters = await Post.aggregate([
      {
        $group: {
          _id: "$userId",
          postsCount: { $sum: 1 },
        },
      },
      {
        $sort: { postsCount: -1 },
      },
      {
        $limit: 20,
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: "$user._id",
          fullName: "$user.fullName",
          username: "$user.username",
          email: "$user.email",
          postsCount: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        highEngagementPosts,
        recentPosts,
        topPosters,
      },
    });
  } catch (error) {
    next(error);
  }
};
