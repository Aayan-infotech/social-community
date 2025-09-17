import joi from 'joi';

export const addMatrimonialSchema = joi.object({
    profileFor: joi.string().valid('self', 'son', 'daughter', 'brother', 'sister', 'relative', 'friend').required().messages({
        'string.base': 'profileFor should be a type of text',
        'any.only': 'profileFor must be one of [self, son, daughter, brother, sister, relative, friend]',
        'any.required': 'profileFor is a required field'
    }),
    gender: joi.string().valid('male', 'female', 'other').required().messages({
        'string.base': 'gender should be a type of text',
        'any.only': 'gender must be one of [male, female, other]',
        'any.required': 'gender is a required field'
    }),
    name: joi.string().min(3).max(30).required().messages({
        'string.base': 'name should be a type of text',
        'string.empty': 'name cannot be an empty field',
        'string.min': 'name should have a minimum length of 3',
        'string.max': 'name should have a maximum length of 30',
        'any.required': 'name is a required field'
    }),
    age: joi.number().min(18).required().messages({
        'number.base': 'age should be a type of number',
        'number.min': 'age should be at least 18',
        'any.required': 'age is a required field'
    }),
    dob: joi.date().less('now').required().messages({
        'date.base': 'dob should be a valid date',
        'date.less': 'dob must be in the past',
        'any.required': 'dob is a required field'
    }),
    mobileNo: joi.string().pattern(/^[0-9]{10}$/).required().messages({
        'string.base': 'mobileNo should be a type of text',
        'string.empty': 'mobileNo cannot be an empty field',
        'string.pattern.base': 'mobileNo must be a valid 10-digit number',
        'any.required': 'mobileNo is a required field'
    }),
    email: joi.string().email().required().messages({
        'string.base': 'email should be a type of text',
        'string.empty': 'email cannot be an empty field',
        'string.email': 'email must be a valid email address',
        'any.required': 'email is a required field'
    }),

    religion: joi.string().valid('hindu', 'muslim', 'christian', 'sikh', 'jain', 'buddhist', 'parsi', 'others').required().messages({
        'string.base': 'religion should be a type of text',
        'string.empty': 'religion cannot be an empty field',
        'any.only': 'religion must be one of hindu, muslim, christian, sikh, jain, buddhist, parsi, others',
        'any.required': 'religion is a required field'
    }),

    community: joi.string().required().messages({
        'string.base': 'community should be a type of text',
        'string.empty': 'community cannot be an empty field',
        'any.required': 'community is a required field'
    }),

    livingIn: joi.string().required().messages({
        'string.base': 'livingIn should be a type of text',
        'string.empty': 'livingIn cannot be an empty field',
        'any.required': 'livingIn is a required field'
    }),

    marryInOtherCaste: joi.boolean().default(false).required().messages({
        'boolean.base': 'marryInOtherCaste should be a type of boolean',
        'any.required': 'marryInOtherCaste is a required field'
    }),

    maritalStatus: joi.string().valid('never married', 'divorced', 'widowed', 'separated').required().messages({
        'string.base': 'maritalStatus should be a type of text',
        'any.only': 'maritalStatus must be one of [never married, divorced, widowed, separated]',
        'any.required': 'maritalStatus is a required field'
    }),

    noOfChildren: joi.number().min(0).optional().messages({
        'number.base': 'noOfChildren should be a type of number',
        'number.min': 'noOfChildren cannot be negative',
        'any.required': 'noOfChildren is a required field'
    }),

    diet: joi.string().valid('vegetarian', 'non-vegetarian', 'vegan', 'eggetarian', 'other').required().messages({
        'string.base': 'diet should be a type of text',
        'any.only': 'diet must be one of [vegetarian, non-vegetarian, vegan, eggetarian, other]',
        'any.required': 'diet is a required field'
    }),

    height: joi.string().required().messages({
        'string.base': 'height should be a type of text',
        'string.empty': 'height cannot be an empty field',
        'any.required': 'height is a required field'
    }),

    weight: joi.string().required().messages({
        'string.base': 'weight should be a type of text',
        'string.empty': 'weight cannot be an empty field',
        'any.required': 'weight is a required field'
    }),

    state: joi.string().required().messages({
        'string.base': 'state should be a type of text',
        'string.empty': 'state cannot be an empty field',
        'any.required': 'state is a required field'
    }),

    city: joi.string().required().messages({
        'string.base': 'city should be a type of text',
        'string.empty': 'city cannot be an empty field',
        'any.required': 'city is a required field'
    }),

    subCommunity: joi.string().required().messages({
        'string.base': 'subCommunity should be a type of text',
        'string.empty': 'subCommunity cannot be an empty field',
        'any.required': 'subCommunity is a required field'
    }),

    disability: joi.boolean().default(false).required().messages({
        'boolean.base': 'disability should be a type of boolean',
        'any.required': 'disability is a required field'
    }),

    highestQualification: joi.string().required().messages({
        'string.base': 'highestQualification should be a type of text',
        'string.empty': 'highestQualification cannot be an empty field',
        'any.required': 'highestQualification is a required field'
    }),

    college: joi.string().required().messages({
        'string.base': 'college should be a type of text',
        'string.empty': 'college cannot be an empty field',
        'any.required': 'college is a required field'
    }),

    workWith: joi.string().required().messages({
        'string.base': 'workWith should be a type of text',
        'string.empty': 'workWith cannot be an empty field',
        'any.required': 'workWith is a required field'
    }),

    workAs: joi.string().required().messages({
        'string.base': 'workAs should be a type of text',
        'string.empty': 'workAs cannot be an empty field',
        'any.required': 'workAs is a required field'
    }),

    annualIncome: joi.string().required().messages({
        'string.base': 'annualIncome should be a type of text',
        'string.empty': 'annualIncome cannot be an empty field',
        'any.required': 'annualIncome is a required field'
    }),

    workLocation: joi.string().required().messages({
        'string.base': 'workLocation should be a type of text',
        'string.empty': 'workLocation cannot be an empty field',
        'any.required': 'workLocation is a required field'
    }),

    about: joi.string().min(10).max(1000).required().messages({
        'string.base': 'about should be a type of text',
        'string.empty': 'about cannot be an empty field',
        'string.min': 'about should have a minimum length of 10',
        'string.max': 'about should have a maximum length of 1000',
        'any.required': 'about is a required field'
    }),

    profilePicture: joi.array().items(joi.string()).max(3).messages({
        'array.base': 'profilePicture should be an array of strings',
        'array.max': 'You can upload a maximum of 3 profile pictures',
        'string.base': 'Each profile picture should be a type of text'
    }),
});


