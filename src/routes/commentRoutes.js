const express = require("express");
const commentController = require("../controllers/commentController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/comments/{commentId}/replies:
 *   get:
 *     summary: Get replies for a specific comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Replies retrieved successfully
 *       404:
 *         description: Comment not found
 */
router.get("/:commentId/replies", commentController.getCommentReplies);

/**
 * @swagger
 * /api/comments/{id}/like:
 *   post:
 *     summary: Toggle like on a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Like toggled successfully
 *       404:
 *         description: Comment not found
 */
router.post("/:id/like", commentController.toggleCommentLike);

/**
 * @swagger
 * /api/comments/{id}:
 *   put:
 *     summary: Update a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Updated comment content
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       403:
 *         description: Not authorized to update this comment
 *       404:
 *         description: Comment not found
 */
router.put("/:id", commentController.updateComment);

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       403:
 *         description: Not authorized to delete this comment
 *       404:
 *         description: Comment not found
 */
router.delete("/:id", commentController.deleteComment);

module.exports = router;
