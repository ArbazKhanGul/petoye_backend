const connectionManager = require("./connectionManager");

/**
 * Notification Service
 * Handles both real-time socket notifications and push notifications
 */

class NotificationService {
  constructor(io) {
    this.io = io;
  }

  /**
   * Send notification only via socket if user is online (ignore if offline)
   * Perfect for coin notifications that shouldn't push when user is offline
   * @param {string} userId - Target user ID
   * @param {object} notification - Notification data
   */
  async sendSocketOnlyNotification(userId, notification) {
    try {
      // Check if user is online first
      const isOnline = connectionManager.isUserOnline(userId);

      if (!isOnline) {
        console.log(
          `⚠️ User ${userId} is offline - skipping socket notification`
        );
        return {
          success: true,
          sentViaSocket: false,
          sentViaPush: false,
          skipped: true,
          reason: "user_offline",
        };
      }

      const notificationData = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...notification,
        timestamp: new Date().toISOString(),
      };

      // Send via socket only (user is online)
      const sentViaSocket = connectionManager.sendToUser(
        this.io,
        userId,
        "notification:received",
        notificationData
      );

      return {
        success: true,
        sentViaSocket,
        sentViaPush: false,
        notificationId: notificationData.id,
      };
    } catch (error) {
      console.error("Error sending socket-only notification:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification to user (socket + push notification fallback)
   * @param {string} userId - Target user ID
   * @param {object} notification - Notification data
   * @param {boolean} forcePush - Force push notification even if user is online
   */
  async sendNotification(userId, notification, forcePush = false) {
    try {
      const notificationData = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...notification,
        timestamp: new Date().toISOString(),
      };

      // Try to send via socket first
      const sentViaSocket = connectionManager.sendToUser(
        this.io,
        userId,
        "notification:received",
        notificationData
      );

      // If user is offline or forcePush is true, send push notification
      if (!sentViaSocket || forcePush) {
        await this.sendPushNotification(userId, notificationData);
      }

      return {
        success: true,
        sentViaSocket,
        sentViaPush: !sentViaSocket || forcePush,
        notificationId: notificationData.id,
      };
    } catch (error) {
      console.error("Error sending notification:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notification using OneSignal
   * @param {string} userId - Target user ID
   * @param {object} notification - Notification data
   */
  async sendPushNotification(userId, notification) {
    try {
      // Here you would integrate with OneSignal API
      // For now, just log what would be sent
      console.log(`📱 Push notification for ${userId}:`, {
        title: notification.title || "Petoye",
        message: notification.message,
        data: notification.data,
      });

      // Example OneSignal API call (you would implement this):
      /*
      const oneSignalClient = new OneSignal.Client(process.env.ONESIGNAL_APP_ID, process.env.ONESIGNAL_API_KEY);
      
      const notification = {
        contents: { en: notification.message },
        headings: { en: notification.title || 'Petoye' },
        include_external_user_ids: [userId],
        data: notification.data,
      };
      
      await oneSignalClient.createNotification(notification);
      */

      return true;
    } catch (error) {
      console.error("Error sending push notification:", error);
      return false;
    }
  }

  /**
   * Broadcast notification to multiple users
   * @param {Array} userIds - Array of user IDs
   * @param {object} notification - Notification data
   */
  async broadcastNotification(userIds, notification) {
    const results = await Promise.all(
      userIds.map((userId) => this.sendNotification(userId, notification))
    );

    return {
      total: userIds.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  /**
   * Get notification statistics
   * @returns {object} Notification stats
   */
  getStats() {
    return {
      onlineUsers: connectionManager.getStats().totalConnections,
      ...connectionManager.getStats(),
    };
  }
}

module.exports = NotificationService;
