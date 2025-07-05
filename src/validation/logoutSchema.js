const { z } = require("zod");

const logoutSchema = z.object({
  refreshToken: z.string({ required_error: "Refresh token is required" }),
  fcmToken: z.string().optional(),
  authToken: z.string().optional(),
});

module.exports = logoutSchema;