export const addIndentyProofDocumentSchema = joi.object({
    documentName: joi.string().required().messages({
        'string.base': 'documentName should be a type of text',
        'string.empty': 'documentName cannot be an empty field',
        'any.required': 'documentName is a required field'
    }),
    documentNumber: joi.string().required().messages({
        'string.base': 'documentNumber should be a type of text',
        'string.empty': 'documentNumber cannot be an empty field',
        'any.required': 'documentNumber is a required field'
    }),
});

export const addFamilyDetailsSchema = joi.object({
    fatherName: joi.string().required().messages({
        'string.base': 'fatherName should be a type of text',
        'string.empty': 'fatherName cannot be an empty field',
        'any.required': 'fatherName is a required field'
    }),
    motherName: joi.string().required().messages({
        'string.base': 'motherName should be a type of text',
        'string.empty': 'motherName cannot be an empty field',
        'any.required': 'motherName is a required field'
    }),
    noOfBrothers: joi.number().min(0).required().messages({
        'number.base': 'noOfBrothers should be a type of number',
        'number.min': 'noOfBrothers cannot be negative',
        'any.required': 'noOfBrothers is a required field'
    }),
    noOfSisters: joi.number().min(0).required().messages({
        'number.base': 'noOfSisters should be a type of number',
        'number.min': 'noOfSisters cannot be negative',
        'any.required': 'noOfSisters is a required field'
    }),
    financialStatus: joi.string().valid('lower middle class', 'middle class', 'upper middle class', 'rich', 'affluent').required().messages({
        'string.base': 'financialStatus should be a type of text',
        'string.empty': 'financialStatus cannot be an empty field',
        'any.required': 'financialStatus is a required field'
    }),
    livedWithFamily: joi.boolean().required().messages({
        'boolean.base': 'livedWithFamily should be a type of boolean',
        'any.required': 'livedWithFamily is a required field'
    }),
});


