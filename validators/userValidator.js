import Joi from 'joi';

const userValidationSchema = Joi.object({
    name: Joi.string().min(3).max(50).required().messages({
        'string.base': 'Name must be a string.',
        'string.empty': 'Name is required.',
        'string.min': 'Name must be at least 3 characters.',
        'string.max': 'Name cannot exceed 50 characters.',
        'any.required': 'Name is required.',
    }),
    email: Joi.string().email().required().messages({
        'string.base': 'Email must be a string.',
        'string.email': 'Email must be valid.',
        'any.required': 'Email is required.',
    }),
    mobile: Joi.string()
        .pattern(/^\+[1-9][0-9]{0,3}[1-9][0-9]{9}$/)
        .required()
        .messages({
            'string.base': 'Mobile number must be a string.',
            'string.empty': 'Mobile number is required.',
            'string.pattern.base': 'Mobile number must include a valid country code and be in the format: +<country code><10-digit number>.',
            'any.required': 'Mobile number is required.',
        }),
    state: Joi.string().required().messages({
        'string.base': 'State must be a string.',
        'string.empty': 'State is required.',
        'any.required': 'State is required.',
    }),
    city: Joi.string().required().messages({
        'string.base': 'City must be a string.',
        'string.empty': 'City is required.',
        'any.required': 'City is required.',
    }),
    gender: Joi.string().valid('male', 'female', 'other').required().messages({
        'string.base': 'Gender must be a string.',
        'string.empty': 'Gender is required.',
        'any.only': 'Gender must be one of male, female, or other.',
        'any.required': 'Gender is required.',
    }),
    password: Joi.string().min(6).max(15).required().messages({
        'string.base': 'Password must be a string.',
        'string.empty': 'Password is required.',
        'string.min': 'Password must be at least 6 characters.',
        'string.max': 'Password cannot exceed 15 characters.',
        'any.required': 'Password is required.',
    }),
    otp: Joi.string().optional().allow('').messages({
        'string.base': 'OTP must be a string.',
    }),
    otpExpire: Joi.date().optional().allow('').messages({
        'date.base': 'OTP Expiry must be a valid date.',
    }),
    referralBy: Joi.string().optional().allow('', null).messages({
        'string.base': 'ReferredBy must be a string.',
    }),
});

const loginValidationSchema = Joi.object({
    email: Joi.string().email().optional().messages({
        'string.base': 'Email must be a string.',
        'string.email': 'Email must be valid.',
    }),
    mobile: Joi.string()
        .pattern(/^\+[1-9][0-9]{0,3}[1-9][0-9]{9}$/)
        .optional()
        .messages({
            'string.base': 'Mobile number must be a string.',
            'string.pattern.base': 'Mobile number must include a valid country code and be in the format: +<country code><10-digit number>.',
        }),
    password: Joi.string().min(6).max(128).required().messages({
        'string.base': 'Password must be a string.',
        'string.empty': 'Password is required.',
        'string.min': 'Password must be at least 6 characters.',
        'string.max': 'Password cannot exceed 128 characters.',
        'any.required': 'Password is required.',
    }),
}).xor('email', 'mobile');

const setPasswordValidationSchema = Joi.object({
    email: Joi.string().email().optional().messages({
        'string.base': 'Email must be a string.',
        'string.email': 'Email must be valid.',
    }),
    password: Joi.string().min(6).max(15).required().messages({
        'string.base': 'Password must be a string.',
        'string.empty': 'Password is required.',
        'string.min': 'Password must be at least 6 characters.',
        'string.max': 'Password cannot exceed 15 characters.',
        'any.required': 'Password is required.',
    })
});

const userValidationSchemaOTP = Joi.object({
    email: Joi.string().email().required().messages({
        'string.base': 'Email must be a string.',
        'string.email': 'Email must be valid.',
        'any.required': 'Email is required.',
    }),
    otp: Joi.string().optional().allow('').messages({
        'string.base': 'OTP must be a string.',
    }),
    type: Joi.string().valid('register', null).optional().messages({
        'string.base': 'Type must be a string.',
        'any.only': 'Type must be either "register" or null.',
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
    name: Joi.string().min(3).max(50).trim()
        .messages({
            "string.min": "Name should have at least 3 characters",
            "string.max": "Name should not exceed 50 characters",
        }),

    email: Joi.string().email().lowercase()
        .messages({
            'string.base': 'Email must be a string.',
            'string.email': 'Email must be valid.',
            'any.required': 'Email is required.',
        }),

    mobile: Joi.string().pattern(/^\+91[0-9]{10}$/)
        .messages({
            'string.base': 'Mobile number must be a string.',
            'string.empty': 'Mobile number is required.',
            'string.pattern.base': 'Mobile number must include a valid country code and be in the format: +<country code><10-digit number>.',
            'any.required': 'Mobile number is required.',
        }),

    state: Joi.string().min(2).max(50).trim()
        .messages({
            "string.min": "State should have at least 2 characters",
            "string.max": "State should not exceed 50 characters",
        }),

    city: Joi.string().min(2).max(50).trim()
        .messages({
            "string.min": "City should have at least 2 characters",
            "string.max": "City should not exceed 50 characters",
        }),

    gender: Joi.string().valid("male", "female", "other")
        .messages({
            "any.only": "Gender must be 'male', 'female' or 'other'",
        }),
    bio: Joi.string().max(200).trim().custom(wordLimit(10, 200), "Word limit validation")
        .messages({
            "string.max": "Bio must not exceed 2000 characters.",
        })

}).min(1)
    .messages({
        "object.min": "At least one field is required for update"
    });

export {
    userValidationSchema,
    loginValidationSchema,
    setPasswordValidationSchema,
    userValidationSchemaOTP,
    updateProfileSchema
};