const { z } = require("zod");

// Schema for post creation
const createPostSchema = z
  .object({
    content: z.string().optional(),
    // No validation for mediaFiles here as they're handled by multer
  })
  .refine(
    (data) => {
      // Either content or mediaFiles (from multer) should be present
      // mediaFiles are not in the body directly, they'll be attached by multer as req.files
      return data.content !== undefined && data.content.trim() !== "";
    },
    {
      message: "Post must contain either text content or media files",
      path: ["content"],
    }
  );

// Schema for post update
const updatePostSchema = z.object({
  content: z.string().optional(),
});

module.exports = {
  createPostSchema,
  updatePostSchema,
};
