const {
  Post,
  Like,
  User,
  TokenTransaction,
  RewardConfig,
} = require("../models");
const AppError = require("../errors/appError");

/**
 * Toggle like status for a post
 * @route POST /api/posts/:id/like
 */
exports.toggleLike = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    // Check if user has already liked the post
    const existingLike = await Like.findOne({ user: userId, post: postId });

    if (existingLike) {
      // Unlike: Remove the like
      await Like.findByIdAndDelete(existingLike._id);

      // Update post like count
      await Post.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } });

      // Get updated count
      const updatedPost = await Post.findById(postId, "likesCount");

      // Return success response for unlike
      return res.status(200).json({
        success: true,
        message: "Post unliked successfully",
        liked: false,
        likesCount: updatedPost.likesCount,
      });
    } else {
      // Add new like
      const newLike = await Like.create({
        user: userId,
        post: postId,
        postOwner: post.userId,
      });

      // If the post is not the user's own post, process token reward
      if (post.userId.toString() !== userId.toString()) {
        // Find reward configuration for likes
        const rewardConfig = await RewardConfig.findOne({ type: "like" });

        if (rewardConfig) {
          const tokenAmount = rewardConfig.amount;

          // Create token transaction record
          await TokenTransaction.create({
            user: post.userId, // Post owner gets the tokens
            amount: tokenAmount,
            type: "like",
            relatedId: postId,
          });

          // Update user's token balance
          await User.findByIdAndUpdate(
            post.userId,
            { $inc: { tokens: tokenAmount } },
            { new: true }
          );
        }
      }

      // Update post like count
      await Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } });

      // Get updated count
      const updatedPost = await Post.findById(postId, "likesCount");

      // Return success response for like
      return res.status(200).json({
        success: true,
        message: "Post liked successfully",
        liked: true,
        likesCount: updatedPost.likesCount,
        tokensEarned:
          post.userId.toString() !== userId.toString()
            ? rewardConfig?.amount || 0
            : 0,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get likes for a post
 * @route GET /api/posts/:id/likes
 */
exports.getPostLikes = async (req, res, next) => {
  try {
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    const likes = await Like.find({ post: postId })
      .populate({
        path: "user",
        select: "fullName profileImage",
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: likes.length,
      data: likes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user has liked a post
 * @route GET /api/posts/:id/liked
 */
exports.checkUserLiked = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const like = await Like.findOne({ user: userId, post: postId });

    res.status(200).json({
      success: true,
      liked: !!like,
    });
  } catch (error) {
    next(error);
  }
};
