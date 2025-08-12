const express = require("express");
const validate = require("../middleware/validateMiddleware");
const {
  updateProfileSchema,
  checkUsernameSchema,
} = require("../validation/profileValidation");
const profileController = require("../controllers/profileController");
const upload = require("../middleware/multer");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get("/", profileController.getProfile);

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "John Doe"
 *               username:
 *                 type: string
 *                 example: "johndoe123"
 *               bio:
 *                 type: string
 *                 maxLength: 150
 *                 example: "Pet lover and animal enthusiast"
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               country:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error or username taken
 *       401:
 *         description: Unauthorized
 */
router.put("/", validate(updateProfileSchema), profileController.updateProfile);

/**
 * @swagger
 * /api/profile/image:
 *   put:
 *     summary: Update profile image
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile image updated successfully
 *       400:
 *         description: No image file provided
 *       401:
 *         description: Unauthorized
 */
router.put(
  "/image",
  upload.single("profileImage"),
  profileController.updateProfileImage
);

/**
 * @swagger
 * /api/profile/search:
 *   get:
 *     summary: Search users by username or full name
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query for username or full name
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
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/search", profileController.searchUsers);

/**
 * @swagger
 * /api/profile/check-username/{username}:
 *   get:
 *     summary: Check username availability
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Username availability checked
 *       400:
 *         description: Invalid username
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/check-username/:username",
  profileController.checkUsernameAvailability
);

module.exports = router;
