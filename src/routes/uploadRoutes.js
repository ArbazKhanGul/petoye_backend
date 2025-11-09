const express = require("express");
const upload = require("../middleware/multer");
const { uploadChatMedia } = require("../controllers/uploadController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     MediaUploadResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             filename:
 *               type: string
 *               description: Generated filename
 *             originalName:
 *               type: string
 *               description: Original filename
 *             mediaType:
 *               type: string
 *               enum: [image, video, audio, file]
 *               description: Type of media
 *             mimeType:
 *               type: string
 *               description: MIME type of the file
 *             size:
 *               type: number
 *               description: File size in bytes
 *             url:
 *               type: string
 *               description: Public URL to access the file
 *             uploadedAt:
 *               type: string
 *               format: date-time
 *             uploadedBy:
 *               type: string
 *               description: User ID who uploaded the file
 */

/**
 * @swagger
 * /api/upload/chat-media:
 *   post:
 *     summary: Upload media file for chat
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Media file to upload (images, videos, audio, documents)
 *             required:
 *               - file
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MediaUploadResponse'
 *       400:
 *         description: No file uploaded or invalid file type
 *       413:
 *         description: File too large (max 50MB)
 *       401:
 *         description: Unauthorized
 */
router.post("/chat-media", upload.single("chat"), uploadChatMedia);

// Competition photo upload (accepts 'file' field name for compatibility)
router.post("/competition-photo", upload.single("file"), uploadChatMedia);

module.exports = router;
