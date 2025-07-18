import Joi from "joi";

const userValidationSchema = Joi.object({
  name: Joi.string()
    .trim()
    .pattern(/^[a-zA-Z\s]+$/)
    .min(1)
    .max(50)
    .required()
    .messages({
      "string.base": "Name must be a string.",
      "string.empty": "Name is required.",
      "string.min": "Name must be at least 1 character.",
      "string.max": "Name cannot exceed 50 characters.",
      "string.pattern.base":
        "Name can only contain letters and spaces. Numbers and special characters are not allowed.",
      "any.required": "Name is required.",
    }),
  email: Joi.string()
    .trim()
    .email({ tlds: { allow: false } })
    .pattern(/^[^\W_][\w.-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .required()
    .messages({
      "string.base": "Email must be a string.",
      "string.empty": "Email is required.",
      "string.email": "Email must be valid.",
      "string.pattern.base": "Email format is invalid. It should not start with special characters.",
      "any.required": "Email is required.",
    }),
  mobile: Joi.string()
    .pattern(/^\+[1-9][0-9]{0,5}[1-9][0-9]{1,20}$/)
    .required()
    .messages({
      "string.base": "Mobile number must be a string.",
      "string.empty": "Mobile number is required.",
      "string.pattern.base":
        "Mobile number must include a valid country code and be in the format: +<country code><number>.",
      "any.required": "Mobile number is required.",
    }),
  country: Joi.string().optional().allow("").messages({
    "string.base": "Country must be a string.",
  }),
  state: Joi.string().optional().allow("").messages({
    "string.base": "State must be a string.",
    "string.empty": "State is required.",
    "any.required": "State is required.",
  }),
  city: Joi.string().optional().allow("").messages({
    "string.base": "City must be a string.",
    "string.empty": "City is required.",
    "any.required": "City is required.",
  }),
  gender: Joi.string().valid("male", "female", "other").required().messages({
    "string.base": "Gender must be a string.",
    "string.empty": "Gender is required.",
    "any.only": "Gender must be one of male, female, or other.",
    "any.required": "Gender is required.",
  }),
  password: Joi.string()
    .min(8)
    .max(15)
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]{8,15}$"
      )
    )
    .required()
    .messages({
      "string.base": "Password must be a string.",
      "string.empty": "Password is required.",
      "string.min": "Password must be at least 8 characters.Password must include at least one lowercase letter, one uppercase letter, one number, and one special character (@$!%*?&#).",
      "string.max": "Password cannot exceed 15 characters.Password must include at least one lowercase letter, one uppercase letter, one number, and one special character (@$!%*?&#).",
      "string.pattern.base":
        "Password must include at least one lowercase letter, one uppercase letter, one number, and one special character (@$!%*?&#).",
      "any.required": "Password is required.",
    }),

  confirm_password: Joi.string()
    .valid(Joi.ref("password"))
    .required()
    .messages({
      "string.base": "Password must be a string.",
      "string.empty": "Confirm Password is required.",
      "any.only": "Password and Confirm Password should be same.",
      "any.required": "Confirm Password is required.",
    }),
  otp: Joi.string().optional().allow("").messages({
    "string.base": "OTP must be a string.",
  }),
  otpExpire: Joi.date().optional().allow("").messages({
    "date.base": "OTP Expiry must be a valid date.",
  }),
  referralBy: Joi.string().optional().allow("", null).messages({
    "string.base": "ReferredBy must be a string.",
  }),
});

const loginValidationSchema = Joi.object({
  email: Joi.string().email().optional().messages({
    "string.base": "Email must be a string.",
    "string.email": "Email must be valid.",
  }),
  mobile: Joi.string()
    .pattern(/^\+[1-9][0-9]{0,3}[1-9][0-9]{9}$/)
    .optional()
    .messages({
      "string.base": "Mobile number must be a string.",
      "string.pattern.base":
        "Mobile number must include a valid country code and be in the format: +<country code><10-digit number>.",
    }),
  password: Joi.string().min(6).max(128).required().messages({
    "string.base": "Password must be a string.",
    "string.empty": "Password is required.",
    "string.min": "Password must be at least 6 characters.",
    "string.max": "Password cannot exceed 128 characters.",
    "any.required": "Password is required.",
  }),
}).xor("email", "mobile");

