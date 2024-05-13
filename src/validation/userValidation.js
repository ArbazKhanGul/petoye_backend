const { z } = require("zod")

const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const signupSchema = z.object({
    username: z.string({ required_error: "Name is required" }).trim().min(3, { message: "Name must be at least 3 character" }).max(255, { message: "Name cannot be more than 255 character" }),
    email: z.string({ required_error: "Email is required" }).trim().email(),
    password:z.string({required_error: "Password is required" }),
})

module.exports = signupSchema;

