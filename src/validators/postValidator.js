import Joi from "joi";

const postValidationSchema = Joi.object({
  title: Joi.string().min(3).max(100).required().messages({
    "string.base": "Title must be a string.",
    "string.empty": "Title is required.",
    "string.min": "Title must be at least 3 characters.",
    "string.max": "Title cannot exceed 100 characters.",
    "any.required": "Title is required to create a post.",
  }),
  description: Joi.string().optional().allow("").messages({
    "string.base": "Description must be a string.",
  }),
  type: Joi.string().valid("social", "professional").messages({
    "string.base": "Type must be a string.",
    "any.only": 'Type must be either "social" or "professional".',
    "any.required": "Type is required.",
  }),
  media: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().uri().required().messages({
          "string.uri": "Media URL must be a valid URI.",
          "any.required": "Media URL is required.",
        }),
        type: Joi.string().valid("image", "video").messages({
          "string.base": "Media type must be a string.",
          "any.only": 'Media type must be either "image" or "video".',
          "any.required": "Media type is required.",
        }),
        size: Joi.number()
          .max(5 * 1024 * 1024)
          .messages({
            "number.max": "Media size must not exceed 5MB.",
          }), // Max 5MB
      })
    )
    .max(5)
    .optional()
    .messages({
      "array.max": "You can upload up to 5 media files.",
    }),
});

export { postValidationSchema };
