import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import {
  generateReferralCode,
  handleReferral,
  generateUniqueUserId,
  getHierarchyLevel,
} from "../utils/HelperFunctions.js";
import { generateOTP, sendOTP } from "../services/smsService.js";
import { sendEmail } from "../services/emailService.js";
import { DeleteAccountRequestModel } from "../models/delete_account_request.model.js";
import FamilyMember from "../models/familyMember.model.js";
import fs from "fs";
import { createCustomer } from "../services/stripeService.js";

// const generateAccessAndRefreshTokens = async (userId) => {
//   try {
//     const user = await User.findById(userId);
//     const accessToken = user.generateAccessToken();
//     const refreshToken = user.generateRefreshToken();
//     user.refreshToken = refreshToken;
//     await user.save({ validateBeforeSave: false });
//     return { accessToken, refreshToken };
//   } catch (error) {
//     throw new ApiError(
//       500,
//       "Something went wrong while generating refresh and access token"
//     );
//   }
// };

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    let refreshToken = user.refreshToken;
    try {
      jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
      refreshToken = user.generateRefreshToken();
      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });
    }

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const options = {
  httpOnly: true,
  secure: true,
};

const signup = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    mobile,
    country,
    state,
    city,
    gender,
    password,
    referralBy,
  } = req.body;

  let userEmail = email.toLowerCase();
  const existingUser = await User.findOne({
    $or: [{ email: userEmail }, { mobile }],
  });

  if (existingUser) {
    if (existingUser.email === userEmail && existingUser.mobile === mobile) {
      throw new ApiError(400, "Email and Mobile number is already registered");
    } else if (existingUser.email === userEmail) {
      throw new ApiError(
        400,
        "Email is already registered. Please use a different email"
      );
    } else if (existingUser.mobile === mobile) {
      throw new ApiError(
        400,
        "Mobile number is already registered. Please use a different mobile number"
      );
    }
  }

  const userId = await generateUniqueUserId();
  const referralCode = await generateReferralCode(name);
  const otp = generateOTP();

  let referredByUser = null;
  if (referralBy) {
    try {
      referredByUser = await handleReferral(referralBy, userId);
    } catch (error) {
      throw new ApiError(400, error.message);
    }
  }

  //   mobile OTP send code
  //   const send = await sendOTP(mobile, otp);

  const html = fs.readFileSync("./src/emails/otpTemplate.html", "utf-8");
  const subject = "OTP Verification";
  const otpHTML = new RegExp(`{{OTP}}`, "g");
  const updatedHtml = html.replace(otpHTML, otp);

  const namehtml = new RegExp(`{{name}}`, "g");
  const updatedHtml1 = updatedHtml.replace(namehtml, name);

  const year = new RegExp(`{{year}}`, "g");
  const updatedHtml2 = updatedHtml1.replace(year, new Date().getFullYear());

  const send = await sendEmail(userEmail, subject, updatedHtml2);
  
  if (!send.success) {
    // throw new ApiError(500, "Failed to send OTP to mobile number");
    throw new ApiError(500, "Failed to send OTP to Email");
  }



  // Add customer to stripe 
  const stripeCustomer = await createCustomer(userEmail, name);

  if (!stripeCustomer) {
    throw new ApiError(500, "Failed to create customer in Stripe");
  }

  const stripeCustomerId = stripeCustomer.id;



  const user = new User({
    userId,
    name,
    email: userEmail,
    mobile,
    country,
    state,
    city,
    gender,
    referralCode: referralCode,
    stripeCustomerId,
    password,
    referrals: [],
    otp,
    otpExpire: new Date(Date.now() + 10 * 60 * 1000),
  });

  if (referredByUser) {
    user.referredBy = referredByUser;
  }

  await user.save();

  // Create the family tree for the user of the

  const hierarchyLevel1 = getHierarchyLevel("self");
  const addFamilyMember = await FamilyMember.create({
    userId: userId,
    relationship: "self",
    relationWithUserId: userId,
    hierarchyLevel: hierarchyLevel1,
  });

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // check if user is created
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "User registered successfully, Please Check Email to Verify you mail...!!!",
        { user: createdUser, accessToken, refreshToken }
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, mobile, password } = req.body;
  let userEmail = email.toLowerCase();

  if (!email) {
    throw new ApiError(400, "Email Is Required Field..!!");
  }
  if (!password) {
    throw new ApiError(400, "Password Is Required Field..!!");
  }
  let user = await User.findOne({
    $or: [{ email: userEmail }, { mobile }],
  });

  if (!user) {
    throw new ApiError(404, "User Doesn't Exist Or Invalid Email Or Mobile No");
  }

  // check if the User is DeleteaccountRequest is in pending or approved status
  let deleteAccountRequest = await DeleteAccountRequestModel.findOne({
    userId: user.userId,
    status: { $in: ["pending", "approved"] },
  });
  if (deleteAccountRequest) {
    throw new ApiError(
      400,
      "Your account is suspended. Please contact support for more information."
    );
  }

  // check if the user is verified
  if (!user.isEmailVerified && !user.isMobileVerified) {
    throw new ApiError(400, "Email and Mobile number is not verified");
  }

  const isValidPassord = await user.isPasswordCorrect(password);

  if (!isValidPassord) {
    throw new ApiError(401, "Invalid Password");
  }

  // Send Access & Refresh Token
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -previous_passwords"
  );

  // cookies
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "User Logged in Successfully", {
        user: loggedInUser,
        accessToken,
        refreshToken,
      })
    );
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

  const user = await User.findOne({ email: decoded.email });

  if (!user) {
    throw new ApiError(400, "Invalid or expired token");
  }

  user.isVerified = true;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Email verified successfully", user));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  let user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User Doesn't Exist Or Invalid Email");
  }

  const otp = generateOTP();
  user.otp = otp;
  user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  //   mobile OTP send code
  //   const send = await sendOTP(mobile, otp);

  const html = fs.readFileSync("./src/emails/otpTemplate.html", "utf-8");
  const subject = "OTP Verification";
  const otpHTML = new RegExp(`{{OTP}}`, "g");
  const updatedHtml = html.replace(otpHTML, otp);

  const namehtml = new RegExp(`{{name}}`, "g");
  const updatedHtml1 = updatedHtml.replace(namehtml, user.name);

  const year = new RegExp(`{{year}}`, "g");
  const updatedHtml2 = updatedHtml1.replace(year, new Date().getFullYear());

  const send = await sendEmail(user.email, subject, updatedHtml2);
  if (!send.success) {
    // throw new ApiError(500, "Failed to send OTP to mobile number");
    throw new ApiError(500, "Failed to send OTP to Email");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "OTP has been send to your mobile and email"));
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password, confirm_password } = req.body;

  if (password !== confirm_password) {
    throw new ApiError(400, "Passwords do not match");
  }

  const user = req.user;

  user.password = password;
  user.resetToken = null;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Password reset successful", user));
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const user = await User.findOne({ email: email });

  if (!user) {
    throw new ApiError(404, "User Not Found");
  }

  if (user.otp != otp) {
    throw new ApiError(400, "Invalid OTP");
  }
  //  check if otp is expired

  if (new Date() > user.otpExpire) {
    throw new ApiError(400, "OTP Expired");
  }

  user.otp = null;
  user.otpExpire = null;
  user.isEmailVerified = true;
  user.isMobileVerified = true;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "OTP verified successfully", user));
});

