const Joi = require("joi");

// Admin auth validations
const adminLoginValidation = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters long",
    "any.required": "Password is required",
  }),
});

const adminChangePasswordValidation = Joi.object({
  currentPassword: Joi.string().required().messages({
    "any.required": "Current password is required",
  }),
  newPassword: Joi.string().min(6).required().messages({
    "string.min": "New password must be at least 6 characters long",
    "any.required": "New password is required",
  }),
});

const adminUpdateProfileValidation = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).optional(),
  phoneNumber: Joi.string().trim().optional().allow("", null),
  profileImage: Joi.string().uri().optional().allow("", null),
});

const refreshTokenValidation = Joi.object({
  refreshToken: Joi.string().required().messages({
    "any.required": "Refresh token is required",
  }),
});

// User management validations
const updateUserValidation = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).optional(),
  username: Joi.string()
    .trim()
    .lowercase()
    .min(3)
    .max(30)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .optional()
    .messages({
      "string.pattern.base": "Username can only contain letters, numbers, and underscores",
    }),
  email: Joi.string().email().optional(),
  bio: Joi.string().trim().max(150).optional().allow("", null),
  country: Joi.string().trim().optional().allow("", null),
  phoneNumber: Joi.string().trim().optional().allow("", null),
  role: Joi.string().valid("user", "admin").optional(),
});

const updateUserTokensValidation = Joi.object({
  tokens: Joi.number().integer().min(0).required().messages({
    "number.base": "Tokens must be a number",
    "number.min": "Tokens must be at least 0",
    "any.required": "Tokens amount is required",
  }),
  action: Joi.string().valid("set", "add", "subtract").required().messages({
    "any.only": "Action must be either 'set', 'add', or 'subtract'",
    "any.required": "Action is required",
  }),
});

// Post management validations
const updatePostValidation = Joi.object({
  content: Joi.string().trim().max(5000).optional().allow("", null),
});

const deleteMultiplePostsValidation = Joi.object({
  postIds: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .min(1)
    .required()
    .messages({
      "array.min": "At least one post ID is required",
      "any.required": "Post IDs array is required",
    }),
});

// Pet listing validations
const updatePetListingValidation = Joi.object({
  name: Joi.string().trim().optional(),
  gender: Joi.string().valid("male", "female", "other").optional(),
  price: Joi.number().min(0).optional(),
  currencyCode: Joi.string().trim().optional(),
  currencySymbol: Joi.string().trim().optional(),
  description: Joi.string().trim().optional().allow("", null),
  location: Joi.string().trim().optional(),
  type: Joi.string().trim().optional(),
  age: Joi.number().min(0).optional(),
  weight: Joi.string().trim().optional(),
  isVaccinated: Joi.boolean().optional(),
  personalityTraits: Joi.array().items(Joi.string().trim()).optional(),
  favoriteActivities: Joi.array().items(Joi.string().trim()).optional(),
  status: Joi.string().valid("active", "sold", "unavailable").optional(),
});

const updatePetListingStatusValidation = Joi.object({
  status: Joi.string().valid("active", "sold", "unavailable").required().messages({
    "any.only": "Status must be either 'active', 'sold', or 'unavailable'",
    "any.required": "Status is required",
  }),
});

const deleteMultiplePetListingsValidation = Joi.object({
  petIds: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .min(1)
    .required()
    .messages({
      "array.min": "At least one pet ID is required",
      "any.required": "Pet IDs array is required",
    }),
});

// Query parameter validations
const paginationValidation = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().trim().optional().allow(""),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("asc", "desc").optional(),
});

const userListQueryValidation = paginationValidation.keys({
  role: Joi.string().valid("user", "admin").optional().allow(""),
  emailVerify: Joi.string().valid("true", "false").optional().allow(""),
});

const postListQueryValidation = paginationValidation.keys({
  userId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional().allow(""),
  hasMedia: Joi.string().valid("true", "false").optional().allow(""),
});

const petListQueryValidation = paginationValidation.keys({
  status: Joi.string().valid("active", "sold", "unavailable").optional().allow(""),
  type: Joi.string().optional().allow(""),
  gender: Joi.string().valid("male", "female", "other").optional().allow(""),
  isVaccinated: Joi.string().valid("true", "false").optional().allow(""),
  ownerId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional().allow(""),
});

const analyticsQueryValidation = Joi.object({
  period: Joi.string().valid("7days", "30days", "90days", "1year").optional(),
});

const topUsersQueryValidation = Joi.object({
  limit: Joi.number().integer().min(1).max(100).optional(),
  sortBy: Joi.string().valid("posts", "followers", "tokens").optional(),
});

module.exports = {
  // Auth validations
  adminLoginValidation,
  adminChangePasswordValidation,
  adminUpdateProfileValidation,
  refreshTokenValidation,

  // User management validations
  updateUserValidation,
  updateUserTokensValidation,

  // Post management validations
  updatePostValidation,
  deleteMultiplePostsValidation,

  // Pet listing validations
  updatePetListingValidation,
  updatePetListingStatusValidation,
  deleteMultiplePetListingsValidation,

  // Query validations
  paginationValidation,
  userListQueryValidation,
  postListQueryValidation,
  petListQueryValidation,
  analyticsQueryValidation,
  topUsersQueryValidation,
};
