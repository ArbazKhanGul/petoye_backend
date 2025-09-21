const Notification = require("../models/notification.model");
const mongoose = require("mongoose");

// Get user notifications with cursor-based pagination
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { cursor, limit = 20, type, read } = req.query;

    console.log("📱 Fetching notifications for user:", userId);
    console.log("📱 Query params:", { cursor, limit, type, read });

    // Build filter query
    const filter = { userId };

    // Add type filter if provided
    if (type) {
      filter.type = type;
    }

    // Add read status filter if provided
    if (read !== undefined) {
      filter.isRead = read === "true";
    }

    // Add cursor-based pagination
    if (cursor) {
      filter._id = { $lt: new mongoose.Types.ObjectId(cursor) };
    }

    console.log("📱 Final filter:", filter);

    // Convert limit to number and ensure it's within bounds
    const limitNum = Math.min(parseInt(limit), 50); // Max 50 notifications per request
    console.log("🚀 ~ getUserNotifications ~ filter:", filter);

    // Fetch notifications
    const notifications = await Notification.find(filter)
      .populate("triggeredBy", "firstName lastName profileImage username")
      .populate("relatedData.postId", "content mediaFiles")
      .populate("relatedData.commentId", "content")
      .sort({ _id: -1 }) // Sort by _id descending for cursor pagination
      .limit(limitNum + 1); // Fetch one extra to check if there are more

    // Check if there are more notifications
    const hasMore = notifications.length > limitNum;

    // Remove the extra notification if exists
    if (hasMore) {
      notifications.pop();
    }

    // Get next cursor (last notification's _id)
    const nextCursor =
      notifications.length > 0
        ? notifications[notifications.length - 1]._id.toString()
        : null;

    // Get unread count for the user
    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    // Get total count
    const totalCount = await Notification.countDocuments({ userId });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          hasMore,
          nextCursor,
          limit: limitNum,
        },
        counts: {
          total: totalCount,
          unread: unreadCount,
        },
      },
      message: "Notifications retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching notifications",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Mark notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.params;

    // Validate notification ID
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    // Find and update notification
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        userId, // Ensure user can only mark their own notifications
      },
      {
        isRead: true,
        readAt: new Date(),
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message:
          "Notification not found or you don't have permission to access it",
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
      message: "Notification marked as read successfully",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while marking notification as read",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    // Update all unread notifications for the user
    const result = await Notification.updateMany(
      {
        userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    res.status(200).json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
      },
      message: `${result.modifiedCount} notifications marked as read successfully`,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while marking all notifications as read",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.params;

    // Validate notification ID
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    // Find and delete notification
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId, // Ensure user can only delete their own notifications
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message:
          "Notification not found or you don't have permission to delete it",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while deleting notification",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      data: {
        unreadCount,
      },
      message: "Unread count retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while getting unread count",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Clear all notifications for user
const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.deleteMany({ userId });

    res.status(200).json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
      },
      message: `${result.deletedCount} notifications cleared successfully`,
    });
  } catch (error) {
    console.error("Error clearing all notifications:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while clearing notifications",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get notification statistics
const getNotificationStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get stats by type
    const statsByType = await Notification.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$type",
          total: { $sum: 1 },
          unread: {
            $sum: {
              $cond: [{ $eq: ["$read", false] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          type: "$_id",
          total: 1,
          unread: 1,
          read: { $subtract: ["$total", "$unread"] },
          _id: 0,
        },
      },
    ]);

    // Get overall stats
    const totalCount = await Notification.countDocuments({ userId });
    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      data: {
        overall: {
          total: totalCount,
          unread: unreadCount,
          read: totalCount - unreadCount,
        },
        byType: statsByType,
      },
      message: "Notification statistics retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting notification stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while getting notification statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
  clearAllNotifications,
  getNotificationStats,
};
