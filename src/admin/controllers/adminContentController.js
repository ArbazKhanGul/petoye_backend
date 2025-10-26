const {
  Comment,
  Notification,
  Message,
  Conversation,
  Follow,
  Like,
} = require("../../models");
const AppError = require("../../errors/appError");

// ==================== COMMENT MANAGEMENT ====================

// Get all comments with pagination
exports.getAllComments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      postId = "",
      userId = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (postId) query.post = postId;
    if (userId) query.user = userId;

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const comments = await Comment.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip)
      .populate("user", "fullName username profileImage email")
      .populate("post", "content");

    const total = await Comment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        comments,
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

// Delete comment
exports.deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return next(new AppError("Comment not found", 404));
    }

    // Delete all replies to this comment
    await Comment.deleteMany({ parentComment: commentId });

    // Delete the comment
    await Comment.findByIdAndDelete(commentId);

    res.status(200).json({
      success: true,
      message: "Comment and all replies deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Delete multiple comments
exports.deleteMultipleComments = async (req, res, next) => {
  try {
    const { commentIds } = req.body;

    if (!Array.isArray(commentIds) || commentIds.length === 0) {
      return next(new AppError("Comment IDs array is required", 400));
    }

    // Delete replies to these comments
    await Comment.deleteMany({ parentComment: { $in: commentIds } });

    // Delete comments
    const result = await Comment.deleteMany({ _id: { $in: commentIds } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} comments and their replies deleted successfully`,
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== NOTIFICATION MANAGEMENT ====================

// Get all notifications with pagination
exports.getAllNotifications = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      userId = "",
      type = "",
      isRead = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (userId) query.userId = userId;
    if (type) query.type = type;
    if (isRead !== "") query.isRead = isRead === "true";

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const notifications = await Notification.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip)
      .populate("userId", "fullName username profileImage email");

    const total = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        notifications,
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

// Delete notification
exports.deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndDelete(notificationId);
    if (!notification) {
      return next(new AppError("Notification not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ==================== CHAT/MESSAGE MANAGEMENT ====================

// Get all conversations with pagination
exports.getAllConversations = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const conversations = await Conversation.find()
      .sort({ lastMessageAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate("participants", "fullName username profileImage email")
      .populate("lastMessage");

    const total = await Conversation.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        conversations,
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

// Get messages in a conversation
exports.getConversationMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const skip = (page - 1) * limit;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return next(new AppError("Conversation not found", 404));
    }

    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate("sender", "fullName username profileImage")
      .populate("receiver", "fullName username profileImage");

    const total = await Message.countDocuments({ conversation: conversationId });

    res.status(200).json({
      success: true,
      data: {
        conversation,
        messages,
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

// Delete conversation
exports.deleteConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return next(new AppError("Conversation not found", 404));
    }

    // Delete all messages in this conversation
    await Message.deleteMany({ conversation: conversationId });

    // Delete the conversation
    await Conversation.findByIdAndDelete(conversationId);

    res.status(200).json({
      success: true,
      message: "Conversation and all messages deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Delete message
exports.deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findByIdAndDelete(messageId);
    if (!message) {
      return next(new AppError("Message not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ==================== FOLLOW MANAGEMENT ====================

// Get all follows with pagination
exports.getAllFollows = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      followerId = "",
      followingId = "",
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (followerId) query.follower = followerId;
    if (followingId) query.following = followingId;

    const follows = await Follow.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate("follower", "fullName username profileImage email")
      .populate("following", "fullName username profileImage email");

    const total = await Follow.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        follows,
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

// Delete follow relationship
exports.deleteFollow = async (req, res, next) => {
  try {
    const { followId } = req.params;

    const follow = await Follow.findByIdAndDelete(followId);
    if (!follow) {
      return next(new AppError("Follow relationship not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Follow relationship deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ==================== LIKE MANAGEMENT ====================

// Get all likes with pagination
exports.getAllLikes = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, postId = "", userId = "" } = req.query;

    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (postId) query.post = postId;
    if (userId) query.user = userId;

    const likes = await Like.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate("user", "fullName username profileImage email")
      .populate("post", "content");

    const total = await Like.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        likes,
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

// Delete like
exports.deleteLike = async (req, res, next) => {
  try {
    const { likeId } = req.params;

    const like = await Like.findByIdAndDelete(likeId);
    if (!like) {
      return next(new AppError("Like not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Like deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
