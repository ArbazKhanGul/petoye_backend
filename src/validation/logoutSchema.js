const { z } = require("zod");

const logoutSchema = z.object({
  refreshToken: z.string({ required_error: "Refresh token is required" }),
});

module.exports = logoutSchema;
