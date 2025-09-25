const Conversation = require("../models/conversation.model");
const Message = require("../models/message.model");
const User = require("../models/user.model");
const AppError = require("../errors/appError");
const connectionManager = require("../socket/connectionManager");

/**
 * Get all conversations for the authenticated user
 * @route GET /api/chat/conversations
 * @access Private
 */
const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, search } = req.query;

    const skip = (page - 1) * limit;

    // Build base query
    let query = {
      participants: userId,
      deletedBy: { $ne: userId },
    };

    // Find conversations where user is a participant and hasn't deleted
    let conversationQuery = Conversation.find(query)
      .populate("participants", "fullName username profileImage email")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "fullName username profileImage",
        },
      });

    // If search query is provided, filter conversations
    if (search && search.trim().length > 0) {
      const searchRegex = new RegExp(search.trim(), "i");

      // First find conversations, then filter by participant names or last message
      const allConversations = await conversationQuery
        .sort({ lastMessageAt: -1 })
        .lean();

      const filteredConversations = allConversations.filter((conversation) => {
        // Check if any participant's name matches the search
        const participantMatches = conversation.participants.some(
          (participant) =>
            participant._id.toString() !== userId.toString() &&
            (searchRegex.test(participant.fullName || "") ||
              searchRegex.test(participant.username || ""))
        );

        // Check if last message content matches the search
        const messageMatches =
          conversation.lastMessage &&
          conversation.lastMessage.content &&
          searchRegex.test(conversation.lastMessage.content);

        return participantMatches || messageMatches;
      });

      // Apply pagination to filtered results
      const paginatedConversations = filteredConversations.slice(
        skip,
        skip + parseInt(limit)
      );

      // Add other participant info for each conversation
      const conversationsWithDetails = paginatedConversations.map(
        (conversation) => {
          const otherParticipant = conversation.participants.find(
            (participant) => participant._id.toString() !== userId.toString()
          );
          conversation.otherParticipant = otherParticipant;
          conversation.unreadCount =
            conversation.unreadCount?.[userId.toString()] || 0;
          return conversation;
        }
      );

      return res.json({
        success: true,
        data: {
          conversations: conversationsWithDetails,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(filteredConversations.length / limit),
            totalConversations: filteredConversations.length,
            hasNext: skip + parseInt(limit) < filteredConversations.length,
            hasPrev: parseInt(page) > 1,
          },
        },
      });
    }

    // No search - regular pagination
    const conversations = await conversationQuery
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Add other participant info for each conversation
    const conversationsWithDetails = conversations.map((conversation) => {
      const conversationObj = conversation.toObject();

      // Get the other participant (not current user)
      const otherParticipant = conversation.participants.find(
        (participant) => participant._id.toString() !== userId.toString()
      );
      conversationObj.otherParticipant = otherParticipant;

      // Get unread count for current user
      conversationObj.unreadCount =
        conversation.unreadCount.get(userId.toString()) || 0;

      return conversationObj;
    });

    // Get total count for pagination
    const total = await Conversation.countDocuments(query);

    res.json({
      success: true,
      data: {
        conversations: conversationsWithDetails,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalConversations: total,
          hasNext: parseInt(page) < Math.ceil(total / limit),
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

/**
 * GET /api/chat/conversations/:conversationId/messages
 * Cursor-based pagination using a single cursor: lastMessageId
 */
const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id.toString();

    // Accept both cases from client: lastMessageId or lastmessageId
    const lastMessageId =
      (req.query.lastMessageId || req.query.lastmessageId) ?? null;

    // Parse & clamp limit
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "50", 10), 1),
      100
    );
    const fetchSize = limit + 1; // fetch one extra to determine "hasMore"

    // 1) Verify conversation and membership
    const conversation = await Conversation.findById(conversationId).lean();
    if (!conversation) return next(new AppError("Conversation not found", 404));

    const isParticipant = (conversation.participants || []).some(
      (p) => p.toString() === userId
    );
    if (!isParticipant) {
      return next(
        new AppError("You are not a participant in this conversation", 403)
      );
    }

    // 2) Build query: if cursor provided, get strictly older messages
    const query = { conversation: conversationId };
    if (lastMessageId) {
      query._id = { $lt: lastMessageId }; // fetch older than the cursor
    }

    // 3) Fetch messages
    // Always sort by _id DESC to get newest-first from the DB
    let messages = await Message.find(query)
      .sort({ _id: -1 })
      .limit(fetchSize)
      .lean();

    // 4) Determine hasMore and trim the extra
    const hasMore = messages.length > limit;
    if (hasMore) messages = messages.slice(0, limit);

    // 5) Return in chronological order (oldest -> newest) for easy rendering
    messages.reverse();

    // 6) New cursor is the oldest message in this batch (if any)
    const cursor = messages.length ? messages[0]._id.toString() : null;

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          limit,
          hasMore,
          cursor, // send this back next time as lastMessageId to load older messages
          batchSize: messages.length,
        },
      },
    });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

