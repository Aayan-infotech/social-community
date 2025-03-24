import { asyncHanlder } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { uploadImage } from "../utils/awsS3Utils.js";

const getUserProfile = asyncHanlder(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.json(new ApiResponse(200, "User profile fetched successfully", user));
});

const updateUserProfile = asyncHanlder(async (req, res) => {
  const { name, email, mobile, state, city, gender, bio } = req.body;

  let profile_image = null;
  if (req.files && req.files.profile_image) {
    profile_image = await uploadImage(req.files.profile_image[0]);
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        name,
        email,
        mobile,
        state,
        city,
        gender,
        bio,
        profile_image,
      },
    },
    { new: true }
  ).select(
    "-password -refreshToken -_id -__v -referrals -referredBy -otpExpire -otp"
  );

  res.json(new ApiResponse(200, "User profile updated successfully", user));
});

export { getUserProfile, updateUserProfile };
