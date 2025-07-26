const Joi = require("joi");

const petListingSchema = Joi.object({
  name: Joi.string().required().trim().messages({
    "any.required": "Pet name is required",
    "string.empty": "Pet name cannot be empty",
  }),
  price: Joi.string().required().trim().messages({
    "any.required": "Price is required",
    "string.empty": "Price cannot be empty",
  }),
  currencyCode: Joi.string().required().trim().messages({
    "any.required": "Currency code is required",
    "string.empty": "Currency code cannot be empty",
  }),
  currencySymbol: Joi.string().required().trim().messages({
    "any.required": "Currency symbol is required",
    "string.empty": "Currency symbol cannot be empty",
  }),
  description: Joi.string().allow("").trim(),
  type: Joi.string().allow("").trim(),
  age: Joi.string().allow("").trim(),
  weight: Joi.string().allow("").trim(),
  isVaccinated: Joi.boolean().default(false),
  personalityTraits: Joi.array().items(Joi.string().trim()),
  favoriteActivities: Joi.array().items(Joi.string().trim()),
  mediaFiles: Joi.array()
    .items(
      Joi.object({
        uri: Joi.string().required(),
        type: Joi.string().valid("image", "video").required(),
        name: Joi.string().allow(""),
        size: Joi.number(),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "At least one photo or video is required",
      "any.required": "Media files are required",
    }),
});

module.exports = {
  petListingSchema,
};
