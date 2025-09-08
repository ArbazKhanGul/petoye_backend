const bcrypt = require("bcrypt");
const AppError = require("../errors/appError");
const Admin = require("../models/admin.model");
const AdminSession = require("../models/adminSession.model");
const AuditLog = require("../models/auditLog.model");
const { User, Post, TokenTransaction, Referral, Like, Comment, Follow, Otp, SessionToken, UserActivityLog, PetListing, Notification, Message, Conversation } = require("../models");

// Helper function to log admin actions
const logAdminAction = async (adminId, action, targetType = null, targetId = null, details = {}, req = null, oldData = null, newData = null) => {
  try {
    await AuditLog.create({
      adminId,
      action,
      targetType,
      targetId,
      details,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.headers?.["user-agent"],
      oldData,
      newData,
    });
  } catch (error) {
    console.error("Error logging admin action:", error);
  }
};

// Admin Authentication
exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    console.log("Login attempt:", { email, password: "***" });

    // Find admin by email
    const admin = await Admin.findOne({ email });
    console.log("Admin found:", admin ? "YES" : "NO");
    if (!admin) {
      console.log("Admin not found for email:", email);
      return next(new AppError("Invalid credentials", 401));
    }

    // Check if admin is active
    console.log("Admin active status:", admin.isActive);
    if (!admin.isActive) {
      console.log("Admin account is inactive");
      return next(new AppError("Admin account is inactive", 401));
    }

    // Verify password
    console.log("Comparing password...");
    const isPasswordValid = await admin.comparePassword(password);
    console.log("Password valid:", isPasswordValid);
    if (!isPasswordValid) {
      console.log("Password comparison failed");
      return next(new AppError("Invalid credentials", 401));
    }

    // Generate tokens
    const authToken = await admin.generateAuthToken();
    const refreshToken = await admin.generateRefreshToken();

    // Create admin session
    const session = await AdminSession.create({
      adminId: admin._id,
      authToken,
      refreshToken,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"],
      deviceInfo: {
        deviceType: req.headers["x-device-type"] || "web",
        browser: req.headers["x-browser"] || "unknown",
        os: req.headers["x-os"] || "unknown",
      },
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
    });

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Log login action
    await logAdminAction(admin._id, "ADMIN_LOGIN", "Admin", admin._id, { success: true }, req);

    // Return admin data without sensitive info
    const adminData = admin.toObject();
    delete adminData.password;
    delete adminData.refreshTokens;

    res.status(200).json({
      message: "Admin login successful",
      admin: adminData,
      authToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

exports.adminLogout = async (req, res, next) => {
  try {
    const adminId = req.admin._id;
    const token = req.headers.authorization?.split(" ")[1];

    // Deactivate current session
    await AdminSession.findOneAndUpdate(
      { adminId, authToken: token },
      { isActive: false }
    );

    // Log logout action
    await logAdminAction(adminId, "ADMIN_LOGOUT", "Admin", adminId, {}, req);

    res.status(200).json({
      message: "Admin logout successful",
    });
  } catch (error) {
    next(error);
  }
};

exports.refreshAdminToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError("Refresh token is required", 400));
    }

    // Verify refresh token
    const decoded = Admin.verifyRefreshToken(refreshToken);
    if (!decoded || decoded.type !== "admin") {
      return next(new AppError("Invalid refresh token", 401));
    }

    // Find admin
    const admin = await Admin.findById(decoded._id);
    if (!admin || !admin.isActive) {
      return next(new AppError("Admin not found or inactive", 401));
    }

    // Generate new tokens
    const newAuthToken = await admin.generateAuthToken();
    const newRefreshToken = await admin.generateRefreshToken();

    // Update session
    await AdminSession.findOneAndUpdate(
      { adminId: admin._id, refreshToken },
      { 
        authToken: newAuthToken,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
        lastActivity: new Date(),
      }
    );

    res.status(200).json({
      message: "Tokens refreshed successfully",
      authToken: newAuthToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// Dashboard Analytics
exports.getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      totalPosts,
      totalTokenTransactions,
      totalReferrals,
      recentUsers,
      recentPosts,
    ] = await Promise.all([
      // Total users count
      User.countDocuments(),
      
      // Active users (logged in within last 30 days)
      User.countDocuments({
        updatedAt: { $gte: thirtyDaysAgo }
      }),
      
      // Total posts
      Post.countDocuments(),
      
      // Total token transactions
      TokenTransaction.countDocuments(),
      
      // Total referrals
      Referral.countDocuments(),
      
      // Recent users (last 7 days)
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("fullName email createdAt emailVerify"),
      
      // Recent posts (last 7 days)
      Post.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("userId", "fullName username")
    ]);

    // Enhanced user growth data (last 30 days)
    const userGrowthData = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // User engagement data (posts per day last 30 days)
    const postGrowthData = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Token transactions over time
    const tokenTransactionData = await TokenTransaction.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            type: "$type"
          },
          amount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);

    // User verification status distribution
    const userVerificationStatus = await User.aggregate([
      {
        $group: {
          _id: "$emailVerify",
          count: { $sum: 1 }
        }
      }
    ]);

    // Posts by type/category (if you have categories)
    const postsByEngagement = await Post.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $gte: ["$likesCount", 50] },
              "High Engagement",
              {
                $cond: [
                  { $gte: ["$likesCount", 10] },
                  "Medium Engagement",
                  "Low Engagement"
                ]
              }
            ]
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Top users by tokens
    const topUsersByTokens = await User.find()
      .sort({ tokens: -1 })
      .limit(10)
      .select("fullName username tokens");

    // Token distribution ranges
    const tokenDistribution = await User.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $gte: ["$tokens", 1000] },
              "1000+",
              {
                $cond: [
                  { $gte: ["$tokens", 500] },
                  "500-999",
                  {
                    $cond: [
                      { $gte: ["$tokens", 100] },
                      "100-499",
                      {
                        $cond: [
                          { $gte: ["$tokens", 10] },
                          "10-99",
                          "0-9"
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          count: { $sum: 1 },
          totalTokens: { $sum: "$tokens" }
        }
      }
    ]);

    // Enhanced posts analytics
    const postAnalytics = await Post.aggregate([
      {
        $group: {
          _id: null,
          totalLikes: { $sum: "$likesCount" },
          totalComments: { $sum: "$commentsCount" },
          avgLikes: { $avg: "$likesCount" },
          avgComments: { $avg: "$commentsCount" }
        }
      }
    ]);

    // Enhanced token statistics
    const tokenStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalTokens: { $sum: "$tokens" },
          avgTokens: { $avg: "$tokens" },
          maxTokens: { $max: "$tokens" },
          minTokens: { $min: "$tokens" }
        }
      }
    ]);

    // Activity by hour (last 7 days)
    const activityByHour = await User.aggregate([
      {
        $match: {
          updatedAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $hour: "$updatedAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      message: "Dashboard stats fetched successfully",
      stats: {
        overview: {
          totalUsers,
          activeUsers,
          totalPosts,
          totalTokenTransactions,
          totalReferrals
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          growth: userGrowthData,
          recent: recentUsers,
          verificationStatus: userVerificationStatus,
          topByTokens: topUsersByTokens
        },
        posts: {
          total: totalPosts,
          analytics: postAnalytics[0] || {},
          recent: recentPosts,
          growth: postGrowthData,
          engagement: postsByEngagement
        },
        tokens: {
          transactions: totalTokenTransactions,
          stats: tokenStats[0] || {},
          distribution: tokenDistribution,
          transactionData: tokenTransactionData
        },
        referrals: {
          total: totalReferrals,
        },
        activity: {
          byHour: activityByHour
        }
      },
    });
  } catch (error) {
    next(error);
  }
};

