import mongoose from "mongoose";

const familyMemberSchema = new mongoose.Schema(
  {
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
        "self",
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
    userId: {
      type: String,
      ref: "User",
      required: true,
    },
    relationWithUserId: {
      type: String,
      ref: "User",
      required: true,
    },
    hierarchyLevel: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const FamilyMember = mongoose.model("FamilyMember", familyMemberSchema);

export default FamilyMember;
