import Joi from "joi";

export const addInterestCategorySchema = Joi.object({
  category: Joi.string().min(2).max(100).required().messages({
    "string.base": `"category" should be a type of 'text'`,
    "string.empty": `"category" cannot be an empty field`,
    "string.min": `"category" should have a minimum length of {#limit}`,
    "string.max": `"category" should have a maximum length of {#limit}`,
    "any.required": `"category" is a required field`
  }),
  type: Joi.string().valid("social", "professional").required().messages({
    "string.base": `"type" should be a type of 'text'`,
    "any.required": `"type" is a required field`
  }),
});


export const addInterestSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    "string.base": `"name" should be a type of 'text'`,
    "string.empty": `"name" cannot be an empty field`,
    "string.min": `"name" should have a minimum length of {#limit}`,
    "string.max": `"name" should have a maximum length of {#limit}`,
    "any.required": `"name" is a required field`
  }),
  categoryId: Joi.string().required().messages({
    "string.base": `"categoryId" should be a type of 'text'`,
    "string.empty": `"categoryId" cannot be an empty field`,
    "any.required": `"categoryId" is a required field`
  })
});