// User Management
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const status = req.query.status; // 'active', 'inactive', 'verified', 'unverified'
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    // Build filter
    const filter = {};
    
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }

    if (status === "verified") {
      filter.emailVerify = true;
    } else if (status === "unverified") {
      filter.emailVerify = false;
    }

    // Get users with pagination
    const users = await User.find(filter)
      .select("-password -refreshTokens")
      .sort({ [sortBy]: sortOrder })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.status(200).json({
      message: "Users fetched successfully",
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId).select("-password -refreshTokens");
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Get comprehensive user data in parallel
    const [
      posts,
      postsCount,
      followers,
      following,
      followersCount,
      followingCount,
      tokenTransactions,
      referrals,
      likes,
      comments,
      petListings,
      otpHistory,
      sessionTokens,
      activityLogs,
      notifications,
      sentMessages,
      receivedMessages,
      conversations
    ] = await Promise.all([
      // Posts
      Post.find({ userId }).populate('userId', 'fullName username profileImage').sort({ createdAt: -1 }).limit(10),
      Post.find({ userId }).countDocuments(),
      
      // Follow relationships
      Follow.find({ following: userId }).populate('follower', 'fullName username profileImage').sort({ createdAt: -1 }).limit(10),
      Follow.find({ follower: userId }).populate('following', 'fullName username profileImage').sort({ createdAt: -1 }).limit(10),
      Follow.find({ following: userId }).countDocuments(),
      Follow.find({ follower: userId }).countDocuments(),
      
      // Token transactions
      TokenTransaction.find({ user: userId }).sort({ createdAt: -1 }).limit(20),
      
      // Referrals
      Referral.find({ $or: [{ referrer: userId }, { referee: userId }] })
        .populate('referrer', 'fullName username')
        .populate('referee', 'fullName username')
        .sort({ createdAt: -1 }),
      
      // Likes and comments
      Like.find({ user: userId }).populate('post', 'content').sort({ createdAt: -1 }).limit(20),
      Comment.find({ user: userId }).populate('post', 'content').sort({ createdAt: -1 }).limit(20),
      
      // Pet listings
      PetListing.find({ owner: userId }).sort({ createdAt: -1 }),
      
      // OTP history
      Otp.find({ userId }).sort({ createdAt: -1 }).limit(20),
      
      // Session tokens (login history)
      SessionToken.find({ userId }).sort({ createdAt: -1 }).limit(20),
      
      // Activity logs
      UserActivityLog.find({ userId }).sort({ createdAt: -1 }).limit(50),
      
      // Notifications
      Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(20),
      
      // Messages
      Message.find({ sender: userId }).populate('recipient', 'fullName username').sort({ createdAt: -1 }).limit(20),
      Message.find({ recipient: userId }).populate('sender', 'fullName username').sort({ createdAt: -1 }).limit(20),
      
      // Conversations
      Conversation.find({ 'participants.user': userId }).populate('participants.user', 'fullName username profileImage').sort({ updatedAt: -1 }).limit(10)
    ]);

    // Calculate additional stats
    const likesCount = await Like.find({ user: userId }).countDocuments();
    const commentsCount = await Comment.find({ user: userId }).countDocuments();
    const petListingsCount = petListings.length;
    const notificationsCount = await Notification.find({ user: userId }).countDocuments();
    const unreadNotificationsCount = await Notification.find({ user: userId, isRead: false }).countDocuments();

    // Get recent activity summary
    const recentActivityCounts = await UserActivityLog.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Device and login analytics
    const deviceStats = await SessionToken.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: '$deviceType', count: { $sum: 1 } } }
    ]);

    const loginHistory = sessionTokens.map(session => ({
      ...session.toObject(),
      location: session.ipAddress || 'Unknown',
      loginTime: session.createdAt,
      isActive: !session.revoked && session.expiresAt > new Date()
    }));

    // Security info
    const suspiciousActivity = await UserActivityLog.find({
      userId,
      'metadata.success': false
    }).sort({ createdAt: -1 }).limit(10);

    res.status(200).json({
      message: "User details fetched successfully",
      user: {
        ...user.toObject(),
        
        // Basic stats
        stats: {
          postsCount,
          followersCount,
          followingCount,
          likesCount,
          commentsCount,
          petListingsCount,
          tokenTransactionsCount: tokenTransactions.length,
          referralsCount: referrals.length,
          notificationsCount,
          unreadNotificationsCount,
          conversationsCount: conversations.length
        },

        // Content and interactions
        recentPosts: posts,
        recentLikes: likes,
        recentComments: comments,
        followers: followers,
        following: following,
        
        // Financial
        tokenTransactions,
        referrals,
        
        // Pet listings
        petListings,
        
        // Security and authentication
        otpHistory: otpHistory.map(otp => ({
          ...otp.toObject(),
          // Hide actual OTP value for security, show only metadata
          value: otp.value ? '****' + otp.value.slice(-2) : null,
          isExpired: otp.expiration < new Date(),
          isUsed: otp.status
        })),
        
        // Login and device history
        loginHistory,
        deviceStats,
        
        // Activity tracking
        activityLogs: activityLogs.map(log => ({
          ...log.toObject(),
          timeAgo: Math.floor((new Date() - log.createdAt) / (1000 * 60)) // minutes ago
        })),
        recentActivityCounts,
        
        // Communication
        notifications: notifications,
        conversations: conversations,
        sentMessages: sentMessages.slice(0, 10),
        receivedMessages: receivedMessages.slice(0, 10),
        
        // Security alerts
        suspiciousActivity,
        
        // Account health
        accountHealth: {
          emailVerified: user.emailVerify,
          profileComplete: !!(user.fullName && user.bio && user.profileImage),
          hasActiveSession: loginHistory.some(session => session.isActive),
          lastActive: activityLogs[0]?.createdAt || user.updatedAt,
          riskLevel: suspiciousActivity.length > 5 ? 'high' : suspiciousActivity.length > 2 ? 'medium' : 'low'
        }
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;

    // Get original user data for audit log
    const originalUser = await User.findById(userId);
    if (!originalUser) {
      return next(new AppError("User not found", 404));
    }

    // Remove sensitive fields that shouldn't be updated via admin
    delete updateData.password;
    delete updateData.refreshTokens;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password -refreshTokens");

    // Log the action
    await logAdminAction(
      req.admin._id,
      "USER_UPDATE",
      "User",
      userId,
      { updatedFields: Object.keys(updateData) },
      req,
      originalUser.toObject(),
      updatedUser.toObject()
    );

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Store user data for audit log before deletion
    const userData = user.toObject();

    // Delete user and related data
    await Promise.all([
      User.findByIdAndDelete(userId),
      Post.deleteMany({ userId }),
      Like.deleteMany({ userId }),
      Comment.deleteMany({ userId }),
      Follow.deleteMany({ $or: [{ follower: userId }, { following: userId }] }),
      TokenTransaction.deleteMany({ user: userId }),
      Referral.deleteMany({ $or: [{ referrer: userId }, { referee: userId }] }),
    ]);

    // Log the action
    await logAdminAction(
      req.admin._id,
      "USER_DELETE",
      "User",
      userId,
      { reason: req.body.reason || "Admin deletion" },
      req,
      userData
    );

    res.status(200).json({
      message: "User and related data deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Post Management
exports.getAllPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    // Build filter
    const filter = {};
    
    if (search) {
      filter.content = { $regex: search, $options: "i" };
    }

    // Get posts with user details
    const posts = await Post.find(filter)
      .populate("userId", "fullName username email profileImage")
      .sort({ [sortBy]: sortOrder })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments(filter);

    res.status(200).json({
      message: "Posts fetched successfully",
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;

    const post = await Post.findById(postId).populate("userId", "fullName username");
    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    // Store post data for audit log
    const postData = post.toObject();

    // Delete post and related data
    await Promise.all([
      Post.findByIdAndDelete(postId),
      Like.deleteMany({ post: postId }),
      Comment.deleteMany({ post: postId }),
    ]);

    // Log the action
    await logAdminAction(
      req.admin._id,
      "POST_DELETE",
      "Post",
      postId,
      { 
        reason: req.body.reason || "Admin deletion",
        userId: post.userId._id,
        userInfo: `${post.userId.fullName} (@${post.userId.username})`
      },
      req,
      postData
    );

    res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Token Management
exports.getTokenTransactions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type; // 'like', 'referral'
    const userId = req.query.userId;

    const filter = {};
    if (type) filter.type = type;
    if (userId) filter.user = userId;

    const transactions = await TokenTransaction.find(filter)
      .populate("user", "fullName username email")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await TokenTransaction.countDocuments(filter);

    res.status(200).json({
      message: "Token transactions fetched successfully",
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.adjustUserTokens = async (req, res, next) => {
  try {
    const { userId, amount, reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const oldTokens = user.tokens;
    user.tokens += amount;
    await user.save();

    // Create transaction record
    await TokenTransaction.create({
      user: userId,
      amount,
      type: "admin_adjustment",
      relatedId: req.admin._id,
    });

    // Log the action
    await logAdminAction(
      req.admin._id,
      "TOKEN_ADJUSTMENT",
      "User",
      userId,
      { 
        amount,
        reason,
        oldTokens,
        newTokens: user.tokens
      },
      req
    );

    res.status(200).json({
      message: "User tokens adjusted successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        oldTokens,
        newTokens: user.tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Export data
exports.exportUsers = async (req, res, next) => {
  try {
    const format = req.query.format || "json"; // json or csv
    
    const users = await User.find({})
      .select("-password -refreshTokens")
      .lean();

    // Log export action
    await logAdminAction(
      req.admin._id,
      "DATA_EXPORT",
      "System",
      null,
      { type: "users", format, count: users.length },
      req
    );

    if (format === "csv") {
      // Convert to CSV format
      const csv = convertToCSV(users);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=users.csv");
      res.send(csv);
    } else {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", "attachment; filename=users.json");
      res.json({
        exportDate: new Date().toISOString(),
        totalRecords: users.length,
        data: users,
      });
    }
  } catch (error) {
    next(error);
  }
};

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (!data.length) return "";
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(",");
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // Handle nested objects and arrays
      if (typeof value === "object" && value !== null) {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(",")
  );
  
  return [csvHeaders, ...csvRows].join("\n");
}

// Get audit logs
exports.getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const action = req.query.action;
    const adminId = req.query.adminId;

    const filter = {};
    if (action) filter.action = action;
    if (adminId) filter.adminId = adminId;

    const logs = await AuditLog.find(filter)
      .populate("adminId", "fullName email")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await AuditLog.countDocuments(filter);

    res.status(200).json({
      message: "Audit logs fetched successfully",
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// User OTP History
exports.getUserOtpHistory = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const otpHistory = await Otp.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Otp.countDocuments({ userId });

    // Transform OTP data for admin view
    const otpData = otpHistory.map(otp => ({
      ...otp.toObject(),
      isExpired: otp.expiration < new Date(),
      isUsed: otp.status,
      timeAgo: Math.floor((new Date() - otp.createdAt) / (1000 * 60)), // minutes ago
    }));

    res.status(200).json({
      message: "User OTP history fetched successfully",
      otpHistory: otpData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// User Activity Logs
exports.getUserActivityLogs = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const action = req.query.action;
    const dateFrom = req.query.dateFrom;
    const dateTo = req.query.dateTo;

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Build filter
    const filter = { userId };
    
    if (action) {
      filter.action = action;
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const activityLogs = await UserActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await UserActivityLog.countDocuments(filter);

    // Get activity statistics
    const activityStats = await UserActivityLog.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      message: "User activity logs fetched successfully",
      activityLogs: activityLogs.map(log => ({
        ...log.toObject(),
        timeAgo: Math.floor((new Date() - log.createdAt) / (1000 * 60))
      })),
      activityStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// User Session History
exports.getUserSessionHistory = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const sessions = await SessionToken.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await SessionToken.countDocuments({ userId });

    // Transform session data
    const sessionData = sessions.map(session => ({
      ...session.toObject(),
      isActive: !session.revoked && session.expiresAt > new Date(),
      timeAgo: Math.floor((new Date() - session.createdAt) / (1000 * 60)),
      duration: session.revokedAt ? 
        Math.floor((session.revokedAt - session.createdAt) / (1000 * 60)) : 
        Math.floor((new Date() - session.createdAt) / (1000 * 60))
    }));

    res.status(200).json({
      message: "User session history fetched successfully",
      sessions: sessionData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Revoke User Session
exports.revokeUserSession = async (req, res, next) => {
  try {
    const { userId, sessionId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const session = await SessionToken.findOneAndUpdate(
      { _id: sessionId, userId },
      { 
        revoked: true, 
        revokedAt: new Date() 
      },
      { new: true }
    );

    if (!session) {
      return next(new AppError("Session not found", 404));
    }

    // Log the action
    await logAdminAction(
      req.admin._id,
      "USER_SESSION_REVOKE",
      "User",
      userId,
      { sessionId, reason: req.body.reason || "Admin action" },
      req
    );

    res.status(200).json({
      message: "User session revoked successfully",
      session,
    });
  } catch (error) {
    next(error);
  }
};
