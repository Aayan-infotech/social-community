import Joi from "joi";

const createGroupValidationSchema = Joi.object({
  groupName: Joi.string().trim().min(3).max(50).required().messages({
    "string.base": "Group name must be a string",
    "string.empty": "Group name is required",
    "string.min": "Group name must be at least 3 characters",
    "string.max": "Group name must be at most 50 characters",
    "any.required": "Group name is required",
  }),

  groupDescription: Joi.string().trim().min(10).max(200).required().messages({
    "string.base": "Description must be a string",
    "string.empty": "Description is required",
    "string.min": "Description must be at least 10 characters",
    "string.max": "Description must be at most 200 characters",
    "any.required": "Description is required",
  }),

  members: Joi.array()
    .items(Joi.string().trim().required())
    .min(1)
    .required()
    .messages({
      "array.base": "Members must be an array",
      "array.min": "At least one member is required",
      "any.required": "Members are required",
    }),

  groupImage: Joi.string()
    .uri()
    .default("https://example.com/default-group-image.png")
    .messages({
      "string.uri": "Group image must be a valid URI",
    }),
});

export { createGroupValidationSchema };
