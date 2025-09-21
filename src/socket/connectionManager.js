/**
 * Socket.IO Connection Manager
 * Manages user connections and provides methods to send messages to specific users
 */

class ConnectionManager {
  constructor() {
    // Map of userId -> socketId for active connections
    this.userConnections = new Map();
    // Map of socketId -> user data for reverse lookup
    this.socketUsers = new Map();
  }

  /**
   * Add a new user connection
   * @param {string} userId - User ID from database
   * @param {string} socketId - Socket connection ID
   * @param {object} userData - User information (name, email, etc.)
   */
  addConnection(userId, socketId, userData) {
    // Remove any existing connection for this user (if they reconnect)
    this.removeUserConnection(userId);

    // Add new connection
    this.userConnections.set(userId, socketId);
    this.socketUsers.set(socketId, {
      userId,
      ...userData,
      connectedAt: new Date(),
    });

    console.log(
      `✅ User connected: ${userData.fullName || userId} (${socketId})`
    );
    console.log(`📊 Total active connections: ${this.userConnections.size}`);
  }

  /**
   * Remove connection by socket ID
   * @param {string} socketId - Socket connection ID
   */
  removeConnection(socketId) {
    const userData = this.socketUsers.get(socketId);
    if (userData) {
      this.userConnections.delete(userData.userId);
      this.socketUsers.delete(socketId);

      console.log(
        `❌ User disconnected: ${
          userData.fullName || userData.userId
        } (${socketId})`
      );
      console.log(`📊 Total active connections: ${this.userConnections.size}`);
    }
  }

  /**
   * Remove connection by user ID
   * @param {string} userId - User ID
   */
  removeUserConnection(userId) {
    const socketId = this.userConnections.get(userId);
    if (socketId) {
      this.socketUsers.delete(socketId);
      this.userConnections.delete(userId);
    }
  }

  /**
   * Get socket ID for a specific user
   * @param {string} userId - User ID
   * @returns {string|null} Socket ID or null if user not connected
   */
  getSocketId(userId) {
    return this.userConnections.get(userId) || null;
  }

  /**
   * Get user data for a specific socket
   * @param {string} socketId - Socket connection ID
   * @returns {object|null} User data or null if socket not found
   */
  getUserData(socketId) {
    return this.socketUsers.get(socketId) || null;
  }

  /**
   * Check if user is online
   * @param {string} userId - User ID
   * @returns {boolean} True if user is connected
   */
  isUserOnline(userId) {
    return this.userConnections.has(userId);
  }

  /**
   * Get all online users
   * @returns {Array} Array of user IDs that are currently online
   */
  getOnlineUsers() {
    return Array.from(this.userConnections.keys());
  }

  /**
   * Get connection statistics
   * @returns {object} Connection stats
   */
  getStats() {
    return {
      totalConnections: this.userConnections.size,
      onlineUsers: this.getOnlineUsers(),
      connections: Array.from(this.socketUsers.entries()).map(
        ([socketId, userData]) => ({
          socketId,
          userId: userData.userId,
          fullName: userData.fullName,
          connectedAt: userData.connectedAt,
        })
      ),
    };
  }

  /**
   * Send message to specific user
   * @param {object} io - Socket.IO server instance
   * @param {string} userId - Target user ID
   * @param {string} event - Event name
   * @param {object} data - Data to send
   * @returns {boolean} True if message was sent, false if user not online
   */
  sendToUser(io, userId, event, data) {
    const socketId = this.getSocketId(userId);
    if (socketId) {
      io.to(socketId).emit(event, data);
      console.log(`📤 Sent '${event}' to user ${userId} (${socketId})`);
      return true;
    }
    console.log(`⚠️ User ${userId} not online - message not sent`);
    return false;
  }

  /**
   * Send message to multiple users
   * @param {object} io - Socket.IO server instance
   * @param {Array} userIds - Array of user IDs
   * @param {string} event - Event name
   * @param {object} data - Data to send
   * @returns {object} Result with sent and failed arrays
   */
  sendToUsers(io, userIds, event, data) {
    const sent = [];
    const failed = [];

    userIds.forEach((userId) => {
      if (this.sendToUser(io, userId, event, data)) {
        sent.push(userId);
      } else {
        failed.push(userId);
      }
    });

    return { sent, failed };
  }

  /**
   * Broadcast to all connected users
   * @param {object} io - Socket.IO server instance
   * @param {string} event - Event name
   * @param {object} data - Data to send
   */
  broadcast(io, event, data) {
    io.emit(event, data);
    console.log(
      `📢 Broadcasted '${event}' to ${this.userConnections.size} users`
    );
  }
}

// Export singleton instance
module.exports = new ConnectionManager();
