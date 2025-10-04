const express = require("express");
const router = express.Router();
const {
  getConversations,
  getMessages,
  markMessagesAsRead,
  deleteConversation,
  getConversationWithUser,
  deleteMessageForSelf,
  getUnreadMessagesCount,
} = require("../controllers/chatController");

const authMiddleware = require("../middleware/authMiddleware");

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Conversation:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Conversation ID
 *         participants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/User'
 *           description: Array of participating users (always 2 for one-to-one)
 *         lastMessage:
 *           $ref: '#/components/schemas/Message'
 *           description: Last message in conversation
 *         lastMessageAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last message
 *         unreadCount:
 *           type: number
 *           description: Number of unread messages for current user
 *         otherParticipant:
 *           $ref: '#/components/schemas/User'
 *           description: The other participant in the conversation
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Message:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Message ID
 *         conversation:
 *           type: string
 *           description: Conversation ID
 *         sender:
 *           $ref: '#/components/schemas/User'
 *           description: Message sender
 *         content:
 *           type: string
 *           description: Message content
 *         messageType:
 *           type: string
 *           enum: [text, media]
 *           description: Type of message
 *         mediaUrl:
 *           type: string
 *           description: URL for media content (if messageType is media)
 *         mediaType:
 *           type: string
 *           enum: [image, video, audio, file]
 *           description: Type of media content
 *         status:
 *           type: string
 *           enum: [sent, delivered, read]
 *           description: Message status
 *         isRead:
 *           type: boolean
 *           description: Whether message has been read
 *         readAt:
 *           type: string
 *           format: date-time
 *           description: When message was read
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/chat/conversations:
 *   get:
 *     summary: Get all conversations for authenticated user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of conversations per page
 *     responses:
 *       200:
 *         description: List of conversations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Conversation'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get("/conversations", getConversations);

/**
 * @swagger
 * /api/chat/unread-count:
 *   get:
 *     summary: Get unread messages count for the authenticated user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread messages count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     unreadCount:
 *                       type: number
 *                       description: Total number of unread messages
 *       401:
 *         description: Unauthorized - Invalid token
 *       500:
 *         description: Server error
 */
router.get("/unread-count", getUnreadMessagesCount);

/**
 * @swagger
 * /api/chat/conversations/{conversationId}/messages:
 *   get:
 *     summary: Get messages for a specific conversation with cursor-based pagination
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of messages to retrieve
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *         description: Get messages before this message ID (for older messages)
 *       - in: query
 *         name: after
 *         schema:
 *           type: string
 *         description: Get messages after this message ID (for newer messages)
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Message'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         limit:
 *                           type: integer
 *                         hasMore:
 *                           type: boolean
 *                         nextCursor:
 *                           type: string
 *                           description: Message ID cursor for getting newer messages
 *                         prevCursor:
 *                           type: string
 *                           description: Message ID cursor for getting older messages
 *                         totalInConversation:
 *                           type: integer
 *                           description: Number of messages in current batch
 *       403:
 *         description: Not a participant in conversation
 *       404:
 *         description: Conversation not found
 */
router.get("/conversations/:conversationId/messages", getMessages);

/**
 * @swagger
 * /api/chat/conversations/{conversationId}/read:
 *   put:
 *     summary: Mark messages as read in a conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Messages marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversationId:
 *                       type: string
 *                     messagesMarked:
 *                       type: number
 *       403:
 *         description: Not a participant in conversation
 *       404:
 *         description: Conversation not found
 */
router.put("/conversations/:conversationId/read", markMessagesAsRead);

/**
 * @swagger
 * /api/chat/conversations/{conversationId}:
 *   delete:
 *     summary: Delete a conversation (soft delete)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Conversation deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       403:
 *         description: Not a participant in conversation
 *       404:
 *         description: Conversation not found
 */
router.delete("/conversations/:conversationId", deleteConversation);

/**
 * @swagger
 * /api/chat/conversations/get-with-user:
 *   post:
 *     summary: Get existing conversation with another user (don't create if none exists)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               otherUserId:
 *                 type: string
 *                 description: ID of the other user to get conversation with
 *             required:
 *               - otherUserId
 *     responses:
 *       200:
 *         description: Conversation retrieved or null if none exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversation:
 *                       oneOf:
 *                         - $ref: '#/components/schemas/Conversation'
 *                         - type: "null"
 *                     otherUser:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input or trying to get conversation with yourself
 *       404:
 *         description: Other user not found
 */
router.post("/conversations/get-with-user", getConversationWithUser);

/**
 * @swagger
 * /api/chat/messages/{messageId}:
 *   delete:
 *     summary: Delete a message for the current user (soft delete)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message deleted for current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       403:
 *         description: Not allowed to delete this message
 *       404:
 *         description: Message not found
 */
router.delete("/messages/:messageId", deleteMessageForSelf);

module.exports = router;