const setPasswordValidationSchema = Joi.object({
  email: Joi.string().email().optional().messages({
    "string.base": "Email must be a string.",
    "string.email": "Email must be valid.",
  }),
  // password: Joi.string().min(6).max(15).required().messages({
  //   "string.base": "Password must be a string.",
  //   "string.empty": "Password is required.",
  //   "string.min": "Password must be at least 6 characters.",
  //   "string.max": "Password cannot exceed 15 characters.",
  //   "any.required": "Password is required.",
  // }),
  // confirm_password: Joi.string()
  //   .valid(Joi.ref("password"))
  //   .required()
  //   .messages({
  //     "string.base": "Password must be a string.",
  //     "string.empty": "Confirm Password is required.",
  //     "any.only": "Password and Confirm Password should be same.",
  //     "any.required": "Confirm Password is required.",
  //   }),
  password: Joi.string()
    .min(8)
    .max(15)
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]{8,15}$"
      )
    )
    .required()
    .messages({
      "string.base": "Password must be a string.",
      "string.empty": "Password is required.",
      "string.min": "Password must be at least 8 characters.",
      "string.max": "Password cannot exceed 15 characters.",
      "string.pattern.base":
        "Password must include at least one lowercase letter, one uppercase letter, one number, and one special character (@$!%*?&#).",
      "any.required": "Password is required.",
    }),
  confirm_password: Joi.string()
    .valid(Joi.ref("password"))
    .required()
    .messages({
      "string.base": "Password must be a string.",
      "string.empty": "Confirm Password is required.",
      "any.only": "Password and Confirm Password should be same.",
      "any.required": "Confirm Password is required.",
    }),
});

const userValidationSchemaOTP = Joi.object({
  email: Joi.string().email().required().messages({
    "string.base": "Email must be a string.",
    "string.email": "Email must be valid.",
    "any.required": "Email is required.",
  }),
  otp: Joi.string().optional().allow("").messages({
    "string.base": "OTP must be a string.",
  }),
  type: Joi.string().valid("register", null).optional().messages({
    "string.base": "Type must be a string.",
    "any.only": 'Type must be either "register" or null.',
  }),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(6).max(128).required().messages({
    "string.base": "Old Password must be a string.",
    "string.empty": "Old Password is required.",
    "string.min": "Old Password must be at least 6 characters.",
    "string.max": "Old Password cannot exceed 128 characters.",
    "any.required": "Old Password is required.",
  }),
  newPassword: Joi.string()
    .min(8)
    .max(15)
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]{8,15}$"
      )
    )
    .required()
    .messages({
      "string.base": "Password must be a string.",
      "string.empty": "Password is required.",
      "string.min": "Password must be at least 8 characters.",
      "string.max": "Password cannot exceed 15 characters.",
      "string.pattern.base":
        "Password must include at least one lowercase letter, one uppercase letter, one number, and one special character (@$!%*?&#).",
      "any.required": "Password is required.",
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "string.base": "Password must be a string.",
      "string.empty": "Confirm Password is required.",
      "any.only": "Password and Confirm Password should be same.",
      "any.required": "Confirm Password is required.",
    }),
});

const wordLimit = (min, max) => {
  return (value, helpers) => {
    const wordCount = value.trim().split(/\s+/).length;
    if (wordCount < min) {
      return helpers.message(`Bio must have at least ${min} words.`);
    }
    if (wordCount > max) {
      return helpers.message(`Bio must not exceed ${max} words.`);
    }
    return value;
  };
};

const updateProfileSchema = Joi.object({
  name: Joi.string().min(3).max(50).trim().messages({
    "string.min": "Name should have at least 3 characters",
    "string.max": "Name should not exceed 50 characters",
  }),

  state: Joi.string().min(2).max(50).trim().messages({
    "string.min": "State should have at least 2 characters",
    "string.max": "State should not exceed 50 characters",
  }),

  city: Joi.string().min(2).max(50).trim().messages({
    "string.min": "City should have at least 2 characters",
    "string.max": "City should not exceed 50 characters",
  }),

  gender: Joi.string().valid("male", "female", "other").messages({
    "any.only": "Gender must be 'male', 'female' or 'other'",
  }),
  bio: Joi.string()
    .min(10)
    .max(200)
    .trim()
    .messages({
      "string.max": "Bio must not exceed 200 characters.",
    }),
});

