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

    let lastNumber = lastUser ? parseInt(lastUser.userId.split('-')[1]) : 1000;
    let newNumber = (lastNumber + 1) % 10000;
    if (newNumber < 1001) newNumber = 1001;

    let formattedId = `user-${String(newNumber).padStart(5, '0')}`;
    return formattedId;
};


const handleReferral=async(referralCode, newUserId)=>{
  console.error('handleReferral', referralCode, newUserId);
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
}

export { generateReferralCode, generateUniqueUserId, handleReferral  };
