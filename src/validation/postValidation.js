const { z } = require("zod");

// Schema for post creation
const createPostSchema = z.object({
  content: z.string().optional(),
  // No validation for mediaFiles here as they're handled by multer
});

// Schema for post update
const updatePostSchema = z.object({
  content: z.string().optional(),
  existingMediaFiles: z.string().optional(), // JSON string of existing media to keep
  mediaTypes: z.string().optional(), // JSON string of media types
});

module.exports = {
  createPostSchema,
  updatePostSchema,
};