const saveDeviceDetailsSchema = Joi.object({
  device_token: Joi.string().required().messages({
    "string.base": "Device Token must be a string.",
    "string.empty": "Device Token is required.",
    "any.required": "Device Token is required.",
  }),
  latitude: Joi.number().required().messages({
    "number.base": "Latitude must be a number.",
    "number.empty": "Latitude is required.",
    "any.required": "Latitude is required.",
  }),
  longitude: Joi.number().required().messages({
    "number.base": "Longitude must be a number.",
    "number.empty": "Longitude is required.",
    "any.required": "Longitude is required.",
  }),
  language: Joi.string().optional().messages({
    "string.base": "Language must be a string.",
  }),
});

const friendRequestSchema = Joi.object({
  friendId: Joi.string().required().messages({
    "string.base": "Friend Id must be a string.",
    "string.empty": "Friend Id is required.",
    "any.required": "Friend Id is required.",
  }),
});

const acceptRejectFriendRequestSchema = Joi.object({
  friendId: Joi.string().required().messages({
    "string.base": "Friend Id must be a string.",
    "string.empty": "Friend Id is required.",
    "any.required": "Friend Id is required.",
  }),
  status: Joi.string().valid("accepted", "rejected").required().messages({
    "string.base": "Status must be a string.",
    "string.empty": "Status is required.",
    "any.only": "Status must be either 'accepted' or 'rejected'",
    "any.required": "Status is required.",
  }),
});

const upsertExperienceSchema = Joi.object({
  id: Joi.string().optional().allow("").messages({
    "string.base": "Experience Id must be a string.",
  }),
  title: Joi.string().min(1).max(150).required().messages({
    "string.base": "Title must be a string.",
    "string.empty": "Title is required.",
    "string.min": "Title must be at least 1 characters.",
    "string.max": "Title cannot exceed 150 characters.",
    "any.required": "Title is required.",
  }),
  employmentType: Joi.string()
    .required()
    .valid(
      "Full-time",
      "Part-time",
      "Internship",
      "Self-employed",
      "Freelance",
      "Trainee"
    )
    .messages({
      "string.base": "Employment Type must be a string.",
      "string.empty": "Employment Type is required.",
      "any.only":
        "Employment Type must be one of 'Full-time', 'Part-time', 'Internship', 'Self-employed', 'Freelance', or 'Trainee'.",
      "any.required": "Employment Type is required.",
    }),
  companyName: Joi.string().min(1).max(150).required().messages({
    "string.base": "Company Name must be a string.",
    "string.empty": "Company Name is required.",
    "string.min": "Company Name must be at least 1 characters.",
    "string.max": "Company Name cannot exceed 150 characters.",
    "any.required": "Company Name is required.",
  }),
  startDate: Joi.date().required().messages({
    "date.base": "Start Date must be a valid date.",
    "date.empty": "Start Date is required.",
    "any.required": "Start Date is required.",
  }),
  endDate: Joi.date().optional().allow("").messages({
    "date.base": "End Date must be a valid date.",
  }),
  location: Joi.string().optional().allow("").messages({
    "string.base": "Location must be a string.",
  }),
  locationType: Joi.string()
    .valid("On-site", "Remote", "Hybrid")
    .optional()
    .messages({
      "string.base": "Location Type must be a string.",
      "any.only":
        "Location Type must be one of 'On-site', 'Remote', or 'Hybrid'.",
    }),
  description: Joi.string().optional().allow("").messages({
    "string.base": "Description must be a string.",
  }),
  skills: Joi.array().items(Joi.string()).optional().allow("").messages({
    "array.base": "Skills must be an array of strings.",
  }),
  isCurrentWorking: Joi.boolean().optional().messages({
    "boolean.base": "Is Current Working must be a boolean.",
  }),
});

