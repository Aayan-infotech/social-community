import mongoose from "mongoose";

const familyMemberRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    relationship: {
      type: String,
      enum: [
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
        "great granddaughter",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    jobRole: {
      type: String,
      required: false,
    },
    company: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const FamilyMemberRequest = mongoose.model(
  "FamilyMemberRequest",
  familyMemberRequestSchema
);
export default FamilyMemberRequest;