/**
 * Mark messages as read in a conversation
 * @route PUT /api/chat/conversations/:conversationId/read
 * @access Private
 */
const markMessagesAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Check if conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return next(new AppError("Conversation not found", 404));
    }

    const isParticipant = conversation.participants.some(
      (participant) => participant.toString() === userId.toString()
    );
    if (!isParticipant) {
      return next(
        new AppError("You are not a participant in this conversation", 403)
      );
    }

    // Reset unread count for current user
    conversation.unreadCount.set(userId.toString(), 0);
    await conversation.save();

    // Mark unread messages as read
    const result = await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
          status: "read",
        },
      }
    );

    // Send real-time read receipt to other participants
    const io = req.app.get("io");
    if (io) {
      conversation.participants.forEach((participantId) => {
        if (participantId.toString() !== userId.toString()) {
          connectionManager.sendToUser(
            io,
            participantId.toString(),
            "messages:read",
            {
              conversationId,
              readBy: userId,
              readAt: new Date().toDateString(),
            }
          );
        }
      });
    }

    res.json({
      success: true,
      message: "Messages marked as read",
      data: {
        conversationId,
        messagesMarked: result.modifiedCount,
      },
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

/**
 * Delete a conversation (soft delete)
 * @route DELETE /api/chat/conversations/:conversationId
 * @access Private
 */
const deleteConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Check if conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return next(new AppError("Conversation not found", 404));
    }

    const isParticipant = conversation.participants.some(
      (participant) => participant.toString() === userId.toString()
    );
    if (!isParticipant) {
      return next(
        new AppError("You are not a participant in this conversation", 403)
      );
    }

    // Add user to deletedBy array (soft delete)
    if (!conversation.deletedBy.includes(userId)) {
      conversation.deletedBy.push(userId);
      await conversation.save();
    }

    res.json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

/**
 * Get conversation between current user and another user (don't create if none exists)
 * @route POST /api/chat/conversations/get-with-user
 * @access Private
 */
const getConversationWithUser = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { otherUserId } = req.body;

    // Validate input
    if (!otherUserId) {
      return next(new AppError("Other user ID is required", 400));
    }

    // Prevent getting conversation with self
    if (currentUserId.toString() === otherUserId.toString()) {
      return next(new AppError("Cannot get conversation with yourself", 400));
    }

    // Check if other user exists
    const otherUser = await User.findById(otherUserId).select(
      "fullName username profileImage email"
    );
    if (!otherUser) {
      return next(new AppError("User not found", 404));
    }

    // Check if conversation exists between these two users
    const conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, otherUserId], $size: 2 },
    })
      .populate("participants", "fullName username profileImage email")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "fullName username profileImage",
        },
      });

    // If no conversation exists, return null conversation but include other user details
    if (!conversation) {
      return res.status(200).json({
        success: true,
        message: "No existing conversation found",
        data: {
          conversation: null,
          otherUser: {
            _id: otherUser._id,
            fullName: otherUser.fullName,
            username: otherUser.username,
            profileImage: otherUser.profileImage,
            email: otherUser.email,
          },
        },
      });
    }

    // Get the other participant (not the current user)
    const otherParticipant = conversation.participants.find(
      (participant) => participant._id.toString() !== currentUserId.toString()
    );

    // Get unread count for current user
    const unreadCount =
      conversation.unreadCount.get(currentUserId.toString()) || 0;

    // Format response for existing conversation
    const conversationData = {
      _id: conversation._id,
      participants: conversation.participants,
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
      unreadCount,
      otherParticipant,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };

    res.status(200).json({
      success: true,
      message: "Conversation retrieved successfully",
      data: {
        conversation: conversationData,
        otherUser: {
          _id: otherUser._id,
          fullName: otherUser.fullName,
          username: otherUser.username,
          profileImage: otherUser.profileImage,
          email: otherUser.email,
        },
      },
    });
  } catch (error) {
    console.error("Error getting conversation:", error);
    next(new AppError(error.message, 500));
  }
};

module.exports = {
  getConversations,
  getMessages,
  markMessagesAsRead,
  deleteConversation,
  getConversationWithUser,
};
