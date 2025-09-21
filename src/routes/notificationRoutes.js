const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
  clearAllNotifications,
  getNotificationStats,
} = require("../controllers/notificationController");

// All notification routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications with cursor-based pagination
 * @access  Private
 * @query   {string} cursor - Cursor for pagination (notification ID)
 * @query   {number} limit - Number of notifications to fetch (default: 20, max: 50)
 * @query   {string} type - Filter by notification type (optional)
 * @query   {boolean} read - Filter by read status (optional)
 */
router.get("/", getUserNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count for user
 * @access  Private
 */
router.get("/unread-count", getUnreadCount);

/**
 * @route   GET /api/notifications/stats
 * @desc    Get notification statistics for user
 * @access  Private
 */
router.get("/stats", getNotificationStats);

/**
 * @route   PUT /api/notifications/:notificationId/read
 * @desc    Mark specific notification as read
 * @access  Private
 * @param   {string} notificationId - ID of the notification to mark as read
 */
router.put("/:notificationId/read", markNotificationAsRead);

/**
 * @route   PUT /api/notifications/mark-all-read
 * @desc    Mark all notifications as read for user
 * @access  Private
 */
router.put("/mark-all-read", markAllNotificationsAsRead);

/**
 * @route   DELETE /api/notifications/:notificationId
 * @desc    Delete specific notification
 * @access  Private
 * @param   {string} notificationId - ID of the notification to delete
 */
router.delete("/:notificationId", deleteNotification);

/**
 * @route   DELETE /api/notifications/clear-all
 * @desc    Clear all notifications for user
 * @access  Private
 */
router.delete("/clear-all", clearAllNotifications);

module.exports = router;
