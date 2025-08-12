const { z } = require("zod");

// Enhanced profile update validation schema with username and bio
const updateProfileSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, { message: "Full name must be at least 2 characters" })
      .max(50, { message: "Full name cannot exceed 50 characters" })
      .optional(),

    username: z
      .string()
      .trim()
      .min(3, { message: "Username must be at least 3 characters" })
      .max(30, { message: "Username cannot exceed 30 characters" })
      .regex(/^[a-zA-Z0-9_]+$/, {
        message: "Username can only contain letters, numbers, and underscores",
      })
      .transform((val) => val.toLowerCase())
      .optional(),

    bio: z
      .string()
      .trim()
      .max(150, { message: "Bio cannot exceed 150 characters" })
      .optional()
      .or(z.literal("")), // Allow empty string

    dateOfBirth: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Date of birth must be a valid date",
      })
      .refine((val) => new Date(val) <= new Date(), {
        message: "Date of birth cannot be in the future",
      })
      .optional(),

    country: z
      .string()
      .trim()
      .min(2, { message: "Country must be at least 2 characters" })
      .max(50, { message: "Country cannot exceed 50 characters" })
      .optional(),

    phoneNumber: z
      .string()
      .trim()
      .min(10, { message: "Phone number must be at least 10 digits" })
      .max(15, { message: "Phone number cannot exceed 15 digits" })
      .regex(/^[+]?[\d\s-()]+$/, { message: "Invalid phone number format" })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

// Username check validation schema
const checkUsernameSchema = z.object({
  username: z
    .string({ required_error: "Username is required" })
    .trim()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(30, { message: "Username cannot exceed 30 characters" })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: "Username can only contain letters, numbers, and underscores",
    })
    .transform((val) => val.toLowerCase()),
});

module.exports = {
  updateProfileSchema,
  checkUsernameSchema,
};