const educationSchema = Joi.object({
  id: Joi.string().optional().allow("").messages({
    "string.base": "Education Id must be a string.",
  }),
  institutionName: Joi.string().min(1).max(150).required().messages({
    "string.base": "Institution Name must be a string.",
    "string.empty": "Institution Name is required.",
    "string.min": "Institution Name must be at least 1 characters.",
    "string.max": "Institution Name cannot exceed 150 characters.",
    "any.required": "Institution Name is required.",
  }),
  degree: Joi.string().min(1).max(150).required().messages({
    "string.base": "Degree must be a string.",
    "string.empty": "Degree is required.",
    "string.min": "Degree must be at least 1 characters.",
    "string.max": "Degree cannot exceed 150 characters.",
    "any.required": "Degree is required.",
  }),
  fieldOfStudy: Joi.string().min(1).max(150).required().messages({
    "string.base": "Field of Study must be a string.",
    "string.empty": "Field of Study is required.",
    "string.min": "Field of Study must be at least 1 characters.",
    "string.max": "Field of Study cannot exceed 150 characters.",
    "any.required": "Field of Study is required.",
  }),
  startDate: Joi.date().required().messages({
    "date.base": "Start Date must be a valid date.",
    "date.empty": "Start Date is required.",
    "any.required": "Start Date is required.",
  }),
  endDate: Joi.date().optional().allow("").messages({
    "date.base": "End Date must be a valid date.",
  }),
  description: Joi.string().optional().allow("").messages({
    "string.base": "Description must be a string.",
  }),
  skills: Joi.array().items(Joi.string()).optional().allow("").messages({
    "array.base": "Skills must be an array of strings.",
  }),
  grade: Joi.string().optional().allow("").messages({
    "string.base": "Grade must be a string.",
  }),
});

const addStorySchema = Joi.object({
  mediaType: Joi.string().valid("image", "video", "text").required().messages({
    "string.base": "Media Type must be a string.",
    "any.only": "Media Type must be either 'image', 'video', or 'text'.",
    "any.required": "Media Type is required.",
  }),

  description: Joi.string().when("mediaType", {
    is: "text",
    then: Joi.required().messages({
      "any.required": "Description is required when mediaType is 'text'.",
    }),
    otherwise: Joi.optional(),
  }),
});

const updateDeleteRequestSchema = Joi.object({
  requestId: Joi.string().required().messages({
    "string.base": "Request Id must be a string.",
    "string.empty": "Request Id is required.",
    "any.required": "Request Id is required.",
  }),
  status: Joi.string().valid("approved", "rejected").required().messages({
    "string.base": "Status must be a string.",
    "string.empty": "Status is required.",
    "any.only": "Status must be either 'approved' or 'rejected'.",
    "any.required": "Status is required.",
  }),
});

const saveResourcesSchema = Joi.object({
  type: Joi.string()
    .valid("job", "post", "health_wellness", "event")
    .required()
    .messages({
      "string.base": "Type must be a string.",
      "string.empty": "Type is required.",
      "any.only":
        "Type must be one of 'job', 'post', 'health_wellness', or 'event'.",
      "any.required": "Type is required.",
    }),
  resourceId: Joi.string().required().messages({
    "string.base": "Resource Id must be a string.",
    "string.empty": "Resource Id is required.",
    "any.required": "Resource Id is required.",
  }),
});

const addPagesSchema = Joi.object({
  title: Joi.string().min(1).max(150).required().messages({
    "string.base": "Title must be a string.",
    "string.empty": "Title is required.",
    "string.min": "Title must be at least 1 characters.",
    "string.max": "Title cannot exceed 150 characters.",
    "any.required": "Title is required.",
  }),
  url: Joi.string().required().messages({
    "string.base": "URL must be a string.",
    "string.empty": "URL is required.",
    "any.required": "URL is required.",
  }),
  description: Joi.string().required().messages({
    "string.base": "Description must be a string.",
    "string.empty": "Description is required.",
    "any.required": "Description is required.",
  }),
});

