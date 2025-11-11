const { z } = require("zod");

// Submit entry validation
const submitEntrySchema = z.object({
  petName: z
    .string({
      required_error: "Pet name is required",
      invalid_type_error: "Pet name must be a string",
    })
    .min(1, "Pet name cannot be empty")
    .max(100, "Pet name must be less than 100 characters"),

  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),

  photoUrl: z
    .string({
      required_error: "Photo is required",
    })
    .url("Photo URL must be a valid URL"),
});

// Vote validation
const voteSchema = z.object({
  deviceInfo: z.object({
    deviceId: z.string({
      required_error: "Device ID is required",
    }),
    deviceModel: z.string().optional(),
    osVersion: z.string().optional(),
    platform: z.enum(["android", "ios"], {
      required_error: "Platform is required",
      invalid_type_error: "Platform must be either 'android' or 'ios'",
    }),
  }),
});

module.exports = {
  submitEntrySchema,
  voteSchema,
};
