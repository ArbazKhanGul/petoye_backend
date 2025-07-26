const { Post, User } = require("../models");
const AppError = require("../errors/appError");
const path = require("path");
const fs = require("fs");

/**
 * Create a new post
 * @route POST /api/posts
 */
exports.createPost = async (req, res, next) => {
  try {
    // Get user from authenticated middleware
    const userId = req.user._id;

    // Get content from validated request body
    const { content } = req.body;

    // Process uploaded files
    let mediaFiles = [];
    if (req.files && req.files.length > 0) {
      // Map file paths to relative URLs for storage in the database
      mediaFiles = req.files.map((file) => {
        // Store path relative to the /images/posts directory
        const relativePath = `/images/posts/${path.basename(file.path)}`;
        return relativePath;
      });
    }

    // Validate: either content or mediaFiles must be present
    if (!content && mediaFiles.length === 0) {
      return next(
        new AppError(
          "Post must contain either text content or media files",
          400
        )
      );
    }

    // Create new post
    const post = await Post.create({
      userId,
      content,
      mediaFiles,
    });

    // Populate user details
    const populatedPost = await Post.findById(post._id).populate({
      path: "userId",
      select: "fullName profileImage", // Only select the needed fields
    });

    res.status(201).json({
      message: "Post created successfully",
      post: populatedPost,
    });
  } catch (error) {
    // If an error occurs, cleanup any uploaded files
    if (req.files) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    next(error);
  }
};

/**
 * Get all posts with pagination
 * @route GET /api/posts
 */
exports.getAllPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination info
    const totalPosts = await Post.countDocuments();

    // Get posts with populated user info
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "userId",
        select: "fullName profileImage",
      });

    res.status(200).json({
      message: "Posts fetched successfully",
      posts,
      pagination: {
        totalPosts,
        totalPages: Math.ceil(totalPosts / limit),
        currentPage: page,
        postsPerPage: limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's own posts
 * @route GET /api/posts/me
 */
exports.getMyPosts = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination info
    const totalPosts = await Post.countDocuments({ userId });

    // Get user's posts
    const posts = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "userId",
        select: "fullName profileImage",
      });

    res.status(200).json({
      message: "Posts fetched successfully",
      posts,
      pagination: {
        totalPosts,
        totalPages: Math.ceil(totalPosts / limit),
        currentPage: page,
        postsPerPage: limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single post by ID
 * @route GET /api/posts/:id
 */
exports.getPostById = async (req, res, next) => {
  try {
    const postId = req.params.id;

    const post = await Post.findById(postId).populate({
      path: "userId",
      select: "fullName profileImage",
    });

    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    res.status(200).json({
      message: "Post fetched successfully",
      post,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a post
 * @route PUT /api/posts/:id
 */
exports.updatePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const { content } = req.body;
    const userId = req.user._id;

    // Find post and check ownership
    const post = await Post.findById(postId);

    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    // Check if current user is the post creator
    if (post.userId.toString() !== userId.toString()) {
      return next(
        new AppError("Unauthorized: You can only update your own posts", 403)
      );
    }

    // Update post content
    post.content = content;
    post.updatedAt = Date.now();
    await post.save();

    res.status(200).json({
      message: "Post updated successfully",
      post,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a post
 * @route DELETE /api/posts/:id
 */
exports.deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    // Find post and check ownership
    const post = await Post.findById(postId);

    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    // Check if current user is the post creator
    if (post.userId.toString() !== userId.toString()) {
      return next(
        new AppError("Unauthorized: You can only delete your own posts", 403)
      );
    }

    // Delete media files associated with the post
    if (post.mediaFiles && post.mediaFiles.length > 0) {
      post.mediaFiles.forEach((mediaPath) => {
        const filePath = path.join(
          __dirname,
          "../../",
          mediaPath.replace(/^\//, "")
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    // Delete the post
    await Post.deleteOne({ _id: postId });

    res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
