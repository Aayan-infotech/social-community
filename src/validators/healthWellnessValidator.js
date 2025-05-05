import Joi from "joi";

export const healthWellnessSchema = Joi.object({
  id: Joi.string().optional().allow("").messages({
    "string.empty": "ID is optional",
  }),
  title: Joi.string().required().messages({
    "string.empty": "Title is required",
    "any.required": "Title is required",
  }),
  description: Joi.string().required().messages({
    "string.empty": "Description is required",
    "any.required": "Description is required",
  }),
  location: Joi.string().required().messages({
    "string.empty": "Location is required",
    "any.required": "Location is required",
  }),
  resourceImage: Joi.string().optional().allow("").messages({
    "object.base": "Resource image should be a string",
    "object.empty": "Resource image is optional",
  }),
});
