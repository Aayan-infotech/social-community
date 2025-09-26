import mongoose from "mongoose";

const matrimonialProfileSchema = new mongoose.Schema(
    {
        createdBy: {
            type: String,
            ref: "User",
            required: true,
        },
        profileFor: {
            type: String,
            enum: ["self", "son", "daughter", "brother", "sister", "relative", "friend"],
            required: true,
        },
        relationToUser: {
            type: String,
        },
        gender: { type: String, enum: ["male", "female", "other"], required: true },
        name: { type: String, required: true },
        age: { type: Number },
        dob: { type: Date },
        mobileNo: { type: String, unique: true },
        email: { type: String, unique: true },
        religion: { type: String, enum: ['hindu', 'muslim', 'christian', 'sikh', 'jain', 'buddhist', 'parsi', 'others'] },
        community: { type: String },
        subCommunity: { type: String },
        gothra: { type: String },
        marryInOtherCaste: { type: Boolean, default: false },
        maritalStatus: {
            type: String,
            enum: ["never married", "divorced", "widowed", "separated"],
        },
        noOfChildren: { type: Number, default: 0 },
        motherTongue: { type: String },
        height: { type: String },
        weight: { type: String },
        livingIn: { type: String },
        state: { type: String },
        city: { type: String },
        annualIncome: { type: String },
        profilePicture: [{ type: String }],

        // About 
        about: { type: String },
        shortDescription: { type: String },
        disability: { type: String },
        disabilityDetails: { type: String },

        // verification

        isVerified: { type: Boolean, default: false },
        identityProof: { type: String },
        documentNumber: { type: String },
        documentName: { type: String },


        educationAbout: { type: String },
        highestQualification: { type: String },
        college: { type: String },
        ugdegree: { type: String },
        schoolName: { type: String },


        // Career
        careerAbout: { type: String },
        employmentType: {
            type: String,
            enum: ["Private Sector", "Government Sector", "Civil Services", "Defence", "Self Employed", "Business", "Not Working Currently"],
        },
        workWith: { type: String },
        workAs: { type: String },
        workLocation: { type: String },


        // Family Details
        familyDetails: {
            about: { type: String },
            familyType: { type: String, enum: ["Joint Family", "Nuclear Family", "Others"] },
            fatherName: { type: String },
            motherName: { type: String },
            noOfBrothers: { type: Number, default: 0 },
            noOfSisters: { type: Number, default: 0 },
            marriedBrothers: { type: Number },
            marriedSisters: { type: Number },
            financialStatus: { type: String, enum: ["lower middle class", "middle class", "upper middle class", "rich", "affluent"] },
            livedWithFamily: { type: Boolean, default: true },
            fatherOccupation: { type: String , enum:["Business/Entrepreneur", "Service-Private", "Service-Govt/PSU", "Armed Forces", "Civil Services", "Teacher", "Retired", "Not Employed", "Expired"] },
            motherOccupation: { type: String , enum:["Housewife","Business/Entrepreneur", "Service-Private", "Service-Govt/PSU", "Armed Forces", "Civil Services", "Teacher", "Retired", "Not Employed", "Expired"] },
            familyIncome: { type: String },
            familyValues: {
                type: String,
                enum: ["Orthodox", "Conservative", "Moderate", "Liberal"],
            },
            LivingWithParents: {
                type: String,
                enum: ["Yes", "No"],
            },
            familyLocation: { type: String },
        },


        horoscopeDetails: {
            birthTime: { type: String },
            birthPlace: { type: String },
            rashi: { type: String },
            nakshatra: { type: String },
            manglik: { type: String, enum: ["Manglik", "Non-Manglik", "Don't Know"] },
        },

        lifestyle: {
            diet: { type: String,enum: ['vegetarian', 'non-vegetarian', 'vegan', 'eggetarian', 'other'] },
            smoke: { type: String, enum: ["yes", "no", "occasionally"] },
            drink: { type: String, enum: ["yes", "no", "occasionally"] },
            openToPets: { type: String, enum: ["yes", "no"] },
            OwnHouse: { type: String, enum: ["yes", "no"] },
            OwnCar: { type: String, enum: ["yes", "no"] },
            FoodCooked: { type: String },
            hobbies: { type: String },
            favoriteMusic: { type: String },
            favoritebooks: { type: String },
            dressStyle: { type: String },
            sports: { type: String },
            cuisine: { type: String },
            movies: { type: String },
            tvShows: { type: String },
            vacationDestination: { type: String },
        },
    },
    { timestamps: true, versionKey: false }
);

export default mongoose.model("MatrimonialProfile", matrimonialProfileSchema);
