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
        mobileNo: { type: String , unique:true},
        email: { type: String, unique:true },
        religion: { type: String, enum: ['hindu', 'muslim', 'christian', 'sikh', 'jain', 'buddhist', 'parsi', 'others'] },
        community: { type: String },
        livingIn: { type: String },
        state: { type: String },
        city: { type: String },
        marryInOtherCaste: { type: Boolean, default: false },
        maritalStatus: {
            type: String,
            enum: ["never married", "divorced", "widowed", "separated"],
        },
        noOfChildren: { type: Number, default: 0 },
        diet: { type: String, enum: ['vegetarian', 'non-vegetarian', 'vegan', 'eggetarian', 'other'] },
        height: { type: String },
        weight: { type: String },
        subCommunity: { type: String },
        disability: { type: String },
        highestQualification: { type: String },
        college: { type: String },
        workWith: { type: String },
        workAs: { type: String },
        annualIncome: { type: String },
        workLocation: { type: String },
        about: { type: String },
        profilePicture: [{ type: String }],
        isVerified: { type: Boolean, default: false },
        identityProof: { type: String },
        documentNumber: { type: String },
        documentName: { type: String },
        familyDetails: {
            fatherName: { type: String },
            motherName: { type: String },
            noOfBrothers: { type: Number, default: 0 },
            noOfSisters: { type: Number, default: 0 },
            financialStatus: { type: String, enum: ["lower middle class","middle class", "upper middle class", "rich", "affluent"] },
            livedWithFamily: { type: Boolean, default: true },
        },
    },
    { timestamps: true, versionKey: false }
);

export default mongoose.model("MatrimonialProfile", matrimonialProfileSchema);
