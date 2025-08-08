const express = require("express");
const followController = require("../controllers/followController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /api/follow/{userId}:
 *   post:
 *     summary: Follow a user
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID to follow
 *     responses:
 *       200:
 *         description: User followed successfully
 *       400:
 *         description: Bad request (already following or trying to follow self)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post("/:userId", authMiddleware, followController.followUser);

/**
 * @swagger
 * /api/follow/{userId}:
 *   delete:
 *     summary: Unfollow a user
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID to unfollow
 *     responses:
 *       200:
 *         description: User unfollowed successfully
 *       400:
 *         description: Bad request (not following this user)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.delete("/:userId", authMiddleware, followController.unfollowUser);

/**
 * @swagger
 * /api/follow/{userId}/status:
 *   get:
 *     summary: Get follow status for a user
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID to check follow status
 *     responses:
 *       200:
 *         description: Follow status retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/:userId/status", authMiddleware, followController.getFollowStatus);

/**
 * @swagger
 * /api/follow/{userId}/followers:
 *   get:
 *     summary: Get user's followers list
 *     tags: [Follow]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
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
 *           default: 20
 *         description: Number of followers per page
 *     responses:
 *       200:
 *         description: Followers list retrieved successfully
 *       404:
 *         description: User not found
 */
router.get("/:userId/followers", followController.getFollowers);

/**
 * @swagger
 * /api/follow/{userId}/following:
 *   get:
 *     summary: Get user's following list
 *     tags: [Follow]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
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
 *           default: 20
 *         description: Number of following per page
 *     responses:
 *       200:
 *         description: Following list retrieved successfully
 *       404:
 *         description: User not found
 */
router.get("/:userId/following", followController.getFollowing);

/**
 * @swagger
 * /api/follow/profile/{userId}:
 *   get:
 *     summary: Get user profile with follow information
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       404:
 *         description: User not found
 */
router.get("/profile/:userId", authMiddleware, followController.getUserProfile);

module.exports = router;
