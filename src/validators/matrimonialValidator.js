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

    livingIn: joi.string().optional().messages({
        'string.base': 'livingIn should be a type of text',
        'string.empty': 'livingIn cannot be an empty field',
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


export const saveHobbiesSchema = joi.object({
    hobbiesIds: joi.array().items(joi.string()).min(1).required().messages({
        'array.base': 'hobbiesIds should be an array of strings',
        'array.min': 'You must select at least one hobby',
        'any.required': 'hobbiesIds is a required field'
    })
});

export const sendInterestSchema = joi.object({
    receiverId: joi.string().required().messages({
        'string.base': 'receiverId should be a type of text',
        'string.empty': 'receiverId cannot be an empty field',  
        'any.required': 'receiverId is a required field'
    })
});

const minAdultDob = new Date();
minAdultDob.setFullYear(minAdultDob.getFullYear() - 18);


export const updateBasicDetailsSchema  = joi.object({
    name: joi.string().required().messages({
        'string.base': 'name should be a type of text',
        'string.empty': 'name cannot be an empty field',
        'any.required': 'name is a required field'
    }),
    height: joi.string().allow('').optional().messages({
        'string.base': 'height should be a type of text',
    }),
    weight: joi.string().allow('').optional().messages({
        'string.base': 'weight should be a type of text',
    }),
    dob: joi.date().less(minAdultDob).required().messages({
        'date.base': 'dob should be a valid date',
        'date.less': 'Age must be at least 18 years',
        'any.required': 'dob is a required field'
    }),
    maritalStatus: joi.string().required().valid('never married', 'divorced', 'widowed', 'separated').messages({
        'string.base': 'maritalStatus should be a type of text',
        'string.empty': 'maritalStatus cannot be an empty field',
        'any.only': 'maritalStatus must be one of [never married, divorced, widowed, separated]',
        'any.required': 'maritalStatus is a required field'
    }),
    community: joi.string().required().messages({
        'string.base': 'community should be a type of text',
        'string.empty': 'community cannot be an empty field',
    }),
    subCommunity: joi.string().required().messages({
        'string.base': 'subCommunity should be a type of text',
        'string.empty': 'subCommunity cannot be an empty field',
    }),
    gothra: joi.string().allow('').optional().messages({
        'string.base': 'gothra should be a type of text',
        'string.empty': 'gothra cannot be an empty field',
    }),
    motherTongue: joi.string().allow('').optional().messages({
        'string.base': 'motherTongue should be a type of text',
        'string.empty': 'motherTongue cannot be an empty field',
    }),
    country: joi.string().allow('').optional().messages({
        'string.base': 'country should be a type of text',
        'string.empty': 'country cannot be an empty field',
    }),
    state: joi.string().allow('').optional().messages({
        'string.base': 'state should be a type of text',
        'string.empty': 'state cannot be an empty field',
    }),
    city: joi.string().allow('').optional().messages({
        'string.base': 'city should be a type of text',
        'string.empty': 'city cannot be an empty field',
    }),
    annualIncome: joi.string().allow('').optional().messages({
        'string.base': 'annualIncome should be a type of text',
        'string.empty': 'annualIncome cannot be an empty field',
    }),
});


export const updateAboutSchema = joi.object({
    about: joi.string().min(100).max(1000).required().messages({
        'string.base': 'about should be a type of text',
        'string.empty': 'about cannot be an empty field',
        'string.min': 'about should have a minimum length of 100',
        'string.max': 'about should have a maximum length of 1000',
        'any.required': 'about is a required field'
    }),
    shortDescription: joi.string().min(10).max(100).optional().allow('').messages({
        'string.base': 'shortDescription should be a type of text',
        'string.empty': 'shortDescription cannot be an empty field',
        'string.min': 'shortDescription should have a minimum length of 10',
        'string.max': 'shortDescription should have a maximum length of 100',
    }),
    profileFor: joi.string().valid('self', 'son', 'daughter', 'brother', 'sister', 'relative', 'friend').required().messages({
        'string.base': 'profileFor should be a type of text',
        'any.only': 'profileFor must be one of [self, son, daughter, brother, sister, relative, friend]',
        'any.required': 'profileFor is a required field'
    }),
    disability: joi.string().valid('yes', 'no').messages({
        'string.base': 'disability should be a type of text',
        'any.only': 'disability must be one of [yes, no]',  
        'any.required': 'disability is a required field'
    }),
    // Make disabilityDetails required only if disability is 'yes'
    disabilityDetails: joi.when('disability', {
        is: 'yes',
        then: joi.string().min(10).max(500).required().messages({
            'string.base': 'disabilityDetails should be a type of text',
            'string.empty': 'disabilityDetails cannot be an empty field',
            'string.min': 'disabilityDetails should have a minimum length of 10',
            'string.max': 'disabilityDetails should have a maximum length of 500',
            'any.required': 'disabilityDetails is a required field'
        }),
        otherwise: joi.string().allow('').optional()
    }),
});


export const updateEducationSchema = joi.object({
    highestQualification: joi.string().required().messages({
        'string.base': 'highestQualification should be a type of text',
        'string.empty': 'highestQualification cannot be an empty field',    
        'any.required': 'highestQualification is a required field'
    }),
    college: joi.string().optional().allow('').messages({
        'string.base': 'college should be a type of text',
        'string.empty': 'college cannot be an empty field',
    }),
    ugdegree: joi.string().optional().allow('').messages({
        'string.base': 'ugdegree should be a type of text',
        'string.empty': 'ugdegree cannot be an empty field',
    }),
    educationAbout: joi.string().max(1000).optional().allow('').messages({
        'string.base': 'educationAbout should be a type of text',
        'string.empty': 'educationAbout cannot be an empty field',
        'string.max': 'educationAbout should have a maximum length of 1000',
    }),
    schoolName: joi.string().optional().allow('').messages({
        'string.base': 'schoolName should be a type of text',
        'string.empty': 'schoolName cannot be an empty field',
    })
});


export const updateCareerSchema = joi.object({
    careerAbout: joi.string().max(1000).optional().allow('').messages({
        'string.base': 'careerAbout should be a type of text',
        'string.empty': 'careerAbout cannot be an empty field', 
        'string.max': 'careerAbout should have a maximum length of 1000',
    }),
    employmentType: joi.string().valid("Private Sector", "Government Sector", "Civil Services", "Defence", "Self Employed", "Business", "Not Working Currently").required().messages({
        'string.base': 'employmentType should be a type of text',
        'string.empty': 'employmentType cannot be an empty field',
        'any.only': 'employmentType must be one of [Private Sector, Government Sector, Civil Services, Defence, Self Employed, Business, Not Working Currently]',
        'any.required': 'employmentType is a required field'
    }),
    occupation: joi.when('employmentType', {
        is: joi.valid("Private Sector", "Government Sector", "Civil Services", "Defence", "Self Employed", "Business"),
        then: joi.string().required().messages({
            'string.base': 'occupation should be a type of text',
            'string.empty': 'occupation cannot be an empty field',
            'any.required': 'occupation is a required field'
        }),
        otherwise: joi.string().allow('').optional()
    }),
    organizationName: joi.when('employmentType', {
        is: joi.valid("Private Sector", "Government Sector", "Civil Services", "Defence", "Self Employed", "Business"),
        then: joi.string().required().messages({
            'string.base': 'organization should be a type of text',
            'string.empty': 'organization cannot be an empty field',
            'any.required': 'organization is a required field'
        }),
        otherwise: joi.string().allow('').optional()
    }),
    workLocation: joi.string().optional().allow('').messages({
        'string.base': 'workLocation should be a type of text',
        'string.empty': 'workLocation cannot be an empty field',
    })
});


export const updateFamilySchema = joi.object({
    familyAbout: joi.string().max(1000).optional().allow('').messages({
        'string.base': 'familyAbout should be a type of text',
        'string.empty': 'familyAbout cannot be an empty field',
        'string.max': 'familyAbout should have a maximum length of 1000',
    }),
    familyType: joi.string().valid("Joint Family", "Nuclear Family", "Others").required().messages({
        'string.base': 'familyType should be a type of text',
        'string.empty': 'familyType cannot be an empty field',
        'any.only': 'familyType must be one of [Joint Family, Nuclear Family, Others]',
        'any.required': 'familyType is a required field'
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
    marriedBrothers: joi.number().min(0).required().messages({
        'number.base': 'marriedBrothers should be a type of number',
        'number.min': 'marriedBrothers cannot be negative',
        'any.required': 'marriedBrothers is a required field'
    }),
    marriedSisters: joi.number().min(0).required().messages({
        'number.base': 'marriedSisters should be a type of number',
        'number.min': 'marriedSisters cannot be negative',
        'any.required': 'marriedSisters is a required field'
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
    fatherOccupation: joi.string().valid('Business/Entrepreneur', 'Serivice-Private', 'Service-Govt/PSU', 'Armed Forces', 'Civil Services', 'Teacher', 'Retired', 'Not Employed', 'Expired').required().messages({
        'string.base': 'fatherOccupation should be a type of text',
        'string.empty': 'fatherOccupation cannot be an empty field',
        'any.only': 'fatherOccupation must be one of [Business/Entrepreneur, Serivice-Private, Service-Govt/PSU, Armed Forces, Civil Services, Teacher, Retired, Not Employed, Expired]',
        'any.required': 'fatherOccupation is a required field'
    }),
    motherOccupation: joi.string().valid('Housewife', 'Business/Entrepreneur', 'Serivice-Private', 'Service-Govt/PSU', 'Armed Forces', 'Civil Services', 'Teacher', 'Retired', 'Not Employed', 'Expired').required().messages({
        'string.base': 'motherOccupation should be a type of text',
        'string.empty': 'motherOccupation cannot be an empty field',
        'any.only': 'motherOccupation must be one of [Housewife, Business/Entrepreneur, Serivice-Private, Service-Govt/PSU, Armed Forces, Civil Services, Teacher, Retired, Not Employed, Expired]',
        'any.required': 'motherOccupation is a required field'
    }),

    familyIncome: joi.string().optional().allow('').messages({
        'string.base': 'familyIncome should be a type of text',
        'string.empty': 'familyIncome cannot be an empty field',
    }),
    familyValues: joi.string().valid('Orthodox', 'Conservative', 'Moderate', 'Liberal').required().messages({
        'string.base': 'familyValues should be a type of text',
        'string.empty': 'familyValues cannot be an empty field',
        'any.only': 'familyValues must be one of [Orthodox, Conservative, Moderate, Liberal]',
        'any.required': 'familyValues is a required field'
    }),
    LivingWithParents: joi.string().valid('Yes', 'No').required().messages({
        'string.base': 'LivingWithParents should be a type of text',
        'string.empty': 'LivingWithParents cannot be an empty field',
        'any.only': 'LivingWithParents must be one of [Yes, No]',
        'any.required': 'LivingWithParents is a required field'
    }),
    familyLocation: joi.string().optional().allow('').messages({
        'string.base': 'familyLocation should be a type of text',
        'string.empty': 'familyLocation cannot be an empty field',
    })
});


export const updateHoroscopeSchema = joi.object({
    "birthTime": joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
        'string.base': 'birthTime should be a type of text',
        'string.empty': 'birthTime cannot be an empty field',
        'string.pattern.base': 'birthTime must be in HH:MM 24-hour format',
        'any.required': 'birthTime is a required field'
    }),
    "birthPlace": joi.string().required().messages({
        'string.base': 'birthPlace should be a type of text',
        'string.empty': 'birthPlace cannot be an empty field',
        'any.required': 'birthPlace is a required field'
    }),
    "manglik": joi.string().valid('Manglik', 'Non-Manglik', 'Dont know').required().messages({
        'string.base': 'manglik should be a type of text',
        'string.empty': 'manglik cannot be an empty field',
        'any.only': 'manglik must be one of [Manglik, Non-Manglik, Dont know]',
        'any.required': 'manglik is a required field'
    }),
    // "rashi": joi.string().required().messages({
    //     'string.base': 'rashi should be a type of text',
    //     'string.empty': 'rashi cannot be an empty field',
    //     'any.required': 'rashi is a required field'
    // }),
    // "nakshatra": joi.string().required().messages({
    //     'string.base': 'nakshatra should be a type of text',
    //     'string.empty': 'nakshatra cannot be an empty field',
    //     'any.required': 'nakshatra is a required field'
    // })
});

export const updateLifeStyleSchema = joi.object({
    /**
     * {
    "diet":"", //'vegetarian', 'non-vegetarian', 'vegan', 'eggetarian', 'other'
    "smoke":"", //"yes", "no", "occasionally",
    "drink":"", //"yes", "no", "occasionally",
    "openToPets": "",//"yes", "no"
    "OwnHouse": "",//"yes", "no",
    "OwnCar": "",//"yes", "no",
    "FoodCooked": "",
    "hobbies": "",
    "favoriteMusic":"",
    "favoritebooks": "",
    "dressStyle":"",
    "sports": "",
    "cuisine":"",
    "movies": "",
    "tvShows": "",
    "vacationDestination": ""
}
    */
    diet: joi.string().valid('vegetarian', 'non-vegetarian', 'vegan', 'eggetarian', 'other').required().messages({
        'string.base': 'diet should be a type of text',
        'any.only': 'diet must be one of [vegetarian, non-vegetarian, vegan, eggetarian, other]',
        'any.required': 'diet is a required field'
    }),
    smoke: joi.string().valid('yes', 'no', 'occasionally').optional().allow('').messages({
        'string.base': 'smoke should be a type of text',
        'any.only': 'smoke must be one of [yes, no, occasionally]',
    }),
    drink: joi.string().valid('yes', 'no', 'occasionally').optional().allow('').messages({
        'string.base': 'drink should be a type of text',
        'any.only': 'drink must be one of [yes, no, occasionally]',
    }),
    openToPets: joi.string().valid('yes', 'no').optional().allow('').messages({
        'string.base': 'openToPets should be a type of text',
        'any.only': 'openToPets must be one of [yes, no]',
    }),
    OwnHouse: joi.string().valid('yes', 'no').optional().allow('').messages({
        'string.base': 'OwnHouse should be a type of text',
        'any.only': 'OwnHouse must be one of [yes, no]',
    }),
    OwnCar: joi.string().valid('yes', 'no').optional().allow('').messages({
        'string.base': 'OwnCar should be a type of text',
        'any.only': 'OwnCar must be one of [yes, no]',
    }),
    FoodCooked: joi.string().max(100).optional().allow('').messages({
        'string.base': 'FoodCooked should be a type of text',
        'string.empty': 'FoodCooked cannot be an empty field',
        'string.max': 'FoodCooked should have a maximum length of 100',
    }),
    hobbies: joi.string().max(500).optional().allow('').messages({
        'string.base': 'hobbies should be a type of text',
        'string.empty': 'hobbies cannot be an empty field',
        'string.max': 'hobbies should have a maximum length of 500',
    }),
    favoriteMusic: joi.string().max(100).optional().allow('').messages({
        'string.base': 'favoriteMusic should be a type of text',
        'string.empty': 'favoriteMusic cannot be an empty field',
        'string.max': 'favoriteMusic should have a maximum length of 100',
    }),
    favoritebooks: joi.string().max(100).optional().allow('').messages({
        'string.base': 'favoritebooks should be a type of text',
        'string.empty': 'favoritebooks cannot be an empty field',
        'string.max': 'favoritebooks should have a maximum length of 100',
    }),
    dressStyle: joi.string().max(100).optional().allow('').messages({
        'string.base': 'dressStyle should be a type of text',
        'string.empty': 'dressStyle cannot be an empty field',
        'string.max': 'dressStyle should have a maximum length of 100',
    }),
    sports: joi.string().max(100).optional().allow('').messages({
        'string.base': 'sports should be a type of text',
        'string.empty': 'sports cannot be an empty field',
        'string.max': 'sports should have a maximum length of 100',
    }),
    cuisine: joi.string().max(100).optional().allow('').messages({
        'string.base': 'cuisine should be a type of text',
        'string.empty': 'cuisine cannot be an empty field',
        'string.max': 'cuisine should have a maximum length of 100',
    }),
    movies: joi.string().max(100).optional().allow('').messages({   
        'string.base': 'movies should be a type of text',
        'string.empty': 'movies cannot be an empty field',
        'string.max': 'movies should have a maximum length of 100',
    }),
    tvShows: joi.string().max(100).optional().allow('').messages({
        'string.base': 'tvShows should be a type of text',
        'string.empty': 'tvShows cannot be an empty field',
        'string.max': 'tvShows should have a maximum length of 100',
    }),
    vacationDestination: joi.string().max(100).optional().allow('').messages({
        'string.base': 'vacationDestination should be a type of text',
        'string.empty': 'vacationDestination cannot be an empty field',
        'string.max': 'vacationDestination should have a maximum length of 100',
    })
});

export const desiredPartnersSchema = joi.object({
    ageFrom: joi.number().min(18).max(99).required().messages({
        'number.base': 'ageFrom should be a type of number',
        'number.min': 'ageFrom should be at least 18',
        'number.max': 'ageFrom should be at most 99',
        'any.required': 'ageFrom is a required field'
    }),
    ageTo: joi.number().min(joi.ref('ageFrom')).max(99).required().messages({
        'number.base': 'ageTo should be a type of number',
        'number.min': 'ageTo should be greater than or equal to ageFrom',
        'number.max': 'ageTo should be at most 99',
        'any.required': 'ageTo is a required field'
    }),
    heightFrom: joi.string().required().messages({
        'string.base': 'heightFrom should be a type of text',
        'string.empty': 'heightFrom cannot be an empty field',
        'any.required': 'heightFrom is a required field'
    }),
    heightTo: joi.string().required().messages({
        'string.base': 'heightTo should be a type of text',
        'string.empty': 'heightTo cannot be an empty field',
        'any.required': 'heightTo is a required field'
    }),
    maritalStatus: joi.array().items(joi.string().valid('never married', 'divorced', 'widowed', 'separated')).min(1).required().messages({
        'array.base': 'maritalStatus should be an array of strings',
        'array.min': 'You must select at least one marital status',
        'any.required': 'maritalStatus is a required field'
    }),
    // religion: joi.string().valid('hindu', 'muslim', 'christian', 'sikh', 'jain', 'buddhist', 'parsi', 'others').required().messages({
    //     'string.base': 'religion should be a type of text',
    //     'string.empty': 'religion cannot be an empty field',
    //     'any.only': 'religion must be one of hindu, muslim, christian, sikh, jain, buddhist, parsi, others',
    //     'any.required': 'religion is a required field'
    // }),
    religion: joi.array().items(joi.string().valid('hindu', 'muslim', 'christian', 'sikh', 'jain', 'buddhist', 'parsi', 'others')).min(1).required().messages({
        'array.base': 'religion should be an array of strings',
        'array.min': 'You must select at least one religion',
        'any.only': 'religion must be one of hindu, muslim, christian, sikh, jain, buddhist, parsi, others',
        'any.required': 'religion is a required field'
    }),
    community: joi.array().items(joi.string()).min(1).messages({
        'array.base': 'community should be an array of strings',
        'array.min': 'You must select at least one community'
    }),
    motherTongue: joi.string().optional().allow('').messages({
        'string.base': 'motherTongue should be a type of text',
        'string.empty': 'motherTongue cannot be an empty field',
    }),
    country: joi.string().optional().allow('').messages({
        'string.base': 'country should be a type of text',
        'string.empty': 'country cannot be an empty field',
    }),
    state: joi.string().optional().allow('').messages({
        'string.base': 'state should be a type of text',
        'string.empty': 'state cannot be an empty field',
    }),
    city: joi.string().optional().allow('').messages({
        'string.base': 'city should be a type of text',
        'string.empty': 'city cannot be an empty field',
    }),
    education: joi.string().optional().allow('').messages({
        'string.base': 'education should be a type of text',
        'string.empty': 'education cannot be an empty field',
    }),
    occupation: joi.string().optional().allow('').messages({
        'string.base': 'occupation should be a type of text',
        'string.empty': 'occupation cannot be an empty field',
    }),
    annualIncomeMin: joi.number().min(0).required().messages({
        'number.base': 'annualIncomeMin should be a type of number',
        'number.empty': 'annualIncomeMin cannot be an empty field',
        'any.required': 'annualIncomeMin is a required field'
    }),
    annualIncomeMax: joi.number().min(joi.ref('annualIncomeMin')).required().messages({
        'number.base': 'annualIncomeMax should be a type of number',
        'number.empty': 'annualIncomeMax cannot be an empty field',
        'any.required': 'annualIncomeMax is a required field'
    }),
    diet: joi.string().valid('vegetarian', 'non-vegetarian', 'vegan', 'eggetarian', 'other').optional().allow('').messages({
        'string.base': 'diet should be a type of text',
        'any.only': 'diet must be one of [vegetarian, non-vegetarian, vegan, eggetarian, other]',
    }),
    smoke: joi.string().valid('yes', 'no', 'occasionally').optional().allow('').messages({
        'string.base': 'smoke should be a type of text',
        'any.only': 'smoke must be one of [yes, no, occasionally]',
    }),
    drink: joi.string().valid('yes', 'no', 'occasionally').optional().allow('').messages({
        'string.base': 'drink should be a type of text',
        'any.only': 'drink must be one of [yes, no, occasionally]',
    }),
    manglik: joi.string().valid('Manglik', 'Non-Manglik', 'Dont know').optional().allow('').messages({
        'string.base': 'manglik should be a type of text',
        'any.only': 'manglik must be one of [Manglik, Non-Manglik, Dont know]',
    }),
});


export const partnerBasicDetailsSchema = joi.object({
    ageFrom: joi.number().min(18).max(99).required().messages({
        'number.base': 'ageFrom should be a type of number',
        'number.min': 'ageFrom should be at least 18',
        'number.max': 'ageFrom should be at most 99',
        'any.required': 'ageFrom is a required field'
    }),
    ageTo: joi.number().min(joi.ref('ageFrom')).max(99).required().messages({
        'number.base': 'ageTo should be a type of number',
        'number.min': 'ageTo should be greater than or equal to ageFrom',
        'number.max': 'ageTo should be at most 99',
        'any.required': 'ageTo is a required field'
    }),
    heightFrom: joi.string().required().messages({
        'string.base': 'heightFrom should be a type of text',
        'string.empty': 'heightFrom cannot be an empty field',
        'any.required': 'heightFrom is a required field'
    }),
    heightTo: joi.string().required().messages({
        'string.base': 'heightTo should be a type of text',
        'string.empty': 'heightTo cannot be an empty field',
        'any.required': 'heightTo is a required field'
    }),
    maritalStatus: joi.array().items(joi.string().valid('never married', 'divorced', 'widowed', 'separated')).min(1).required().messages({
        'array.base': 'maritalStatus should be an array of strings',
    }),
    noOfChildren: joi.number().min(0).when('maritalStatus', {
        is: joi.array().items(joi.string().valid('divorced', 'widowed', 'separated')).min(1),
        then: joi.number().min(0).required(),
        otherwise: joi.number().min(0).optional()
    }).messages({
        'number.base': 'noOfChildren should be a type of number',
        'number.min': 'noOfChildren cannot be negative',
        'any.required': 'noOfChildren is a required field when maritalStatus includes divorced, widowed, or separated'
    }),
    country: joi.array().items(joi.string()).min(1).messages({
        'array.base': 'country should be an array of strings',
        'array.min': 'You must select at least one country'
    }),
    state: joi.array().items(joi.string()).min(1).messages({
        'array.base': 'state should be an array of strings',
        'array.min': 'You must select at least one state'
    }),
    city: joi.array().items(joi.string()).min(1).messages({
        'array.base': 'city should be an array of strings',
        'array.min': 'You must select at least one city'
    })
});