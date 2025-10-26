const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');

/**
 * @swagger
 * /api/share/post/{postId}:
 *   get:
 *     summary: Share post with Open Graph meta tags
 *     description: Returns HTML page with Open Graph tags for rich preview on social media
 *     tags: [Share]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: HTML page with Open Graph meta tags
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       404:
 *         description: Post not found
 */
router.get('/post/:postId', shareController.sharePost);

/**
 * @swagger
 * /api/share/pet/{petId}:
 *   get:
 *     summary: Share pet listing with Open Graph meta tags
 *     description: Returns HTML page with Open Graph tags for rich preview on social media
 *     tags: [Share]
 *     parameters:
 *       - in: path
 *         name: petId
 *         required: true
 *         schema:
 *           type: string
 *         description: Pet listing ID
 *     responses:
 *       200:
 *         description: HTML page with Open Graph meta tags
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       404:
 *         description: Pet listing not found
 */
router.get('/pet/:petId', shareController.sharePetListing);

/**
 * @swagger
 * /api/share/profile/{userId}:
 *   get:
 *     summary: Share user profile with Open Graph meta tags
 *     description: Returns HTML page with Open Graph tags for rich preview on social media
 *     tags: [Share]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: HTML page with Open Graph meta tags
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       404:
 *         description: User not found
 */
router.get('/profile/:userId', shareController.shareUserProfile);

module.exports = router;