const resendOTP = asyncHandler(async (req, res) => {
  const { emailOrMobile } = req.body;
  if (!emailOrMobile) {
    throw new ApiError(400, "Email/Mobile No is required");
  }
  let user = await await User.findOne({
    $or: [{ email: emailOrMobile }, { mobile: emailOrMobile }],
  });

  if (!user) {
    throw new ApiError(404, "User Doesn't Exist Or Invalid Email");
  }

  const otp = generateOTP();
  user.otp = otp;
  user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  const html = fs.readFileSync("./src/emails/otpTemplate.html", "utf-8");
  const subject = "OTP Verification";
  const otpHTML = new RegExp(`{{OTP}}`, "g");
  const updatedHtml = html.replace(otpHTML, otp);

  const namehtml = new RegExp(`{{name}}`, "g");
  const updatedHtml1 = updatedHtml.replace(namehtml, user.name);

  const year = new RegExp(`{{year}}`, "g");
  const updatedHtml2 = updatedHtml1.replace(year, new Date().getFullYear());

  const send = await sendEmail(user.email, subject, updatedHtml2);

  if (!send.success) {
    throw new ApiError(500, "Failed to send OTP to Email");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "OTP has been send to your mobile and email"));
});

const setPassword = asyncHandler(async (req, res) => {
  const { email, password, confirm_password } = req.body;
  if (!email || !password || !confirm_password) {
    throw new ApiError(
      400,
      "Email, Password and Confirm Password are required"
    );
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User Not Found");
  }

  if (password !== confirm_password) {
    throw new ApiError(400, "Password and confirm Password Are Not Match");
  }

  const isPreviousPassword = await user.isPreviousPassword(password);
  if (isPreviousPassword) {
    throw new ApiError(400, "Password should not be same as previous password");
  }

  user.password = password;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Password updated successfully", user));
});

const logoutUser = asyncHandler(async (req, res) => {
  const { device_token } = req.body;
  if (!device_token) {
    throw new ApiError(400, "Device token is required");
  }

  let removeIndex = req.user.device_token.indexOf(device_token);
  if (removeIndex !== -1) {
    req.user.device_token.splice(removeIndex, 1);
  }
  // Expire the access and refresh token on logout
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: "",
        device_token: req.user.device_token,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User Logged Out"));
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  const user = req.user;
  if (!user) {
    throw new ApiError(401, "User not found");
  }
  if (currentPassword === newPassword) {
    throw new ApiError(
      400,
      "New Password should not be same as Current Password"
    );
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "Confirm Password should be same as New Password");
  }

  const isValidPassord = await user.isPasswordCorrect(currentPassword);

  if (!isValidPassord) {
    throw new ApiError(401, "Invalid Password");
  }

  const isPreviousPassword = await user.isPreviousPassword(newPassword);
  if (isPreviousPassword) {
    throw new ApiError(400, "Password should not be same as previous password");
  }

  user.password = newPassword;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Password updated successfully", user));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken = req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Invalid Token");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(404, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }
    //Generate a new Access Token and update the refresh token of the user
    const option = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(200, "Access Token refreshed Successfully", {
          accessToken,
          refreshToken,
        })
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Token");
  }
});

const saveDeviceDetails = asyncHandler(async (req, res) => {
  const { device_token, latitude, longitude, language } = req.body;
  const user = req.user;
  if (!user) {
    throw new ApiError(401, "User not found");
  }

  if (!user.device_token.includes(device_token)) {
    user.device_token.push(device_token);
  }
  user.latitude = latitude;
  user.longitude = longitude;
  user.language = language;

  const updatedData = await user.save();
  if (!updatedData) {
    throw new ApiError(500, "Failed to save device details");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Device Details saved successfully", updatedData)
    );
});

export {
  signup,
  loginUser,
  forgotPassword,
  resetPassword,
  verifyEmail,
  verifyOtp,
  resendOTP,
  setPassword,
  logoutUser,
  changePassword,
  refreshAccessToken,
  saveDeviceDetails,
};
