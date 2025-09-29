const connectionManager = require("./connectionManager");
const Conversation = require("../models/conversation.model");
const Message = require("../models/message.model");
const User = require("../models/user.model");
const NotificationService = require("./notificationService");

/**
 * Socket.IO Event Handlers
 * Handles all socket events for real-time communication
 */

/**
 * Handle new socket connection
 * @param {object} io - Socket.IO server instance
 * @param {object} socket - Socket connection
 */
function handleConnection(io, socket) {
  console.log(
    `🔌 New socket connection: ${socket.id} for user: ${socket.userId}`
  );

  // Initialize notification service
  const notificationService = new NotificationService(io);

  // Auto-join user immediately after authentication
  try {
    // Add user to connection manager automatically
    connectionManager.addConnection(socket.userId, socket.id, {
      fullName: socket.userFullName || "Unknown User",
      email: socket.userEmail || "unknown@email.com",
      profileImage: socket.userProfileImage || null,
      username: socket.userName || "unknown",
      bio: socket.userBio || "",
    });

    // Join user to their own room for private messages
    socket.join(`user:${socket.userId}`);

    // Notify user they're connected
    socket.emit("connection:success", {
      message: "Connected and joined automatically",
      userId: socket.userId,
      socketId: socket.id,
      userInfo: {
        fullName: socket.userFullName,
        username: socket.userName,
        profileImage: socket.userProfileImage,
      },
      timestamp: new Date().toISOString(),
    });

    console.log(
      `✅ User auto-joined: ${socket.userFullName} (${socket.userId})`
    );

    // Optionally notify friends about online status
    // await notifyFriendsOnlineStatus(socket.userId, true);
  } catch (error) {
    console.error("Error auto-joining user:", error);
    socket.emit("connection:error", { message: "Failed to auto-join" });
  }

  // Handle sending chat messages
  socket.on("chat:sendMessage", async (data) => {
    try {
      const {
        recipientId,
        content,
        messageType = "text",
        mediaUrl,
        mediaType,
        tempId,
      } = data;

      console.log(
        "🚀 ~ handleConnection ~ socket.userId:-----------------------------",
        socket.userId
      );

      console.log(`💬 Chat message from ${socket.userId} to ${recipientId}:`, {
        content: content?.substring(0, 50) + "...",
        messageType,
      });

      // Helper function to map MIME type to enum value
      const getMediaTypeEnum = (mimeType) => {
        if (!mimeType) return null;
        if (mimeType.startsWith("image/")) return "image";
        if (mimeType.startsWith("video/")) return "video";
        if (mimeType.startsWith("audio/")) return "audio";
        return "file";
      };

      // Convert MIME type to enum value
      const mediaTypeEnum = getMediaTypeEnum(mediaType);

      // Validate input
      if (!recipientId) {
        return socket.emit("chat:error", {
          message: "Recipient ID is required",
        });
      }

      // For text messages, content is required. For media messages, mediaUrl is required.
      if (messageType === "text" && (!content || content.trim().length === 0)) {
        return socket.emit("chat:error", {
          message: "Message content is required for text messages",
        });
      }

      if (messageType === "media" && !mediaUrl) {
        return socket.emit("chat:error", {
          message: "Media URL is required for media messages",
        });
      }

      if (content.length > 2000) {
        return socket.emit("chat:error", {
          message: "Message content too long (max 2000 characters)",
        });
      }

      // Check if recipient exists
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        return socket.emit("chat:error", {
          message: "Recipient not found",
        });
      }

      // Find or create conversation between these two users
      let conversation = await Conversation.findOne({
        participants: { $all: [socket.userId, recipientId], $size: 2 },
      });

      if (!conversation) {
        // Create new conversation
        conversation = new Conversation({
          participants: [socket.userId, recipientId],
          unreadCount: new Map([
            [socket.userId.toString(), 0],
            [recipientId.toString(), 0],
          ]),
        });
        await conversation.save();
        console.log(`✅ New conversation created: ${conversation._id}`);
      } else {
        // If conversation exists, check if it was soft-deleted by either participant
        // If so, restore it for them (remove from deletedBy array)
        let conversationUpdated = false;

        if (conversation.deletedBy.includes(socket.userId)) {
          conversation.deletedBy = conversation.deletedBy.filter(
            (userId) => userId.toString() !== socket.userId.toString()
          );
          conversationUpdated = true;
        }

        if (conversation.deletedBy.includes(recipientId)) {
          conversation.deletedBy = conversation.deletedBy.filter(
            (userId) => userId.toString() !== recipientId.toString()
          );
          conversationUpdated = true;
        }

        if (conversationUpdated) {
          await conversation.save();
          console.log(
            `✅ Conversation restored for participants: ${conversation._id}`
          );
        }
      }

      // Create and save the message
      const message = new Message({
        conversation: conversation._id,
        sender: socket.userId,
        content: content ? content.trim() : "", // Allow empty content for media messages
        messageType,
        mediaUrl,
        mediaType: mediaTypeEnum, // Use the converted enum value
        receiver: recipientId,
        status: "sent",
      });

      await message.save();

      // Update conversation
      conversation.lastMessage = message._id;
      conversation.lastMessageAt = new Date();

      // Increment unread count for recipient
      const currentUnread =
        conversation.unreadCount.get(recipientId.toString()) || 0;
      conversation.unreadCount.set(recipientId.toString(), currentUnread + 1);

      await conversation.save();

      // Use socket user data instead of populating from database
      const messageToUser = {
        _id: message._id,
        conversation: conversation._id,
        sender: {
          _id: socket.userId,
          fullName: socket.userFullName,
          username: socket.userName,
          profileImage: socket.userProfileImage,
        },
        content: message.content,
        messageType: message.messageType,
        mediaUrl: message.mediaUrl,
        mediaType: message.mediaType,
        status: message.status,
        isRead: message.isRead,
        createdAt: message.createdAt,
      };

      // Check if recipient is online and send real-time message
      const isRecipientOnline = connectionManager.isUserOnline(recipientId);

      if (isRecipientOnline) {
        // Send to recipient in real-time
        connectionManager.sendToUser(io, recipientId, "chat:messageReceived", {
          message: messageToUser,
        });
      }

      // Send confirmation to sender
      socket.emit("chat:messageSent", {
        success: true,
        messageId: message._id,
        conversationId: conversation._id,
        tempId,
      });

      // If recipient is offline, send push notification
      if (!isRecipientOnline) {
        console.log(`📱 Sending push notification to ${recipientId}`);

        try {
          const pushResult = await notificationService.sendPushNotification(
            recipientId,
            {
              notificationId: `chat_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`,
              title: `New message from ${
                socket.userFullName || socket.userName
              }`,
              message:
                messageType === "text" ? content : "Sent you a media message",
              type: "chat_message",
              actionType: "open_chat",
              actionUrl: `/chat/${conversation._id}`,
              // All other data is passed as-is
              conversationId: conversation._id,
              senderId: socket.userId,
              senderName: socket.userFullName || socket.userName,
              senderProfileImage: socket.userProfileImage,
              messageType: messageType,
              messagePreview:
                messageType === "text"
                  ? content.substring(0, 100)
                  : "Media message",
            }
          );
        } catch (error) {
          console.error(
            `❌ Error sending push notification to ${recipientId}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error("Error sending chat message:", error);
      socket.emit("chat:error", {
        message: "Failed to send message",
        error: error.message,
      });
    }
  });

  // Handle message seen (when user views messages)
  socket.on("chat:seen", async (data) => {
    try {
      const { conversationId } = data;

      console.log(
        `👀 User ${socket.userId} viewed messages in conversation: ${conversationId}`
      );

      // Verify user is participant
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return socket.emit("chat:error", { message: "Conversation not found" });
      }

      const isParticipant = conversation.participants.some(
        (participant) => participant.toString() === socket.userId.toString()
      );

      if (!isParticipant) {
        return socket.emit("chat:error", {
          message: "You are not a participant in this conversation",
        });
      }

      // Reset unread count for current user
      conversation.unreadCount.set(socket.userId.toString(), 0);
      await conversation.save();

      // Mark all unread messages from other participants as read
      const result = await Message.updateMany(
        {
          conversation: conversationId,
          sender: { $ne: socket.userId },
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

      // // Send confirmation to user
      // socket.emit("chat:seenConfirm", {
      //   conversationId,
      //   success: true,
      // });

      // Notify other participants about read receipt
      conversation.participants.forEach((participantId) => {
        if (participantId.toString() !== socket.userId.toString()) {
          connectionManager.sendToUser(
            io,
            participantId.toString(),
            "chat:messagesRead",
            {
              conversationId,
              readBy: socket.userId,
              readAt: new Date().toDateString(),
            }
          );
        }
      });

      console.log(
        `✅ User ${socket.userId} marked ${result.modifiedCount} messages as read in ${conversationId}`
      );
    } catch (error) {
      console.error("Error handling seen messages:", error);
      socket.emit("chat:error", { message: "Failed to mark messages as seen" });
    }
  });

  // Handle user disconnect
  socket.on("disconnect", (reason) => {
    console.log(`🔌 Socket disconnected: ${socket.id}, Reason: ${reason}`);

    // Remove from connection manager
    connectionManager.removeConnection(socket.id);

    // Optionally notify friends about offline status
    // if (socket.userId) {
    //   notifyFriendsOnlineStatus(socket.userId, false);
    // }
  });
}

module.exports = {
  handleConnection,
};
