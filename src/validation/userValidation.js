const { z } = require("zod");

const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const signupSchema = z.object({
  fullName: z
    .string({ required_error: "Full name is required" })
    .trim()
    .min(3, { message: "Full name must be at least 3 characters" })
    .max(255, { message: "Full name cannot be more than 255 characters" }),
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email({ message: "Invalid email address" }),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, {
      message: "Password must contain at least one special character",
    }),
  dateOfBirth: z
    .string({ required_error: "Date of birth is required" })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Date of birth must be a valid date",
    }),
  country: z
    .string({ required_error: "Country is required" })
    .trim()
    .min(2, { message: "Country must be at least 2 characters" })
    .regex(/^[A-Za-z ]+$/, {
      message: "Country must only contain letters and spaces",
    }),
  phoneNumber: z
    .string({ required_error: "Phone number is required" })
    .trim()
    .min(8, { message: "Phone number must be at least 8 digits" })
    .max(15, { message: "Phone number must be at most 15 digits" })
    .regex(/^\d+$/, { message: "Phone number must contain only digits" }),
});

const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, { message: "Full name must be at least 3 characters" })
    .max(255, { message: "Full name cannot be more than 255 characters" })
    .optional(),
  phoneNumber: z
    .string()
    .trim()
    .min(8, { message: "Phone number must be at least 8 digits" })
    .max(15, { message: "Phone number must be at most 15 digits" })
    .regex(/^\d+$/, { message: "Phone number must contain only digits" })
    .optional(),
  country: z
    .string()
    .trim()
    .min(2, { message: "Country must be at least 2 characters" })
    .regex(/^[A-Za-z ]+$/, {
      message: "Country must only contain letters and spaces",
    })
    .optional(),
  dateOfBirth: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Date of birth must be a valid date",
    })
    .optional(),
});

const addFcmTokenSchema = z.object({
  userId: z.string({ required_error: "User ID is required" }),
  fcmToken: z
    .string({ required_error: "FCM token is required" })
    .min(100, { message: "FCM token is too short" })
    .max(4096, { message: "FCM token is too long" }),
});

const forgotPasswordSendOtpSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email({ message: "Invalid email address" }),
});

const forgotPasswordVerifyOtpSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email({ message: "Invalid email address" }),
  otp: z
    .string({ required_error: "OTP is required" })
    .length(6, { message: "OTP must be 6 digits" }),
});

const forgotPasswordResetSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email({ message: "Invalid email address" }),
  otp: z
    .string({ required_error: "OTP is required" })
    .length(6, { message: "OTP must be 6 digits" }),
  newPassword: z
    .string({ required_error: "New password is required" })
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, {
      message: "Password must contain at least one special character",
    }),
});

const updatePasswordSchema = z.object({
  userId: z.string({ required_error: "User ID is required" }),
  oldPassword: z.string({ required_error: "Old password is required" }),
  newPassword: z
    .string({ required_error: "New password is required" })
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, {
      message: "Password must contain at least one special character",
    }),
});

module.exports = {
  signupSchema,
  updateProfileSchema,
  addFcmTokenSchema,
  forgotPasswordSendOtpSchema,
  forgotPasswordVerifyOtpSchema,
  forgotPasswordResetSchema,
  updatePasswordSchema,
};
