const { z } = require("zod");

// Schema for post creation
const createPostSchema = z.object({
  content: z.string().optional(),
  // No validation for mediaFiles here as they're handled by multer
});

// Schema for post update
const updatePostSchema = z.object({
  content: z.string().optional(),
});

module.exports = {
  createPostSchema,
  updatePostSchema,
};
