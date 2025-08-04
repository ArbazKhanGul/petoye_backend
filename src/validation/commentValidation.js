const { z } = require("zod");

const commentSchema = z.object({
  content: z
    .string({
      required_error: "Comment content is required",
      invalid_type_error: "Comment content must be a string",
    })
    .min(1, { message: "Comment must be at least 1 character long" })
    .max(1000, { message: "Comment cannot exceed 1000 characters" })
    .trim(),
  parentCommentId: z
    .string({
      invalid_type_error: "Parent comment ID must be a valid string",
    })
    .optional(),
});

module.exports = {
  commentSchema,
};
