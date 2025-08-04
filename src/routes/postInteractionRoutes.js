const express = require("express");
const likeController = require("../controllers/likeController");
const commentController = require("../controllers/commentController");
const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validateMiddleware");
const { commentSchema } = require("../validation/commentValidation");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/posts/{id}/like:
 *   post:
 *     summary: Toggle like status on a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Like toggled successfully
 *       404:
 *         description: Post not found
 */
router.post("/:id/like", likeController.toggleLike);

/**
 * @swagger
 * /api/posts/{id}/likes:
 *   get:
 *     summary: Get all likes for a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Likes retrieved successfully
 *       404:
 *         description: Post not found
 */
router.get("/:id/likes", likeController.getPostLikes);

/**
 * @swagger
 * /api/posts/{id}/liked:
 *   get:
 *     summary: Check if current user has liked a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Like status retrieved successfully
 */
router.get("/:id/liked", likeController.checkUserLiked);

/**
 * @swagger
 * /api/posts/{id}/comments:
 *   post:
 *     summary: Add a comment to a post
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Comment text content
 *               parentCommentId:
 *                 type: string
 *                 description: ID of parent comment for replies
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       404:
 *         description: Post not found
 */
router.post(
  "/:id/comments",
  validate(commentSchema),
  commentController.addComment
);

/**
 * @swagger
 * /api/posts/{id}/comments:
 *   get:
 *     summary: Get comments for a post
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
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
 *         description: Comments retrieved successfully
 *       404:
 *         description: Post not found
 */
router.get("/:id/comments", commentController.getPostComments);

module.exports = router;
