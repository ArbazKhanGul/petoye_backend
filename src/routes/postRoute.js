const express = require("express");
const validate = require("../middleware/validateMiddleware");
const {
  createPostSchema,
  updatePostSchema,
} = require("../validation/postValidation");
const postController = require("../controllers/postController");
const upload = require("../middleware/multer");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: The text content of the post
 *               mediaFiles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Media files (images/videos) for the post
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router
  .route("/")
  // Create a post with optional media files (up to 3)
  .post(
    upload.fields([
      { name: "mediaFiles", maxCount: 3 },
      { name: "thumbnails", maxCount: 3 },
    ]),
    validate(createPostSchema),
    postController.createPost
  )
  // Get all posts with pagination
  .get(postController.getAllPosts);

/**
 * @swagger
 * /api/posts/me:
 *   get:
 *     summary: Get current user's posts
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Items per page
 *     responses:
 *       200:
 *         description: User's posts fetched successfully
 */
router.route("/me").get(postController.getMyPosts);

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Get post by ID
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
 *         description: Post fetched successfully
 *       404:
 *         description: Post not found
 */
router
  .route("/:id")
  .get(postController.getPostById)
  /**
   * @swagger
   * /api/posts/{id}:
   *   put:
   *     summary: Update a post
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
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               content:
   *                 type: string
   *                 description: Updated text content
   *     responses:
   *       200:
   *         description: Post updated successfully
   *       403:
   *         description: Not authorized to update this post
   *       404:
   *         description: Post not found
   */
  .put(validate(updatePostSchema), postController.updatePost)
  /**
   * @swagger
   * /api/posts/{id}:
   *   delete:
   *     summary: Delete a post
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
   *         description: Post deleted successfully
   *       403:
   *         description: Not authorized to delete this post
   *       404:
   *         description: Post not found
   */
  .delete(postController.deletePost);

/**
 * @swagger
 * /api/posts/{id}/counts:
 *   get:
 *     summary: Get interaction counts for a post
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
 *         description: Post counts fetched successfully
 *       404:
 *         description: Post not found
 */
router.get("/:id/counts", authMiddleware, postController.getPostCounts);

/**
 * @swagger
 * /api/posts/update-counts:
 *   post:
 *     summary: Update all post counts (admin only)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All post counts updated successfully
 *       403:
 *         description: Not authorized
 */
router.post("/update-counts", authMiddleware, postController.updatePostCounts);

module.exports = router;
