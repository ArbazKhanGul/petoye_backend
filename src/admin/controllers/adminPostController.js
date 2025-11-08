const { Post, User, Like, Comment } = require("../../models");
const AppError = require("../../errors/appError");

// Get all posts with pagination and filters
exports.getAllPosts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      userId = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      hasMedia = "",
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (search) {
      query.content = { $regex: search, $options: "i" };
    }
    if (userId) query.userId = userId;
    if (hasMedia === "true") {
      query.mediaFiles = { $exists: true, $not: { $size: 0 } };
    } else if (hasMedia === "false") {
      query.$or = [
        { mediaFiles: { $exists: false } },
        { mediaFiles: { $size: 0 } },
      ];
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const posts = await Post.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip)
      .populate("userId", "fullName username profileImage email")
      .lean(); // Use lean() for better performance with large datasets

    // Get engagement counts efficiently in batch
    const postIds = posts.map(post => post._id);
    const [likesData, commentsData] = await Promise.all([
      Like.aggregate([
        { $match: { post: { $in: postIds } } },
        { $group: { _id: "$post", count: { $sum: 1 } } }
      ]),
      Comment.aggregate([
        { $match: { post: { $in: postIds } } },
        { $group: { _id: "$post", count: { $sum: 1 } } }
      ])
    ]);

    // Create lookup maps for efficient data merging
    const likesMap = Object.fromEntries(likesData.map(item => [item._id.toString(), item.count]));
    const commentsMap = Object.fromEntries(commentsData.map(item => [item._id.toString(), item.count]));

    // Enhance posts with engagement data
    const enhancedPosts = posts.map(post => ({
      ...post,
      user: post.userId, // Rename for frontend consistency
      likesCount: likesMap[post._id.toString()] || 0,
      commentsCount: commentsMap[post._id.toString()] || 0,
      sharesCount: post.shareCount || 0,
      media: post.mediaFiles || [], // Rename for frontend consistency
      hasMedia: post.mediaFiles && post.mediaFiles.length > 0
    }));

    const total = await Post.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        posts: enhancedPosts,
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

// Get single post by ID with detailed information
exports.getPostById = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId).populate(
      "userId",
      "fullName username profileImage email"
    );

    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    // Get likes for this post
    const likes = await Like.find({ post: post._id })
      .populate("user", "fullName username profileImage")
      .limit(20);

    // Get comments for this post
    const comments = await Comment.find({ post: post._id, isReply: false })
      .populate("user", "fullName username profileImage")
      .limit(20)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        post,
        likes,
        comments,
        stats: {
          likesCount: post.likesCount || 0,
          commentsCount: post.commentsCount || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update post
exports.updatePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    if (content !== undefined) post.content = content;
    post.updatedAt = new Date();

    await post.save();

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: { post },
    });
  } catch (error) {
    next(error);
  }
};

// Delete post
exports.deletePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    // Delete associated likes
    await Like.deleteMany({ post: post._id });

    // Delete associated comments
    await Comment.deleteMany({ post: post._id });

    // Delete the post
    await Post.findByIdAndDelete(postId);

    res.status(200).json({
      success: true,
      message: "Post and all associated data deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get post statistics
exports.getPostStats = async (req, res, next) => {
  try {
    const totalPosts = await Post.countDocuments();
    const postsWithMedia = await Post.countDocuments({
      mediaFiles: { $exists: true, $not: { $size: 0 } },
    });
    const postsWithoutMedia = totalPosts - postsWithMedia;

    // Get posts in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newPosts = await Post.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Get posts in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthlyNewPosts = await Post.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Get total likes across all posts
    const totalLikes = await Like.countDocuments();

    // Get total comments across all posts
    const totalComments = await Comment.countDocuments();

    // Get most liked posts
    const mostLikedPosts = await Post.find()
      .sort({ likesCount: -1 })
      .limit(10)
      .populate("userId", "fullName username profileImage");

    // Get most commented posts
    const mostCommentedPosts = await Post.find()
      .sort({ commentsCount: -1 })
      .limit(10)
      .populate("userId", "fullName username profileImage");

    res.status(200).json({
      success: true,
      data: {
        totalPosts,
        postsWithMedia,
        postsWithoutMedia,
        newPostsLast7Days: newPosts,
        newPostsLast30Days: monthlyNewPosts,
        totalLikes,
        totalComments,
        mostLikedPosts,
        mostCommentedPosts,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get posts by user
exports.getPostsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const posts = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate("userId", "fullName username profileImage");

    const total = await Post.countDocuments({ userId });

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          fullName: user.fullName,
          username: user.username,
          profileImage: user.profileImage,
        },
        posts,
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

// Delete multiple posts
exports.deleteMultiplePosts = async (req, res, next) => {
  try {
    const { postIds } = req.body;

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return next(new AppError("Post IDs array is required", 400));
    }

    // Delete associated likes
    await Like.deleteMany({ post: { $in: postIds } });

    // Delete associated comments
    await Comment.deleteMany({ post: { $in: postIds } });

    // Delete posts
    const result = await Post.deleteMany({ _id: { $in: postIds } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} posts and associated data deleted successfully`,
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Search posts
exports.searchPosts = async (req, res, next) => {
  try {
    const { query, limit = 20 } = req.query;

    if (!query) {
      return next(new AppError("Search query is required", 400));
    }

    const posts = await Post.find({
      content: { $regex: query, $options: "i" },
    })
      .limit(parseInt(limit))
      .populate("userId", "fullName username profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { posts },
    });
  } catch (error) {
    next(error);
  }
};
