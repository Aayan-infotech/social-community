import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import UserModel from "../models/userModel.js";
import {
  hashPassword,
  generateUniqueUserId,
  genrateReferral,
  handleReferral,
} from "../utils/passwordUtils.js";
import Friend_List from "../models/friendListModel.js";
import { generateOTP, sendOTP } from "../utils/otpUtils.js";
import { logger } from "../utils/logger.js";

const registerUser = async (req, res) => {
  try {
    logger.info("User registration request received", { body: req.body });
    const { name, email, mobile, state, city, gender, password, referralBy } =
      req.body;

    const existingUser = await UserModel.findOne({
      $or: [{ email }, { mobile }],
    });

    if (existingUser) {
      if (existingUser.email === email && existingUser.mobile === mobile) {
        logger.warn("Attempt to register with existing email and mobile", {
          email,
          mobile,
        });
        return res.status(400).json({
          status: 400,
          message: [
            "Email and mobile are already registered. Please use a different email or mobile.",
          ],
        });
      } else if (existingUser.email === email) {
        logger.warn("Attempt to register with existing email", { email });
        return res.status(400).json({
          status: 400,
          message: [
            "Email is already registered. Please use a different email.",
          ],
        });
      } else if (existingUser.mobile === mobile) {
        logger.warn("Attempt to register with existing mobile", { mobile });
        return res.status(400).json({
          status: 400,
          message: [
            "Mobile number is already registered. Please use a different mobile number.",
          ],
        });
      }
    }

    logger.info("Hashing password for user", { email });
    const hashedPassword = await hashPassword(password);
    const otp = generateOTP();
    const userId = await generateUniqueUserId();
    const newReferralCode = await genrateReferral(name);

    let referredByUser = null;
    if (referralBy) {
      try {
        referredByUser = await handleReferral(referredByUser, userId);
      } catch (error) {
        return res.status(400).json({ status: 400, message: [error.message] });
      }
    }

    const user = new UserModel({
      userId,
      name,
      email,
      mobile,
      state,
      city,
      gender,
      referralCode: newReferralCode,
      password: hashedPassword,
      referrals: [],
      otp,
      otpExpire: new Date(Date.now() + 10 * 60 * 1000),
    });

    if (referredByUser) {
      user.referredBy = referredByUser;
    }

    await user.save();
    logger.info("User registered successfully, OTP generated", {
      email,
      mobile,
      otp,
    });

    // const otpSent = await sendOTP(mobile, otp);

    // if (!otpSent.success) {
    //   logger.error("OTP sending failed", { mobile, error: otpSent.message });
    //   return res.status(500).json({
    //     status: 500,
    //     message: otpSent.message,
    //   });
    // }

    logger.info("OTP sent successfully", { mobile });
    return res.status(200).json({
      status: 200,
      message: ["User registered successfully. OTP sent to mobile."],
    });
  } catch (error) {
    logger.error("Error in user registration", { error: error.message });
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp, type } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        status: 400,
        message: ["Email and OTP are required"],
      });
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: ["User not found"],
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({
        status: 400,
        message: ["Invalid OTP"],
      });
    }

    const currentTime = new Date();
    if (user.otpExpire < currentTime) {
      return res.status(400).json({
        status: 400,
        message: ["OTP has expired"],
      });
    }

    if (type === "register") {
      const accessToken = jwt.sign(
        { userId: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1h" }
      );

      const refreshToken = jwt.sign(
        { userId: user._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "30d" }
      );

      user.otp = null;
      user.otpExpire = null;
      user.refreshToken = refreshToken;
      await user.save();

      return res.status(200).json({
        status: 200,
        message: ["OTP verified successfully"],
        data: {
          accessToken,
          refreshToken,
        },
      });
    } else {
      user.otp = null;
      user.otpExpire = null;
      await user.save();

      return res.status(200).json({
        status: 200,
        message: [
          "OTP verified successfully. You can now reset your password.",
        ],
        data: user,
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, mobile, password } = req.body;

    if (!password || (!email && !mobile)) {
      return res.status(400).json({
        status: 400,
        message: ["Email or Mobile and password are required"],
      });
    }

    const user = await UserModel.findOne({
      $or: [{ email }, { mobile }],
    });

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: [
          "User not found with the provided email or mobile. Please check the details and try again.",
        ],
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        status: 400,
        message: [
          "The password you entered is incorrect. Please check and try again.",
        ],
      });
    }

    const accessToken = jwt.sign(
      { userid: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "30d" }
    );

    user.refreshToken = refreshToken;
    await user.save();

    return res.status(200).json({
      status: 200,
      message: ["Login successful"],
      data: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

const forgatePassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 400,
        message: ["Please provide a valid email address to proceed."],
      });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: [
          "Account not found with the provided email. Please check the email and try again.",
        ],
      });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const otpSent = await sendOTP(user.mobile, otp);

    if (!otpSent.success) {
      return res.status(500).json({
        status: 500,
        message: otpSent.message,
      });
    }

    return res.status(200).json({
      status: 200,
      message: ["OTP has been sent to your mobile."],
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

const setPassword = async (req, res) => {
  try {
    const { password, email } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 400,
        message: ["Please provide email, and password to proceed."],
      });
    }

    const user = await UserModel.findOne({ email });

    const hashedPassword = await hashPassword(password);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      status: 200,
      message: ["Your password has been updated successfully."],
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email, mobile } = req.body;

    if (!email && !mobile) {
      return res.status(400).json({
        status: 400,
        message: ["Please provide your registered email or mobile."],
      });
    }

    const user = await UserModel.findOne({
      $or: [{ email }, { mobile }],
    });

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: [
          "Account not found with the provided email or mobile. Please check and try again.",
        ],
      });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const otpSent = await sendOTP(user.mobile, otp);

    if (!otpSent.success) {
      return res.status(500).json({
        status: 500,
        message: otpSent.message,
      });
    }

    return res.status(200).json({
      status: 200,
      message: ["A new OTP has been sent to your registered mobile number"],
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

const logOut = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: ["User not found"],
      });
    }

    user.refreshToken = null;
    await user.save();

    return res.status(200).json({
      status: 200,
      message: ["Logout successful"],
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { userId } = req.user;
    const { password } = req.body;

    const user = await UserModel.findById(userId);

    const hashedPassword = await hashPassword(password);

    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      status: 200,
      message: ["Password changed successfully"],
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

const verifyRefralcode = async (req, res) => {
  try {
    logger.info("Received request to verify referral code", {
      requestBody: req.body,
    });
    const { referralCode } = req.body;

    if (!referralCode) {
      logger.warn("Referral code missing in request");
      return res.status(400).json({
        status: 400,
        message: ["Referral code is required"],
      });
    }

    logger.info(`Checking referral code: ${referralCode}`);
    const referral = await UserModel.findOne({ referralCode });

    if (!referral) {
      logger.warn(`Invalid referral code: ${referralCode}`);
      return res.status(404).json({
        status: 404,
        message: ["Invalid referral code"],
      });
    }

    logger.info(`Referral code verified successfully: ${referralCode}`);
    return res.status(200).json({
      status: 200,
      message: ["Referral code verified successfully"],
    });
  } catch (error) {
    logger.error("Error verifying referral code", { error: error.message });
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

const getProfileById = async (req, res) => {
  try {
    logger.info(`Fetching user with ID: ${req.params.id}`);

    let aggregation = [];

    aggregation.push({
      $match: { userId: req.params.id },
    });
    aggregation.push({
      $project: {
        _id: 0,
        userId: 0,
        password: 0,
        otp: 0,
        otpExpire: 0,
        refreshToken: 0,
        referrals: 0,
        __v: 0,
      },
    });

    const user = await UserModel.aggregate(aggregation);

    if (!user.length) {
      logger.warn(`User not found: ${req.params.id}`);
      return res.status(404).json({
        status: 404,
        message: ["User not found"],
      });
    }

    logger.info(`User fetched successfully: ${req.params.id}`);
    return res.status(200).json({
      status: 200,
      message: ["User fetched successfully"],
      data: user,
    });
  } catch (error) {
    logger.error(`Error fetching user: ${req.params.id}`, { error });
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateFields = req.body;

    if (Object.keys(updateFields).length === 0) {
      logger.warn(`No fields provided for update - User ID: ${userId}`);
      return res.status(400).json({
        status: 400,
        message: ["No fields provided for update"],
      });
    }

    logger.info(
      `Updating profile for user ID: ${userId} with fields: ${Object.keys(
        updateFields
      )}`
    );

    const userExists = await UserModel.findOne({ userId });
    if (!userExists) {
      logger.warn(`User not found - User ID: ${userId}`);
      return res.status(404).json({
        status: 404,
        message: ["User not found"],
      });
    }

    if (updateFields.email) {
      const emailExists = await UserModel.findOne({
        email: updateFields.email,
        userId: { $ne: userId },
      });

      if (emailExists) {
        logger.warn(
          `Email already in use: ${updateFields.email} - User ID: ${userId}`
        );
        return res.status(400).json({
          status: 400,
          message: ["Email already in use"],
        });
      }
    }

    if (updateFields.mobile) {
      const mobileExists = await UserModel.findOne({
        mobile: updateFields.mobile,
        userId: { $ne: userId },
      });

      if (mobileExists) {
        logger.warn(
          `Mobile number already in use: ${updateFields.mobile} - User ID: ${userId}`
        );
        return res.status(400).json({
          status: 400,
          message: ["Mobile number already in use"],
        });
      }
    }
    const updateResult = await UserModel.updateOne(
      { userId },
      { $set: updateFields }
    );

    if (updateResult.matchedCount === 0) {
      logger.warn(`User not found for update - User ID: ${userId}`);
      return res.status(404).json({
        status: 404,
        message: ["User not found"],
      });
    }

    if (updateResult.modifiedCount === 0) {
      logger.info(`No changes made for User ID: ${userId}`);
      return res.status(200).json({
        status: 200,
        message: ["No changes made"],
      });
    }

    logger.info(
      `Profile updated successfully - User ID: ${userId}, Fields: ${Object.keys(
        updateFields
      )}`
    );
    return res.status(200).json({
      status: 200,
      message: [
        `Profile updated successfully. Updated fields: ${Object.keys(
          updateFields
        ).join(", ")}`,
      ],
    });
  } catch (error) {
    logger.error(`Error updating profile for user ID: ${req.params.userId}`, {
      error,
    });
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

const friendRequest = async (req, res) => {
  try {
    const id = req.user.userId;
    const { friendId } = req.body;
    const user = await UserModel.findById(id);

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: ["User not found"],
      });
    }

    const userId = user?.userId;

    if (userId === friendId) {
      return res.status(400).json({
        status: 400,
        message: ["You cannot send friend request to yourself"],
      });
    }

    const friendExists = await UserModel.findOne({ userId: friendId });

    if (!friendExists) {
      return res.status(404).json({
        status: 404,
        message: ["Friend not found"],
      });
    }

    // if the user already in the Friends list then Cannot add the user to Friend Request

    let friendList = await Friend_List.findOne({ userId });

    if (!friendList) {
      friendList = new Friend_List({
        userId,
        friend_request: [friendId],
      });
    } else {
      if (!friendList.friends.includes(friendId)) {
        if (!friendList.friend_request.includes(friendId)) {
          friendList.friend_request.push(friendId);
        }
      } else {
        return res.status(400).json({
          status: 400,
          message: ["Friend already in your friend list"],
        });
      }
    }

    await friendList.save();

    return res.status(200).json({
      status: 200,
      message: ["Friend request added successfully"],
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

const acceptRejectFriend = async (req, res) => {
  try {
    const id = req.user.userId;
    const { friendId, status } = req.body;

    const userExists = await UserModel.findById(id);

    if (!userExists) {
      return res.status(404).json({
        status: 404,
        message: ["User not found"],
      });
    }
    const userId = userExists?.userId;
    const friendList = await Friend_List.findOne({ userId });

    if (!friendList) {
      return res.status(404).json({
        status: 404,
        message: ["Friend request not found"],
      });
    }
    if (!friendList.friend_request.includes(friendId)) {
      return res.status(404).json({
        status: 404,
        message: ["Friend request not found"],
      });
    }
    if (status === "accept") {
      friendList.friend_request = friendList.friend_request.filter(
        (friend) => friend !== friendId
      );

      friendList.friends.push(friendId);

      // if the accept the request create a new record for the friend
      let friendFriendList = await Friend_List.findOne({ userId: friendId });
      if (!friendFriendList) {
        friendFriendList = new Friend_List({
          userId: friendId,
          friends: [userId],
        });
        await friendFriendList.save();
      } else {
        friendFriendList.friends.push(userId);
      }
    } else {
      friendList.friend_request = friendList.friend_request.filter(
        (friend) => friend !== friendId
      );
    }
    await friendList.save();
    return res.status(200).json({
      status: 200,
      message: [
        status === "accept"
          ? "Friend request accepted"
          : "Friend request rejected",
      ],
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

const getFriendRequestList = async (req, res) => {
  try {
    const id = req.user.userId;
    const userExists = await UserModel.findById(id);
    if (!userExists) {
      return res.status(404).json({
        status: 404,
        message: ["User not found"],
      });
    }
    const userId = userExists?.userId;

    let aggregation = [];
    aggregation.push({ $match: { userId: { $eq: userId } } });
    aggregation.push({
      $lookup: {
        from: "users",
        localField: "friend_request",
        foreignField: "userId",
        as: "Friend_Request",
      },
    });
    aggregation.push({
      $project: {
        "Friend_Request.password": 0,
        "Friend_Request.otp": 0,
        "Friend_Request.otpExpire": 0,
        "Friend_Request.refreshToken": 0,
        "Friend_Request.referrals": 0,
        "Friend_Request.__v": 0,
        "Friend_Request.createdAt": 0,
        "Friend_Request.updatedAt": 0,
        "Friend_Request.referredBy": 0,
        _id: 0,
        friends: 0,
        friend_request: 0,
        createdAt: 0,
        updatedAt: 0,
        __v: 0,
      },
    });
    const friendRequestList = await Friend_List.aggregate(aggregation);
    return res.status(200).json({
      status: 200,
      message: ["Friend request list fetched successfully"],
      data: friendRequestList,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

const friendList = async (req, res) => {
  try {
    const id = req.user.userId;
    const userExists = await UserModel.findById(id);
    if (!userExists) {
      return res.status(404).json({
        status: 404,
        message: ["User not found"],
      });
    }
    const userId = userExists?.userId;

    let aggregation = [];
    aggregation.push({ $match: { userId: { $eq: userId } } });
    aggregation.push({
      $lookup: {
        from: "users",
        localField: "friends",
        foreignField: "userId",
        as: "Friends",
      },
    });
    aggregation.push({
      $project: {
        "Friends.password": 0,
        "Friends.otp": 0,
        "Friends.otpExpire": 0,
        "Friends.refreshToken": 0,
        "Friends.referrals": 0,
        "Friends.__v": 0,
        "Friends.createdAt": 0,
        "Friends.updatedAt": 0,
        "Friends.referredBy": 0,
        _id: 0,
        friends: 0,
        friend_request: 0,
        createdAt: 0,
        updatedAt: 0,
        __v: 0,
      },
    });

    const allFriendList = await Friend_List.aggregate(aggregation);

    return res.status(200).json({
      status: 200,
      message: ["Friend list fetched successfully"],
      data: allFriendList,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

const getFriendSuggestionList = async (req, res) => {
  try {
    const id = req.user.userId;
    const userExists = await UserModel.findById(id);
    if (!userExists) {
      return res.status(404).json({
        status: 404,
        message: ["User not found"],
      });
    }
    const userId = userExists?.userId;
    const friendList = await Friend_List.findOne({ userId });

    let friends = friendList ? friendList.friends : [];
    let friend_request = friendList ? friendList.friend_request : [];

    let aggregation = [];
    aggregation.push({ $match: { city: { $eq: userExists?.city } } });
    aggregation.push({ $match: { userId: { $ne: userId } } });
    aggregation.push({ $match: { userId: { $nin: friends } } });
    aggregation.push({
      $match: { userId: { $nin: friend_request } },
    });
    aggregation.push({
      $project: {
        _id: 0,
        userId: 1,
        name: 1,
        email: 1,
        mobile: 1,
        city: 1,
        state: 1,
      },
    });

    const friendSuggestionList = await UserModel.aggregate(aggregation);
    return res.status(200).json({
      status: 200,
      message: ["Friend suggestion list fetched successfully"],
      data: friendSuggestionList,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

export {
  registerUser,
  verifyOtp,
  loginUser,
  forgatePassword,
  setPassword,
  resendOtp,
  logOut,
  changePassword,
  verifyRefralcode,
  getProfileById,
  updateProfile,
  friendRequest,
  acceptRejectFriend,
  getFriendRequestList,
  friendList,
  getFriendSuggestionList,
};
