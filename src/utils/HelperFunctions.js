// Import required modules
import { nanoid } from "nanoid";
import { User } from "../models/user.model.js";
import { ApiError } from "./ApiError.js";

const generateReferralCode = async function (name) {
  if (!name) {
    throw new Error("Name is required to generate referral code");
  }

  let referralCode;
  let exists = true;
  const firstName = name.split(" ")[0].toLowerCase();

  while (exists) {
    referralCode = firstName + nanoid(5);
    exists = await User.exists({ referralCode });
  }

  return referralCode;
};

const generateUniqueUserId = async () => {
  let lastUser = await User.findOne({}, { userId: 1 }).sort({ createdAt: -1 });

  let lastNumber = lastUser ? parseInt(lastUser.userId.split("-")[1]) : 1000;
  let newNumber = (lastNumber + 1) % 10000;
  if (newNumber < 1001) newNumber = 1001;

  let formattedId = `user-${String(newNumber).padStart(5, "0")}`;
  return formattedId;
};

const handleReferral = async (referralCode, newUserId) => {
  console.error("handleReferral", referralCode, newUserId);
  const referrer = await User.findOne({ referralCode });
  console.error(referrer);
  if (!referrer) {
    throw new ApiError(400, "Invalid referral code");
  }

  await User.updateOne(
    { userId: referrer.userId },
    { $push: { referrals: newUserId } }
  );

  return referrer.userId;
};

function getRelatedRelation(baseRelation, gender) {
  const relationMap = {
    father: { male: "son", female: "daughter" },
    mother: { male: "son", female: "daughter" },
    son: { male: "father", female: "mother" },
    daughter: { male: "father", female: "mother" },
    grandfather: { male: "grandson", female: "granddaughter" },
    grandmother: { male: "grandson", female: "granddaughter" },
    grandson: { male: "grandfather", female: "grandmother" },
    granddaughter: { male: "grandfather", female: "grandmother" },
    uncle: { male: "nephew", female: "niece" },
    aunt: { male: "nephew", female: "niece" },
    nephew: { male: "uncle", female: "aunt" },
    niece: { male: "uncle", female: "aunt" },
    brother: { male: "brother", female: "sister" },
    sister: { male: "brother", female: "sister" },
    husband: { male: "wife", female: "wife" },
    wife: { male: "husband", female: "husband" },
    cousin_brother: { male: "cousin_brother", female: "cousin_sister" },
    cousin_sister: { male: "cousin_brother", female: "cousin_sister" },
    great_grandfather: {
      male: "great_grandson",
      female: "great_granddaughter",
    },
    great_grandmother: {
      male: "great_grandson",
      female: "great_granddaughter",
    },
    great_great_grandfather: {
      male: "great_great_grandson",
      female: "great_great_granddaughter",
    },
    great_great_grandmother: {
      male: "great_great_grandson",
      female: "great_great_granddaughter",
    },
    great_uncle: { male: "grandnephew", female: "grandniece" },
    great_aunt: { male: "grandnephew", female: "grandniece" },
  };

  const relation = relationMap[baseRelation.toLowerCase()];
  if (!relation) {
    return "Unknown relation";
  }

  return relation[gender.toLowerCase()] || "Unknown gender";
}

const getHierarchyLevel = (relation) => {
  const hierarchy = {
    "great great grandfather": 1,
    "great great grandmother": 1,
    "great grandfather": 2,
    "great grandmother": 2,
    grandfather: 3,
    grandmother: 3,
    "great uncle": 4,
    "great aunt": 4,
    father: 5,
    mother: 5,
    uncle: 6,
    aunt: 6,
    self: 7,
    husband: 7,
    wife: 7,
    brother: 8,
    sister: 8,
    "cousin brother": 9,
    "cousin sister": 9,
    son: 10,
    daughter: 10,
    nephew: 11,
    niece: 11,
    grandson: 12,
    granddaughter: 12,
    "great grandson": 13,
    "great granddaughter": 13,
  };

  return hierarchy[relation] || null;
};

export {
  generateReferralCode,
  generateUniqueUserId,
  handleReferral,
  getRelatedRelation,
  getHierarchyLevel,
};
