const {
  Post,
  Like,
  User,
  TokenTransaction,
  RewardConfig,
  Notification,
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

      let tokensEarned = 0;

      // Update post like count first (needed for notification data)
      await Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } });

      // Get updated count
      const updatedPost = await Post.findById(postId, "likesCount");

      // If the post is not the user's own post, process token reward
      if (post.userId.toString() !== userId.toString()) {
        // Check if this user has already earned a reward for liking this post
        const existingReward = await TokenTransaction.findOne({
          user: post.userId, // Post owner
          type: "like",
          relatedId: postId,
          "metadata.likerId": userId, // Track who gave the like
        });

        // Only give reward if no previous reward exists for this user-post combination
        if (!existingReward) {
          // Find reward configuration for likes
          const rewardConfig = await RewardConfig.findOne({ type: "like" });

          if (rewardConfig) {
            const tokenAmount = rewardConfig.amount;

            // Create token transaction record with metadata tracking
            await TokenTransaction.create({
              user: post.userId, // Post owner gets the tokens
              amount: tokenAmount,
              type: "like",
              relatedId: postId,
              metadata: {
                likerId: userId, // Track who gave the like
                likeId: newLike._id, // Track the specific like
              },
            });

            // Update user's token balance
            await User.findByIdAndUpdate(
              post.userId,
              { $inc: { tokens: tokenAmount } },
              { new: true }
            );

            tokensEarned = tokenAmount;

            // === NOTIFICATION LOGIC ===
            // Only create notifications for first-time likes (when rewards are given)
            const liker = await User.findById(
              userId,
              "fullName username profileImage"
            );

            // 1. Create and send POST LIKE notification
            const likeNotification = await Notification.create({
              userId: post.userId,
              type: "post_like",
              title: "New Like",
              message: `${liker.fullName} liked your post`,
              triggeredBy: userId,
              relatedData: {
                postId: postId,
                metadata: {
                  likeCount: updatedPost.likesCount,
                },
              },
              actionType: "view_post",
              priority: "medium",
            });

            // Send like notification with both socket and push fallback
            const io = req.app.get("io");
            if (io && io.notificationService) {
              // Populate the full notification data for socket
              const populatedNotification = await Notification.findById(
                likeNotification._id
              )
                .populate(
                  "triggeredBy",
                  "firstName lastName username profileImage"
                )
                .populate("relatedData.postId", "content mediaFiles");

              await io.notificationService.sendNotification(
                post.userId.toString(),
                populatedNotification
              );
            }

            console.log(
              `📱 Like notification sent to ${post.userId} from ${liker.fullName}`
            );

            // 2. Create and send COIN notification
            const coinNotification = await Notification.create({
              userId: post.userId,
              type: "coin_earned_like",
              title: "Coins Earned!",
              message: `You earned ${tokensEarned} coins from getting a like`,
              triggeredBy: userId,
              relatedData: {
                postId: postId,
                coinData: {
                  amount: tokensEarned,
                  reason: "like",
                  transactionId: null, // Will be set after transaction is created
                },
                metadata: {
                  fromLiker: liker.fullName,
                },
              },
              actionType: "view_coins",
              priority: "low",
            });

            // Send coin notification ONLY if user is online
            if (io && io.notificationService) {
              await io.notificationService.sendSocketOnlyNotification(
                post.userId.toString(),
                {
                  id: coinNotification._id,
                  type: "coin_earned_like",
                  title: "Coins Earned!",
                  message: `You earned ${tokensEarned} coins from getting a like`,
                  data: {
                    type: "coin_earned_like",
                    postId: postId,
                    coinAmount: tokensEarned,
                    reason: "like",
                    fromLiker: liker.fullName,
                    actionType: "view_coins",
                  },
                }
              );
            }

            console.log(
              `🪙 Coin notification processed for user ${post.userId} (+${tokensEarned} coins)`
            );
          }
        }
      }

      // Return success response for like
      return res.status(200).json({
        success: true,
        message: "Post liked successfully",
        liked: true,
        likesCount: updatedPost.likesCount,
        // tokensEarned: tokensEarned,
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