export const updateMatrimonialSchema = joi.object({
    profileFor: joi.string().valid('self', 'son', 'daughter', 'brother', 'sister', 'relative', 'friend').required().messages({
        'string.base': 'profileFor should be a type of text',
        'any.only': 'profileFor must be one of [self, son, daughter, brother, sister, relative, friend]',
        'any.required': 'profileFor is a required field'
    }),
    gender: joi.string().valid('male', 'female', 'other').required().messages({
        'string.base': 'gender should be a type of text',
        'any.only': 'gender must be one of [male, female, other]',
        'any.required': 'gender is a required field'
    }),
    name: joi.string().min(3).max(30).required().messages({
        'string.base': 'name should be a type of text',
        'string.empty': 'name cannot be an empty field',
        'string.min': 'name should have a minimum length of 3',
        'string.max': 'name should have a maximum length of 30',
        'any.required': 'name is a required field'
    }),
    age: joi.number().min(18).required().messages({
        'number.base': 'age should be a type of number',
        'number.min': 'age should be at least 18',
        'any.required': 'age is a required field'
    }),
    dob: joi.date().less('now').required().messages({
        'date.base': 'dob should be a valid date',
        'date.less': 'dob must be in the past',
        'any.required': 'dob is a required field'
    }),
    mobileNo: joi.string().pattern(/^[0-9]{10}$/).required().messages({
        'string.base': 'mobileNo should be a type of text',
        'string.empty': 'mobileNo cannot be an empty field',
        'string.pattern.base': 'mobileNo must be a valid 10-digit number',
        'any.required': 'mobileNo is a required field'
    }),
    email: joi.string().email().required().messages({
        'string.base': 'email should be a type of text',
        'string.empty': 'email cannot be an empty field',
        'string.email': 'email must be a valid email address',
        'any.required': 'email is a required field'
    }),

    religion: joi.string().valid('hindu', 'muslim', 'christian', 'sikh', 'jain', 'buddhist', 'parsi', 'others').required().messages({
        'string.base': 'religion should be a type of text',
        'string.empty': 'religion cannot be an empty field',
        'any.only': 'religion must be one of hindu, muslim, christian, sikh, jain, buddhist, parsi, others',
        'any.required': 'religion is a required field'
    }),

    community: joi.string().required().messages({
        'string.base': 'community should be a type of text',
        'string.empty': 'community cannot be an empty field',
        'any.required': 'community is a required field'
    }),

    livingIn: joi.string().required().messages({
        'string.base': 'livingIn should be a type of text',
        'string.empty': 'livingIn cannot be an empty field',
        'any.required': 'livingIn is a required field'
    }),

    marryInOtherCaste: joi.boolean().default(false).required().messages({
        'boolean.base': 'marryInOtherCaste should be a type of boolean',
        'any.required': 'marryInOtherCaste is a required field'
    }),

    maritalStatus: joi.string().valid('never married', 'divorced', 'widowed', 'separated').required().messages({
        'string.base': 'maritalStatus should be a type of text',
        'any.only': 'maritalStatus must be one of [never married, divorced, widowed, separated]',
        'any.required': 'maritalStatus is a required field'
    }),

    noOfChildren: joi.number().min(0).optional().messages({
        'number.base': 'noOfChildren should be a type of number',
        'number.min': 'noOfChildren cannot be negative',
        'any.required': 'noOfChildren is a required field'
    }),

    diet: joi.string().valid('vegetarian', 'non-vegetarian', 'vegan', 'eggetarian', 'other').required().messages({
        'string.base': 'diet should be a type of text',
        'any.only': 'diet must be one of [vegetarian, non-vegetarian, vegan, eggetarian, other]',
        'any.required': 'diet is a required field'
    }),

    height: joi.string().required().messages({
        'string.base': 'height should be a type of text',
        'string.empty': 'height cannot be an empty field',
        'any.required': 'height is a required field'
    }),

    weight: joi.string().required().messages({
        'string.base': 'weight should be a type of text',
        'string.empty': 'weight cannot be an empty field',
        'any.required': 'weight is a required field'
    }),

    state: joi.string().required().messages({
        'string.base': 'state should be a type of text',
        'string.empty': 'state cannot be an empty field',
        'any.required': 'state is a required field'
    }),

    city: joi.string().required().messages({
        'string.base': 'city should be a type of text',
        'string.empty': 'city cannot be an empty field',
        'any.required': 'city is a required field'
    }),

    subCommunity: joi.string().required().messages({
        'string.base': 'subCommunity should be a type of text',
        'string.empty': 'subCommunity cannot be an empty field',
        'any.required': 'subCommunity is a required field'
    }),

    disability: joi.boolean().default(false).required().messages({
        'boolean.base': 'disability should be a type of boolean',
        'any.required': 'disability is a required field'
    }),

    highestQualification: joi.string().required().messages({
        'string.base': 'highestQualification should be a type of text',
        'string.empty': 'highestQualification cannot be an empty field',
        'any.required': 'highestQualification is a required field'
    }),

    college: joi.string().required().messages({
        'string.base': 'college should be a type of text',
        'string.empty': 'college cannot be an empty field',
        'any.required': 'college is a required field'
    }),

    workWith: joi.string().required().messages({
        'string.base': 'workWith should be a type of text',
        'string.empty': 'workWith cannot be an empty field',
        'any.required': 'workWith is a required field'
    }),

    workAs: joi.string().required().messages({
        'string.base': 'workAs should be a type of text',
        'string.empty': 'workAs cannot be an empty field',
        'any.required': 'workAs is a required field'
    }),

    annualIncome: joi.string().required().messages({
        'string.base': 'annualIncome should be a type of text',
        'string.empty': 'annualIncome cannot be an empty field',
        'any.required': 'annualIncome is a required field'
    }),

    workLocation: joi.string().required().messages({
        'string.base': 'workLocation should be a type of text',
        'string.empty': 'workLocation cannot be an empty field',
        'any.required': 'workLocation is a required field'
    }),

    about: joi.string().min(10).max(1000).required().messages({
        'string.base': 'about should be a type of text',
        'string.empty': 'about cannot be an empty field',
        'string.min': 'about should have a minimum length of 10',
        'string.max': 'about should have a maximum length of 1000',
        'any.required': 'about is a required field'
    }),

    profilePicture: joi.array().items(joi.string()).max(3).messages({
        'array.base': 'profilePicture should be an array of strings',
        'array.max': 'You can upload a maximum of 3 profile pictures',
        'string.base': 'Each profile picture should be a type of text'
    }),


    documentName: joi.string().required().messages({
        'string.base': 'documentName should be a type of text',
        'string.empty': 'documentName cannot be an empty field',
        'any.required': 'documentName is a required field'
    }),
    documentNumber: joi.string().required().messages({
        'string.base': 'documentNumber should be a type of text',
        'string.empty': 'documentNumber cannot be an empty field',
        'any.required': 'documentNumber is a required field'
    }),

    fatherName: joi.string().required().messages({
        'string.base': 'fatherName should be a type of text',
        'string.empty': 'fatherName cannot be an empty field',
        'any.required': 'fatherName is a required field'
    }),
    motherName: joi.string().required().messages({
        'string.base': 'motherName should be a type of text',
        'string.empty': 'motherName cannot be an empty field',
        'any.required': 'motherName is a required field'
    }),
    noOfBrothers: joi.number().min(0).required().messages({
        'number.base': 'noOfBrothers should be a type of number',
        'number.min': 'noOfBrothers cannot be negative',
        'any.required': 'noOfBrothers is a required field'
    }),
    noOfSisters: joi.number().min(0).required().messages({
        'number.base': 'noOfSisters should be a type of number',
        'number.min': 'noOfSisters cannot be negative',
        'any.required': 'noOfSisters is a required field'
    }),
    financialStatus: joi.string().valid('lower middle class', 'middle class', 'upper middle class', 'rich', 'affluent').required().messages({
        'string.base': 'financialStatus should be a type of text',
        'string.empty': 'financialStatus cannot be an empty field',
        'any.required': 'financialStatus is a required field'
    }),
    livedWithFamily: joi.boolean().required().messages({
        'boolean.base': 'livedWithFamily should be a type of boolean',
        'any.required': 'livedWithFamily is a required field'
    }),
});