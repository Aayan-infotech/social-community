import joi from "joi";

export const jobValidationSchema = joi.object({
  description: joi.string().optional().messages({
    "string.empty": "Description is optional",
    "string.base": "Description should be a string",
  }),
  location: joi.string().required().messages({
    "string.empty": "Location is required",
    "any.required": "Location is required",
  }),
  companyName: joi.string().required().messages({
    "string.empty": "Company name is required",
    "any.required": "Company name is required",
  }),
  position: joi.string().required().messages({
    "string.empty": "Position is required",
    "any.required": "Position is required",
  }),
  salary: joi.string().optional().messages({
    "string.empty": "Salary is optional",
    "string.base": "Salary should be a string",
  }),
  jobImage: joi.string().optional().allow("").messages({
    "object.base": "Job image should be a string",
    "object.empty": "Job image is optional",
  }),
  requiredSkills: joi.string().required().messages({
    "string.empty": "Required skills are required",
    "any.required": "Required skills are required",
  }),
});

export const applyJobSchema = joi.object({
  jobId: joi.string().required().messages({
    "string.empty": "Job ID is required",
    "any.required": "Job ID is required",
  }),
  email: joi.string().email().required().messages({
    "string.empty": "Email is required",
    "any.required": "Email is required",
    "string.email": "Email must be a valid email address",
  }),
  phone: joi.string().required().messages({
    "string.empty": "Phone number is required",
    "any.required": "Phone number is required",
  }),
  resumeId: joi.string().required().messages({
    "string.empty": "Please upload a resume",
    "any.required": "Resume is required",
  }),
  currentCTC: joi.string().optional().messages({
    "string.empty": "Current CTC is optional",
    "string.base": "Current CTC should be a string",
  }),
  expectedCTC: joi.string().optional().messages({
    "string.empty": "Expected CTC is optional",
    "string.base": "Expected CTC should be a string",
  }),
  noticePeriod: joi.number().optional().messages({
    "number.base": "Notice period should be a number",
  }),
});

export const editJobValidationSchema = joi.object({
  jobId: joi.string().required().messages({
    "string.empty": "Job ID is required",
    "any.required": "Job ID is required",
  }),
  description: joi.string().optional().messages({
    "string.empty": "Description is optional",
    "string.base": "Description should be a string",
  }),
  location: joi.string().required().messages({
    "string.empty": "Location is required",
    "any.required": "Location is required",
  }),
  companyName: joi.string().required().messages({
    "string.empty": "Company name is required",
    "any.required": "Company name is required",
  }),
  position: joi.string().required().messages({
    "string.empty": "Position is required",
    "any.required": "Position is required",
  }),
  salary: joi.string().optional().messages({
    "string.empty": "Salary is optional",
    "string.base": "Salary should be a string",
  }),
  jobImage: joi.string().optional().allow("").messages({
    "object.base": "Job image should be a string",
    "object.empty": "Job image is optional",
  }),
  requiredSkills: joi.string().required().messages({
    "string.empty": "Required skills are required",
    "any.required": "Required skills are required",
  })
});
