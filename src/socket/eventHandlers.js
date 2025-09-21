const connectionManager = require("./connectionManager");

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

  // Handle sending private messages
  socket.on("message:send", async (data) => {
    try {
      const { recipientId, message, messageType = "text", metadata } = data;

      // Validate input
      if (!recipientId || !message) {
        return socket.emit("message:error", {
          message: "Recipient ID and message are required",
        });
      }

      // Create message object
      const messageData = {
        id: generateMessageId(),
        senderId: socket.userId,
        recipientId,
        message,
        messageType,
        metadata,
        timestamp: new Date().toISOString(),
        status: "sent",
      };

      // Send to recipient if online
      const sent = connectionManager.sendToUser(
        io,
        recipientId,
        "message:received",
        messageData
      );

      // Send confirmation to sender
      socket.emit("message:sent", {
        ...messageData,
        delivered: sent,
      });

      // Here you would typically save the message to database
      // await saveMessageToDatabase(messageData);

      // If recipient is offline, you might want to send push notification
      if (!sent) {
        // await sendPushNotification(recipientId, messageData);
        console.log(`📱 Should send push notification to ${recipientId}`);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("message:error", { message: "Failed to send message" });
    }
  });

  // Handle message read receipts
  socket.on("message:read", (data) => {
    const { messageId, senderId } = data;
    connectionManager.sendToUser(io, senderId, "message:read", {
      messageId,
      readBy: socket.userId,
      timestamp: new Date().toISOString(),
    });
  });

  // Handle group/room operations
  socket.on("room:join", (roomId) => {
    socket.join(roomId);
    socket.emit("room:joined", { roomId });
    console.log(`👥 User ${socket.userId} joined room: ${roomId}`);
  });

  socket.on("room:leave", (roomId) => {
    socket.leave(roomId);
    socket.emit("room:left", { roomId });
    console.log(`👥 User ${socket.userId} left room: ${roomId}`);
  });

  // Handle notifications
  socket.on("notification:send", (data) => {
    const { userId, notification } = data;
    connectionManager.sendToUser(
      io,
      userId,
      "notification:received",
      notification
    );
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

  // Handle custom events for your app
  socket.on("post:like", (data) => {
    const { postId, postOwnerId } = data;
    connectionManager.sendToUser(io, postOwnerId, "notification:received", {
      type: "post_like",
      message: "Someone liked your post!",
      data: { postId, likerId: socket.userId },
      timestamp: new Date().toISOString(),
    });
  });

  socket.on("follow:request", (data) => {
    const { targetUserId } = data;
    connectionManager.sendToUser(io, targetUserId, "notification:received", {
      type: "follow_request",
      message: "You have a new follow request!",
      data: { followerId: socket.userId },
      timestamp: new Date().toISOString(),
    });
  });
}

/**
 * Generate unique message ID
 * @returns {string} Unique message ID
 */
function generateMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = {
  handleConnection,
};
