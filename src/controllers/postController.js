/**
 * Get all posts for the current user
 * @route GET /api/posts/me
 */
exports.getMyPosts = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalPosts = await Post.countDocuments({ userId });
    const posts = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "userId",
        select: "fullName profileImage",
      });

    res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalPosts / limit),
          totalResults: totalPosts,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a post by ID
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
    console.log("🚀 ~ userId:", userId);

    // Get content from validated request body
    const { content, mediaTypes } = req.body;
    console.log("🚀 ~ mediaTypes:", mediaTypes);
    console.log("🚀 ~ req.files:", req.files);

    // Process uploaded files robustly (handle single/multiple files)
    let mediaFiles = [];
    if (req.files && (req.files["mediaFiles"] || req.files["thumbnails"])) {
      let mediaArr = req.files["mediaFiles"] || [];
      let thumbArr = req.files["thumbnails"] || [];
      // If only one file, multer gives object not array
      if (!Array.isArray(mediaArr)) mediaArr = [mediaArr];
      if (!Array.isArray(thumbArr)) thumbArr = [thumbArr];
      // Parse mediaTypes if sent as JSON string
      let parsedMediaTypes = mediaTypes;
      if (typeof mediaTypes === "string") {
        try {
          parsedMediaTypes = JSON.parse(mediaTypes);
        } catch {
          parsedMediaTypes = mediaTypes.split(",");
        }
      }
      mediaFiles = mediaArr.map((file, index) => {
        const relativePath = `/images/posts/${path.basename(file.path)}`;
        let fileType =
          parsedMediaTypes && Array.isArray(parsedMediaTypes)
            ? parsedMediaTypes[index]
            : file.mimetype.startsWith("image/")
            ? "image"
            : "video";
        const mediaObject = {
          url: relativePath,
          type: fileType,
        };
        // If it's a video and a thumbnail was uploaded, associate it
        if (fileType === "video" && thumbArr[index]) {
          mediaObject.thumbnail = `/images/posts/${path.basename(
            thumbArr[index].path
          )}`;
        }
        return mediaObject;
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
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalPosts / limit),
          totalResults: totalPosts,
        },
      },
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
