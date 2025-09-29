import mongoose from "mongoose";
import Community from "./community.model.js";

const desiredPartnerSchema = new mongoose.Schema(
  {
    createdBy: {
      type: String,
      ref: "User",
      required: true,
    },
    profileId: {
      type: String,
      ref: "MatrimonialProfile",
      required: true,
    },
    ageFrom: { type: Number, default: 18 },
    ageTo: { type: Number, default: 99 },
    heightFrom: { type: String, default: "120 cm" },
    heightTo: { type: String, default: "200 cm" },
    religion: [
      {
        type: String,
        enum: [
          "hindu",
          "muslim",
          "christian",
          "sikh",
          "jain",
          "buddhist",
          "parsi",
          "others",
        ],
      },
    ],
    community: [{ type: String }],
    subCommunity: [{ type: String }],
    maritalStatus: [
      {
        type: String,
        enum: ["never married", "divorced", "widowed", "separated"],
      },
    ],
    motherTongue: [{ type: String }],
    countryLivingIn: [{ type: String }],
    stateLivingIn: [{ type: String }],
    cityLivingIn: [{ type: String }],
    education: [{ type: String }],
    occupation: [{ type: String }],
    annualIncome: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 1000000000 },
    },
    diet: [
      {
        type: String,
        enum: ["vegetarian", "non-vegetarian", "vegan", "eggetarian", "other"],
      },
    ],
    smoking: [{ type: String, enum: ["yes", "no", "occasionally"] }],
    drinking: [{ type: String, enum: ["yes", "no", "occasionally"] }],
    aboutPartner: { type: String },
  },
  { timestamps: true, versionKey: false }
);

export const DesiredPartner = mongoose.model(
  "DesiredPartner",
  desiredPartnerSchema
);
