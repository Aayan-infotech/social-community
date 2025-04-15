import Joi from "joi";

export const familySchema = Joi.object({
  id: Joi.string().optional().messages({
    "string.type": "Family ID must be a string",
  }),
  familyName: Joi.string().required().messages({
    "string.empty": "Family name is required",
    "any.required": "Family name is required",
  }),
  familyLocation: Joi.string().required().messages({
    "string.empty": "Family location is required",
    "any.required": "Family location is required",
  }),
});

export const addFamilyMemberRequestSchema = Joi.object({
  name: Joi.string().required().messages({
    "string.empty": "Name is required",
    "any.required": "Name is required",
  }),

  relationship: Joi.string()
    .required()
    .valid(
      "great great grandfather",
      "great great grandmother",
      "great grandfather",
      "great grandmother",
      "grandfather",
      "grandmother",
      "great uncle",
      "great aunt",
      "father",
      "mother",
      "uncle",
      "aunt",
      "wife",
      "husband",
      "brother",
      "sister",
      "cousin brother",
      "cousin sister",
      "son",
      "daughter",
      "nephew",
      "niece",
      "grandson",
      "granddaughter",
      "great grandson",
      "great granddaughter"
    )
    .messages({
      "string.empty": "Relationship is required",
      "any.required": "Relationship is required",
      "any.only": "Relationship must be one of the valid options",
    }),
  jobRole: Joi.string().optional().messages({
    "string.empty": "Job role is optional",
  }),
  company: Joi.string().optional().messages({
    "string.empty": "Company is optional",
  }),
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "any.required": "Email is required",
    "string.email": "Email must be a valid email address",
  }),
  mobile: Joi.string()
    .pattern(/^\+[1-9][0-9]{0,3}[1-9][0-9]{9}$/)
    .required()
    .messages({
      "string.empty": "Mobile number is required",
      "any.required": "Mobile number is required",
      "string.pattern.base": "Mobile number must be a valid 10-digit number",
    }),
  address: Joi.string().optional().messages({
    "string.empty": "Address is optional",
  }),
});

export const acceptFamilyMemberRequestSchema = Joi.object({
  requestId: Joi.string().required().messages({
    "string.empty": "Family member request ID is required",
    "any.required": "Family member request ID is required",
  }),
  status: Joi.string()
    .valid("accepted", "rejected")
    .required()
    .messages({
      "string.empty": "Status is required",
      "any.required": "Status is required",
      "any.only": "Status must be either accepted or rejected",
    }),
});