const saveFAQSchema = Joi.object({
  question: Joi.string().required().messages({
    "string.base": "Question must be a string.",
    "string.empty": "Question is required.",
    "any.required": "Question is required.",
  }),
  answer: Joi.string().required().messages({
    "string.base": "Answer must be a string.",
    "string.empty": "Answer is required.",
    "any.required": "Answer is required.",
  }),
});

const updateMatrimonialProfileSchema = Joi.object({
  matrimonialAboutMe: Joi.string().optional().allow("").messages({
    "string.base": "Matrimonial About Me must be a string.",
    "string.empty": "Matrimonial About Me is required.",
  }),
  maritalStatus: Joi.string().optional().allow("").messages({
    "string.base": "Marital Status must be a string.",
  }),
  dob: Joi.date().optional().allow("").messages({
    "date.base": "Date of Birth must be a valid date.",
  }),
  address: Joi.string().optional().allow("").messages({
    "string.base": "Address must be a string.",
  }),
  nativePlace: Joi.string().optional().allow("").messages({
    "string.base": "Native Place must be a string.",
  }),
  birthPlace: Joi.string().optional().allow("").messages({
    "string.base": "Birth Place must be a string.",
  }),
  complexion: Joi.string().optional().allow("").messages({
    "string.base": "Complexion must be a string.",
  }),
  height: Joi.string().optional().allow("").messages({
    "string.base": "Height must be a string.",
  }),
  weight: Joi.string().optional().allow("").messages({
    "string.base": "Weight must be a string.",
  }),
  religion: Joi.string().optional().allow("").messages({
    "string.base": "Religion must be a string.",
  }),
  caste: Joi.string().optional().allow("").messages({
    "string.base": "Caste must be a string.",
  }),
});

const sendNotificationSchema = Joi.object({
  receiverId: Joi.array().items(Joi.string()).required().messages({
    "string.base": "Receiver Id must be a string.",
    "string.empty": "Receiver Id is required.",
    "any.required": "Receiver Id is required.",
  }),
  message: Joi.string().required().messages({
    "string.base": "Message must be a string.",
    "string.empty": "Message is required.",
    "any.required": "Message is required.",
  }),
});


const updateUserDetailsSchema = Joi.object({
  name: Joi.string().min(3).max(50).trim().messages({
    "string.min": "Name should have at least 3 characters",
    "string.max": "Name should not exceed 50 characters",
  }),
  email: Joi.string().email().trim().messages({
    "string.email": "Email must be a valid email",
  }),
  mobile: Joi.string().min(10).max(15).trim().messages({
    "string.min": "Mobile number must be at least 10 digits",
    "string.max": "Mobile number must be at most 15 digits",
  }),
  gender: Joi.string().valid("male", "female", "other").messages({
    "string.base": "Gender must be a string.",
    "any.only": "Gender must be one of the following values: male, female, other.",
  }),
  country: Joi.string().optional().allow("").messages({
    "string.base": "Country must be a string.",
  }),
  state: Joi.string().optional().allow("").messages({
    "string.base": "State must be a string.",
  }),
  city: Joi.string().optional().allow("").messages({
    "string.base": "City must be a string.",
  }),
  profile_image: Joi.string().optional().allow("").messages({
    "string.base": "Profile image must be a string.",
  }),
  aboutMe: Joi.string()
    .min(10)
    .max(200)
    .messages({
      "string.base": "About Me must be a string.",
      "string.empty": "About Me is required.",
      "string.min": "About Me must be at least 10 characters long.",
      "string.max": "About Me must be at most 200 characters long.",
    }),
});

export {
  userValidationSchema,
  loginValidationSchema,
  setPasswordValidationSchema,
  userValidationSchemaOTP,
  updateProfileSchema,
  changePasswordSchema,
  saveDeviceDetailsSchema,
  friendRequestSchema,
  acceptRejectFriendRequestSchema,
  upsertExperienceSchema,
  educationSchema,
  addStorySchema,
  updateDeleteRequestSchema,
  saveResourcesSchema,
  addPagesSchema,
  saveFAQSchema,
  updateMatrimonialProfileSchema,
  sendNotificationSchema,
  updateUserDetailsSchema,
};
