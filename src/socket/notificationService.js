const connectionManager = require("./connectionManager");
const OneSignal = require("onesignal-node");

/**
 * Notification Service
 * Handles both real-time socket notifications and push notifications
 */

class NotificationService {
  constructor(io) {
    this.io = io;

    // Initialize OneSignal client
    this.oneSignalClient = new OneSignal.Client(
      process.env.ONESIGNAL_APP_ID,
      process.env.ONESIGNAL_REST_API_KEY
    );
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
      // Check if OneSignal is properly configured
      if (
        !process.env.ONESIGNAL_APP_ID ||
        !process.env.ONESIGNAL_REST_API_KEY
      ) {
        console.warn(
          "⚠️ OneSignal not configured - skipping push notification"
        );
        return false;
      }

      // Prepare notification data for OneSignal
      const oneSignalNotification = {
        contents: {
          en: notification.message || "You have a new notification",
        },
        headings: {
          en: notification.title || "Petoye",
        },
        include_external_user_ids: [userId],
        data: {
          notificationId: notification._id,
          type: notification.type,
          actionType: notification.actionType,
          actionUrl: notification.actionUrl,
          // Include relevant data for navigation based on notification type
          ...(notification.relatedData && {
            postId:
              notification.relatedData.postId?._id ||
              notification.relatedData.postId,
            commentId:
              notification.relatedData.commentId?._id ||
              notification.relatedData.commentId,
            followId:
              notification.relatedData.followId?._id ||
              notification.relatedData.followId,
            // Coin data for coin notifications
            ...(notification.relatedData.coinData && {
              coinAmount: notification.relatedData.coinData.amount,
              coinReason: notification.relatedData.coinData.reason,
              transactionId: notification.relatedData.coinData.transactionId,
            }),
            // Referral data for referral notifications
            ...(notification.relatedData.referralData && {
              referralCode: notification.relatedData.referralData.referralCode,
              newUserId: notification.relatedData.referralData.newUserId,
              newUserName: notification.relatedData.referralData.newUserName,
            }),
            // Additional metadata
            metadata: notification.relatedData.metadata,
          }),
          // Include triggeredBy user info for navigation
          userId: notification.triggeredBy?._id || notification.triggeredBy,
          triggeredByUser:
            notification.triggeredBy?.username ||
            notification.triggeredBy?.fullName,
        },
        // iOS specific settings
        ios_badgeType: "Increase",
        ios_badgeCount: 1,
        // Android specific settings
        android_accent_color: "FFF4CE05", // Your primary color
        small_icon: "ic_notification",
        large_icon: "ic_launcher",
        // Sound and priority
        priority: notification.priority === "urgent" ? 10 : 6,
        android_channel_id: "petoye_notifications",
      };

      console.log(`📱 Sending push notification to ${userId}:`, {
        title: oneSignalNotification.headings.en,
        message: oneSignalNotification.contents.en,
        data: oneSignalNotification.data,
      });

      // Send notification via OneSignal
      const response = await this.oneSignalClient.createNotification(
        oneSignalNotification
      );

      if (response.body && response.body.id) {
        console.log(
          `✅ Push notification sent successfully. OneSignal ID: ${response.body.id}`
        );
        return true;
      } else {
        console.error("❌ Failed to send push notification:", response.body);
        return false;
      }
    } catch (error) {
      console.error("❌ Error sending push notification:", error);

      // Log specific OneSignal errors
      if (error.body) {
        console.error("OneSignal error details:", error.body);
      }

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
