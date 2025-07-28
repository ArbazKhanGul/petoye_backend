const { z } = require("zod");

const petListingSchema = z.object({
  name: z
    .string({
      required_error: "Pet name is required",
      invalid_type_error: "Pet name must be a string",
    })
    .min(1, "Pet name cannot be empty"),

  gender: z.enum(["male", "female", "other"], {
    required_error: "Gender is required",
    invalid_type_error: "Gender must be one of: male, female, other",
  }),

  price: z.union([
    z.number(),
    z.string().transform((val) => {
      const num = Number(val);
      if (isNaN(num)) throw new Error("Price must be a number");
      return num;
    }),
  ]),

  currencyCode: z
    .string({
      required_error: "Currency code is required",
      invalid_type_error: "Currency code must be a string",
    })
    .min(1, "Currency code cannot be empty"),

  currencySymbol: z
    .string({
      required_error: "Currency symbol is required",
      invalid_type_error: "Currency symbol must be a string",
    })
    .min(1, "Currency symbol cannot be empty"),

  location: z
    .string({
      required_error: "Location is required",
      invalid_type_error: "Location must be a string",
    })
    .min(1, "Location cannot be empty"),

  description: z.string().optional(),
  type: z.string().optional(),
  age: z
    .union([
      z.number(),
      z.string().transform((val) => {
        if (val === undefined || val === null || val === "") return undefined;
        const num = Number(val);
        if (isNaN(num)) throw new Error("Age must be a number");
        return num;
      }),
    ])
    .optional(),
  weight: z.string().optional(),
  // Handle form data string conversion for boolean values
  isVaccinated: z
    .union([
      z.boolean(),
      z.string().transform((val) => {
        // Convert string representations to boolean
        if (val === "true" || val === "1") return true;
        if (val === "false" || val === "0" || val === "") return false;
        throw new Error(`Invalid boolean value for isVaccinated: ${val}`);
      }),
    ])
    .default(false),

  // Handle arrays that might come as strings from FormData
  personalityTraits: z
    .union([
      z.array(z.string()),
      z.string().transform((val) => {
        try {
          // Try to parse the string as JSON array
          return JSON.parse(val);
        } catch (e) {
          // If can't parse as JSON, treat as comma-separated values
          return val
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        }
      }),
    ])
    .optional(),

  // Same approach for favoriteActivities
  favoriteActivities: z
    .union([
      z.array(z.string()),
      z.string().transform((val) => {
        try {
          return JSON.parse(val);
        } catch (e) {
          return val
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        }
      }),
    ])
    .optional(),

  // For file uploads in formdata, we'll handle them separately since they're not regular JSON
  // Making this optional here as we'll do custom validation in the controller
  mediaFiles: z.any().optional(),
});

module.exports = {
  petListingSchema,
};
