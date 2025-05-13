import joi from "joi";

const upsertBussinessCategorySchema = joi.object({
  id: joi.string().allow("").messages({
    "string.empty": "ID is required",
    "any.required": "ID is required",
  }),
  category_name: joi.string().required().messages({
    "string.empty": "Category name is required",
    "any.required": "Category name is required",
  }),
  category_image: joi.string().allow("").messages({
    "string.empty": "Category image is required",
    "any.required": "Category image is required",
  }),
});

const addBusinessSchema = joi.object({
  businessName: joi.string().required().messages({
    "string.empty": "Business name is required",
    "any.required": "Business name is required",
  }),
  categoryId: joi.string().required().messages({
    "string.empty": "Category ID is required",
    "any.required": "Category ID is required",
  }),
  address : joi.string().required().messages({
    "string.empty": "Address is required",
    "any.required": "Address is required",
  }),
  latitude : joi.string().required().messages({
    "string.empty": "Latitude is required",
    "any.required": "Latitude is required",
  }),
  longitude : joi.string().required().messages({
    "string.empty": "Longitude is required",
    "any.required": "Longitude is required",
  }),
  description : joi.string().allow("").messages({
    "string.empty": "Description is required",
    "any.required": "Description is required",
  }),
});

export { upsertBussinessCategorySchema, addBusinessSchema };
