const { Post, Comment, Notification } = require("../models");
const AppError = require("../errors/appError");

/**
 * Add a comment to a post
 * @route POST /api/posts/:id/comments
 */
exports.addComment = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;
    const { content, parentCommentId } = req.body;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    // Determine if this is a reply
    const isReply = !!parentCommentId;

    // If it's a reply, verify parent comment exists
    if (isReply) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return next(new AppError("Parent comment not found", 404));
      }
    }

    // Create comment
    const comment = await Comment.create({
      user: userId,
      post: postId,
      content,
      parentComment: parentCommentId || null,
      isReply,
    });

    // If it's a top-level comment (not a reply), increment the post's comment count
    if (!isReply) {
      await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });
    }

    // Populate user data before sending response
    await comment.populate({
      path: "user",
      select: "fullName profileImage",
    });

    // Create notification for post owner (only if commenter isn't the owner)
    try {
      if (post.userId.toString() !== userId.toString()) {
        const { emitToUser } = require("../socket");
        const { sendPushToUser } = require("../services/pushService");
        const created = await Notification.create({
          user: post.userId,
          type: "comment",
          actor: userId,
          targetId: postId,
          targetType: "post",
        });

        // Populate actor before emitting to frontend
        const populatedNotification = await Notification.findById(created._id)
          .populate("actor", "_id fullName profileImage username")
          .lean();

        emitToUser(
          post.userId.toString(),
          "notification:new",
          populatedNotification
        );
        sendPushToUser(
          post.userId,
          "New comment",
          "Someone commented on your post",
          { type: "comment", postId }
        );
      }
    } catch (e) {
      console.error("Failed to create comment notification", e);
    }

    res.status(201).json({
      success: true,
      message: isReply
        ? "Reply added successfully"
        : "Comment added successfully",
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get comments for a post
 * @route GET /api/posts/:id/comments
 */
exports.getPostComments = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    // Find top-level comments (not replies)
    const comments = await Comment.find({
      post: postId,
      isReply: false,
    })
      .populate({
        path: "user",
        select: "fullName profileImage",
      })
      // Populate first level of replies for each comment
      .populate({
        path: "replies",
        options: { sort: { createdAt: 1 }, limit: 3 }, // Get first 3 replies
        populate: {
          path: "user",
          select: "fullName profileImage",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count of top-level comments
    const totalComments = await Comment.countDocuments({
      post: postId,
      isReply: false,
    });

    res.status(200).json({
      success: true,
      data: comments,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalComments / limit),
        totalResults: totalComments,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get replies for a specific comment
 * @route GET /api/comments/:commentId/replies
 */
exports.getCommentReplies = async (req, res, next) => {
  try {
    const commentId = req.params.commentId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check if comment exists
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return next(new AppError("Comment not found", 404));
    }

    // Find replies to the comment
    const replies = await Comment.find({
      parentComment: commentId,
    })
      .populate({
        path: "user",
        select: "fullName profileImage",
      })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    // Get total count of replies
    const totalReplies = await Comment.countDocuments({
      parentComment: commentId,
    });

    res.status(200).json({
      success: true,
      data: replies,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalReplies / limit),
        totalResults: totalReplies,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a comment
 * @route DELETE /api/comments/:id
 */
exports.deleteComment = async (req, res, next) => {
  try {
    const commentId = req.params.id;
    const userId = req.user._id;

    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return next(new AppError("Comment not found", 404));
    }

    // Check if user is authorized to delete (comment owner or post owner)
    const post = await Post.findById(comment.post);

    const isCommentOwner = comment.user.toString() === userId.toString();
    const isPostOwner = post && post.userId.toString() === userId.toString();

    if (!isCommentOwner && !isPostOwner && req.user.role !== "admin") {
      return next(new AppError("Not authorized to delete this comment", 403));
    }

    // Delete comment and all replies
    if (comment.isReply) {
      // If it's a reply, just delete the single com
      await Comment.findByIdAndDelete(commentId);
    } else {
      // If it's a parent comment, delete it and all its replies
      await Comment.deleteMany({
        $or: [{ _id: commentId }, { parentComment: commentId }],
      });

      // If it's a top-level comment, decrement the post's comment count
      await Post.findByIdAndUpdate(comment.post, {
        $inc: { commentsCount: -1 },
      });
    }

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a comment
 * @route PUT /api/comments/:id
 */
exports.updateComment = async (req, res, next) => {
  try {
    const commentId = req.params.id;
    const userId = req.user._id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return next(new AppError("Comment content cannot be empty", 400));
    }

    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return next(new AppError("Comment not found", 404));
    }

    // Check if user is authorized to edit (only comment owner can edit)
    if (
      comment.user.toString() !== userId.toString() &&
      req.user.role !== "admin"
    ) {
      return next(new AppError("Not authorized to update this comment", 403));
    }

    // Update the comment
    comment.content = content.trim();
    comment.isEdited = true;
    await comment.save();

    // Populate user data before sending response
    await comment.populate({
      path: "user",
      select: "fullName profileImage",
    });

    res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle like on a comment - TEMPORARILY DISABLED
 * @route POST /api/comments/:id/like
 */
exports.toggleCommentLike = async (req, res, next) => {
  // Comment like functionality is temporarily disabled
  return res.status(200).json({
    success: false,
    message: "Comment like functionality is temporarily disabled",
  });

  // Original implementation commented out
  /*
  try {
    const commentId = req.params.id;
    const userId = req.user._id;

    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return next(new AppError("Comment not found", 404));
    }

    // Check if user has already liked the comment
    const userLikedIndex = comment.likes.findIndex(
      like => like.toString() === userId.toString()
    );

    if (userLikedIndex !== -1) {
      // Unlike: Remove user from likes array
      comment.likes.splice(userLikedIndex, 1);
      await comment.save();
      
      return res.status(200).json({
        success: true,
        message: "Comment unliked successfully",
        liked: false
      });
    } else {
      // Like: Add user to likes array
      comment.likes.push(userId);
      await comment.save();
      
      return res.status(200).json({
        success: true,
        message: "Comment liked successfully",
        liked: true
      });
    }
  } catch (error) {
    next(error);
  }
  */
};
