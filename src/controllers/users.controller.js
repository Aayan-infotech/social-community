import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  deleteObject,
  saveCompressedImage,
  compressVideo,
  uploadVideo,
  uploadImage,
  getVideoDuration,
} from "../utils/awsS3Utils.js";
import { FriendsModel } from "../models/friends.model.js";
import sendPushNotification from "../utils/sendPushNotification.js";
import NotificationModel from "../models/notification.model.js";
import FriendRequestModel from "./../models/friends_request.model.js";
import PostModel from "../models/posts.model.js";
import fs from "fs";
import { Experience } from "../models/experience.model.js";
import { Education } from "../models/education.model.js";
import { Story } from "../models/story.model.js";
import { DeleteAccountRequestModel } from "../models/delete_account_request.model.js";
import { isValidObjectId } from "./../utils/isValidObjectId.js";
import saveResourceModel from "../models/saveResources.model.js";
import PageModel from "../models/pages.model.js";
import FAQModel from "../models/FAQ.model.js";
import Skill from "../models/skills.model.js";
import InterestInProfileModel from "../models/matrimonialProfileInterest.model.js";

const getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.query.user_id || req.user.userId;

  const aggregation = [];
  aggregation.push({ $match: { userId } });

  aggregation.push({
    $lookup: {
      from: "friends",
      localField: "userId",
      foreignField: "userId",
      as: "friendsData",
    },
  });
  aggregation.push({
    $unwind: {
      path: "$friendsData",
      preserveNullAndEmptyArrays: true,
    },
  });
  aggregation.push({
    $lookup: {
      from: "posts",
      localField: "userId",
      foreignField: "userId",
      as: "postsData",
    },
  });
  aggregation.push({
    $addFields: {
      profile_image: {
        $ifNull: [
          "$profile_image",
          `${req.protocol}://${req.hostname}:${process.env.PORT}/placeholder/image_place.png`,
        ],
      },
      friendsCount: { $size: { $ifNull: ["$friendsData.friends", []] } },
      postsCount: { $size: "$postsData" },
    },
  });
  aggregation.push({
    $project: {
      _id: 0,
      userId: 1,
      name: 1,
      email: 1,
      mobile: 1,
      city: 1,
      gender: 1,
      bio: 1,
      state: 1,
      country: 1,
      referralCode: 1,
      profile_image: 1,
      friendsCount: 1,
      postsCount: 1,
    },
  });

  const BasicDetailsFields = ["name", "email", "mobile", "country", "state", "city", "gender"];


  const user = await User.aggregate(aggregation);

  if (!user.length) {
    throw new ApiError(404, "User not found");
  }

  res.json(new ApiResponse(200, "User profile fetched successfully", { ...user[0], completeness: 50 }));
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, state, city, gender, bio } = req.body;

  const userExists = await User.findOne({ _id: { $ne: req.user._id } });

  let profile_image = req.user?.profile_image ? req.user?.profile_image : "";

  if (req.files && req.files.profile_image) {
    // Delete the previous profile image from AWS
    if (req.user.profile_image) {
      await deleteObject(req.user.profile_image);
    }

    // Upload the new profile image to AWS S3
    const updateStatus = await saveCompressedImage(
      req.files.profile_image[0],
      200
    );

    if (updateStatus.success) {
      profile_image = updateStatus.thumbnailUrl;
    }

    // remove the oringinal file from the server
    if (
      req.files.profile_image[0].path &&
      fs.existsSync(req.files.profile_image[0].path)
    ) {
      fs.unlinkSync(req.files.profile_image[0].path);
    }
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        name,
        state,
        city,
        gender,
        bio,
        profile_image,
      },
    },
    { new: true }
  ).select(
    "-password -refreshToken -previous_passwords -_id -__v -referrals -referredBy -otpExpire -otp"
  );

  res.json(new ApiResponse(200, "User profile updated successfully", user));
});

const updateProfessionalImage = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  let professional_image = user?.professional_image
    ? user?.professional_image
    : "";

  if (req.files && req.files.professional_image) {
    // Delete the previous profile image from AWS
    if (req.user.professional_image) {
      await deleteObject(req.user.professional_image);
    }

    // Upload the new profile image to AWS S3
    const updateStatus = await saveCompressedImage(
      req.files.professional_image[0],
      200
    );

    if (updateStatus.success) {
      professional_image = updateStatus.thumbnailUrl;
    }

    // remove the oringinal file from the server
    if (
      req.files.professional_image[0].path &&
      fs.existsSync(req.files.professional_image[0].path)
    ) {
      fs.unlinkSync(req.files.professional_image[0].path);
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { professional_image } },
    { new: true }
  ).select(
    "-password -refreshToken -previous_passwords -_id -__v -referrals -referredBy -otpExpire -otp"
  );

  res.json(
    new ApiResponse(200, "Professional image updated successfully", {
      professional_image: updatedUser?.professional_image,
      name: updatedUser?.name,
      userId: updatedUser?.userId,
    })
  );
});

const getProfessionalProfile = asyncHandler(async (req, res) => {
  const userId = req.query.user_id || req.user.userId;

  const aggregation = [];
  aggregation.push({ $match: { userId } });
  aggregation.push({
    $lookup: {
      from: "educations",
      localField: "userId",
      foreignField: "userId",
      as: "education",
    },
  });
  aggregation.push({
    $lookup: {
      from: "experiences",
      localField: "userId",
      foreignField: "userId",
      as: "experience",
    },
  });

  aggregation.push({
    $lookup: {
      from: "friends",
      localField: "userId",
      foreignField: "userId",
      as: "friendsData",
    },
  });
  aggregation.push({
    $lookup: {
      from: "posts",
      localField: "userId",
      foreignField: "userId",
      as: "postsData",
    },
  });
  aggregation.push({
    $addFields: {
      professional_image: {
        $ifNull: [
          "$professional_image",
          `${req.protocol}://${req.hostname}:${process.env.PORT}/placeholder/image_place.png`,
        ],
      },
      friendsCount: { $size: { $ifNull: ["$friendsData.friends", []] } },
      postsCount: { $size: "$postsData" },
    },
  });
  aggregation.push({
    $project: {
      _id: 0,
      userId: 1,
      name: 1,
      email: 1,
      mobile: 1,
      city: 1,
      gender: 1,
      bio: 1,
      state: 1,
      country: 1,
      aboutMe: 1,
      referralCode: 1,
      professional_image: 1,
      experience: 1,
      friendsCount: 1,
      postsCount: 1,
      education: 1,
    },
  });

  const user = await User.aggregate(aggregation);

  if (!user.length) {
    throw new ApiError(404, "User not found");
  }

  res.json(new ApiResponse(200, "User profile fetched successfully", user[0]));
});

// Friends
const friendRequest = asyncHandler(async (req, res) => {
  const { friendId } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const userId = user?.userId;

  if (userId === friendId) {
    throw new ApiError(400, "You cannot send friend request to yourself");
  }
  const friendExists = await User.findOne({
    userId: friendId,
  }).select(
    "-password -refreshToken -previous_passwords -_id -__v -referrals -referredBy -otpExpire -otp"
  );

  if (!friendExists) {
    throw new ApiError(404, "Friend not found");
  }

  const friendRequestExists = await FriendRequestModel.findOne({
    senderId: userId,
    receiverId: friendId,
    status: { $in: ["pending", "accepted"] },
  });
  if (friendRequestExists) {
    throw new ApiError(400, "Friend request already sent or already friends");
  }

  const friendRequest = new FriendRequestModel({
    senderId: userId,
    receiverId: friendId,
    status: "pending",
  });

  const data = await friendRequest.save();

  if (friendExists?.device_token?.length > 0) {
    // Send push notification to the friend
    await sendPushNotification(
      friendExists?.device_token,
      "Friend Request",
      "You have received a friend request from " + user?.name,
      userId,
      friendId,
      {
        type: "friend_request",
        friendDetails: JSON.stringify(friendExists),
      }
    );
  }

  res.json(new ApiResponse(200, "Friend request added successfully", data));
});

const acceptRejectFriendRequest = asyncHandler(async (req, res) => {
  const { friendId, status } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const userId = user?.userId;

  const friendRequestExists = await FriendRequestModel.findOne({
    senderId: friendId,
    receiverId: userId,
    status: "pending",
  });

  if (!friendRequestExists) {
    throw new ApiError(404, "Friend request not found");
  }

  // check friend Exists in db

  const friendExists = await User.findOne({
    userId: friendId,
  }).select(
    "-password -refreshToken -previous_passwords -_id -__v -referrals -referredBy -otpExpire -otp"
  );
  if (!friendExists) {
    throw new ApiError(404, "Invalid friend id provided");
  }

  if (status === "accepted") {
    // Add friend to both users' friend lists
    const friendList = await FriendsModel.findOneAndUpdate(
      { userId },
      { $addToSet: { friends: friendId } },
      { new: true, upsert: true }
    );

    const friendFriendList = await FriendsModel.findOneAndUpdate(
      { userId: friendId },
      { $addToSet: { friends: userId } },
      { new: true, upsert: true }
    );

    if (friendExists?.device_token?.length > 0) {
      // send push notification to the friend
      await sendPushNotification(
        friendExists?.device_token,
        "Friend Request Accepted",
        user?.name + " has accepted your friend request",
        userId,
        friendId,
        {
          type: "friend_request_accepted",
          friendDetails: JSON.stringify(friendExists),
        }
      );
    }
    // send push notification in the accepted case
  }

  // update the status of the friend request
  const data = await FriendRequestModel.findByIdAndUpdate(
    friendRequestExists._id,
    { $set: { status } },
    { new: true }
  );

  res.json(
    new ApiResponse(
      200,
      status === "accepted"
        ? "Friend request accepted"
        : "Friend request rejected",
      data
    )
  );
});

const getFriendRequestList = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const userId = user.userId;

  const aggregation = [];
  aggregation.push({
    $match: {
      receiverId: userId,
      status: "pending",
      isDeleted: { $ne: true },
    },
  });

  aggregation.push({
    $lookup: {
      from: "users",
      localField: "senderId",
      foreignField: "userId",
      as: "senderDetails",
    },
  });

  aggregation.push({
    $unwind: "$senderDetails",
  });

  aggregation.push({
    $replaceRoot: {
      newRoot: "$senderDetails",
    },
  });

  aggregation.push({
    $facet: {
      friendRequests: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            userId: 1,
            name: 1,
            email: 1,
            mobile: 1,
            country: 1,
            state: 1,
            city: 1,
            gender: 1,
            profile_image: {
              $ifNull: [
                "$senderDetails.profile_image",
                `${req.protocol}://${req.hostname}:${process.env.PORT}/placeholder/image_place.png`,
              ],
            },
          },
        },
      ],
      totalCount: [{ $count: "count" }],
    },
  });

  const result = await FriendRequestModel.aggregate(aggregation);

  const friendRequests = result[0]?.friendRequests || [];
  const totalCount = result[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  res.json(
    new ApiResponse(
      200,
      friendRequests.length > 0
        ? "Friend requests fetched successfully"
        : "No friend requests found",
      friendRequests.length > 0
        ? {
          friendRequests,
          total_page: totalPages,
          current_page: page,
          total_records: totalCount,
          per_page: limit,
        }
        : null
    )
  );
});

const getFriendList = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const userId = user.userId;

  const friendListDoc = await FriendsModel.findOne({ userId });

  if (!friendListDoc || !friendListDoc.friends.length) {
    throw new ApiError(404, "Friend list not found or empty");
  }

  const aggregation = [
    {
      $match: {
        userId: { $in: friendListDoc.friends },
        role: "user",
        isDeleted: { $ne: true },
      },
    },
    {
      $facet: {
        friends: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              userId: 1,
              name: 1,
              email: 1,
              mobile: 1,
              country: 1,
              state: 1,
              city: 1,
              gender: 1,
              profile_image: {
                $ifNull: [
                  "$profile_image",
                  `${req.protocol}://${req.hostname}:${process.env.PORT}/placeholder/image_place.png`,
                ],
              },
            },
          },
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const result = await User.aggregate(aggregation);

  const friends = result[0]?.friends || [];
  const totalCount = result[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  res.json(
    new ApiResponse(
      200,
      friends.length > 0
        ? "Friend list fetched successfully"
        : "No friends found",
      friends.length > 0
        ? {
          friends,
          total_page: totalPages,
          current_page: page,
          total_records: totalCount,
          per_page: limit,
        }
        : null
    )
  );
});

const getFriendSuggestionList = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const userId = user?.userId;
  const friendList = await FriendsModel.findOne({ userId });

  const friends = friendList?.friends || [];

  // friends friends to suggestion list
  const FOFUser = await FriendsModel.find({
    userId: { $in: friends },
  });

  const friendsOfFriends = FOFUser.flatMap(friend => friend.friends);


  const baseMatchPipeline = [
    {
      $match: {
        userId: { $nin: friends, $ne: userId },
        role: "user",
        isDeleted: { $ne: true },
        $or: [
          { city: user?.city },
          { country: user?.country },
          { state: user?.state },
          { userId: { $in: friendsOfFriends } },
        ],
      },
    },
  ];

  const aggregation = [];

  aggregation.push({
    $lookup: {
      from: "friends",
      localField: "userId",
      foreignField: "userId",
      as: "friends_data",
    },
  });
  aggregation.push({
    $unwind: { path: "$friends_data", preserveNullAndEmptyArrays: true },
  });

  aggregation.push({
    $addFields: {
      mutualFriends: {
        $setIntersection: [friends, { $ifNull: ["$friends_data.friends", []] }],
      },
    },
  });

  aggregation.push({
    $lookup: {
      from: "users",
      localField: "mutualFriends",
      foreignField: "userId",
      as: "firstMutualFriendDetails",
    },
  });

  aggregation.push({
    $addFields: {
      firstMutualFriendDetails: {
        $arrayElemAt: ["$firstMutualFriendDetails", 0],
      },
      mutualFriendsCount: { $size: { $ifNull: ["$mutualFriends", []] } },
      totalFriends: { $size: { $ifNull: ["$friends_data.friends", []] } },
      isFoF: { $cond: [{ $in: ["$userId", friendsOfFriends] }, 1, 0] },
    },
  });

  aggregation.push({
    $lookup: {
      from: "friendrequests",
      let: { senderId: userId, receiverId: "$userId" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$senderId", "$$senderId"] },
                { $eq: ["$receiverId", "$$receiverId"] },
              ],
            },
          },
        },
      ],
      as: "friend_request_sended",
    },
  });

  aggregation.push({
    $sort: {
      isFoF: -1,
      totalFriends: -1,
      createdAt: -1,
    },
  });

  aggregation.push({
    $skip: skip,
  });

  aggregation.push({
    $limit: limit,
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
      profile_image: {
        $ifNull: [
          "$profile_image",
          `${req.protocol}://${req.hostname}:${process.env.PORT}/placeholder/image_place.png`,
        ],
      },
      followedBy: {
        $cond: {
          if: { $gt: ["$mutualFriendsCount", 0] },
          then: {
            $concat: [
              "Followed by ",
              "$firstMutualFriendDetails.name",
              {
                $cond: {
                  if: { $gt: ["$mutualFriendsCount", 1] },
                  then: {
                    $concat: [
                      " +",
                      { $toString: { $subtract: ["$mutualFriendsCount", 1] } },
                      " others",
                    ],
                  },
                  else: "",
                },
              },
            ],
          },
          else: null,
        },
      },
      friend_request_sended: {
        $cond: {
          if: { $gt: [{ $size: "$friend_request_sended" }, 0] },
          then: true,
          else: false,
        },
      },
    },
  });

  const results = await User.aggregate([
    ...baseMatchPipeline,
    {
      $facet: {
        metadata: [{ $count: "totalCount" }],
        data: aggregation,
      },
    },
  ]);

  const totalCount = results[0].metadata[0]?.totalCount || 0;
  const friendSuggestionList = results[0].data;

  res.json(
    new ApiResponse(200, "Friend suggestion list fetched successfully", {
      friendSuggestionList,
      total_page: Math.ceil(totalCount / limit),
      current_page: page,
      total_records: totalCount,
      per_page: limit,
    })
  );
});

const getNotifications = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const userId = user?.userId;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const skip = (page - 1) * limit;

  // Get total count for pagination info
  const totalNotifications = await NotificationModel.countDocuments({
    receiverId: userId,
  });

  // Fetch notifications with pagination
  const notificationList = await NotificationModel.find({
    receiverId: userId,
  })
    .sort({
      createdAt: -1,
    })
    .select("-data -__v")
    .skip(skip)
    .limit(limit);

  res.json(
    new ApiResponse(200, "Notification list fetched successfully", {
      notificationList,
      total_page: Math.ceil(totalNotifications / limit),
      current_page: page,
      total_records: totalNotifications,
      per_page: limit,
    })
  );
});

const getUserPosts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const { user_id, type } = req.query;

  const user = await User.findOne({ userId: user_id }).select(
    "-password -refreshToken -previous_passwords -_id -__v -referrals -referredBy -otpExpire -otp -device_token"
  );
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const types = ["social", "professional"];
  if (!types.includes(type)) {
    throw new ApiError(400, "Invalid type provided");
  }

  const userId = user.userId;

  const baseMatchPipeline = [{ $match: { userId } }, { $match: { type } }];

  const aggregation = [];
  aggregation.push({
    $match: {
      userId,
      type,
    },
  });

  aggregation.push({
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "userId",
      as: "user",
    },
  });
  aggregation.push({
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "userId",
      as: "user",
    },
  });
  aggregation.push({
    $unwind: "$user",
  });
  aggregation.push({
    $addFields: {
      comment_count: { $size: "$comments" },
    },
  });
  aggregation.push({
    $unset: ["likedBy", "comments"],
  });
  aggregation.push({
    $project: {
      "user.name": 1,
      "user.profile_image": 1,
      "user.userId": 1,
      title: 1,
      description: 1,
      type: 1,
      media: 1,
      likes: 1,
      comment_count: 1,
      createdAt: 1,
      "user.profile_image": {
        $ifNull: [
          "$user.profile_image",
          `${req.protocol}://${req.hostname}:${process.env.PORT}/placeholder/image_place.png`,
        ],
      },
    },
  });

  const results = await PostModel.aggregate([
    ...baseMatchPipeline,
    {
      $facet: {
        metadata: [{ $count: "totalCount" }],
        data: aggregation,
      },
    },
  ]);

  const totalCount = results[0].metadata[0]?.totalCount || 0;
  const posts = results[0].data;

  if (!posts.length) {
    throw new ApiError(404, "No posts found for this user");
  }

  res.json(
    new ApiResponse(200, "User posts fetched successfully", {
      posts,
      total_page: Math.ceil(totalCount / limit),
      current_page: page,
      total_records: totalCount,
      per_page: limit,
    })
  );
});

const updateUserAboutMe = asyncHandler(async (req, res) => {
  const { aboutMe } = req.body;
  if (!aboutMe) {
    throw new ApiError(400, "About me is required");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { aboutMe },
    { new: true }
  ).select(
    "-password -refreshToken -previous_passwords -_id -__v -referrals -referredBy -otpExpire -otp"
  );

  res.json(new ApiResponse(200, "About me updated successfully", user));
});

// const upsertExperience = asyncHandler(async (req, res) => {
//   // throw new ApiError(400, "Not implemented yet");
//   const {
//     title,
//     employmentType,
//     companyName,
//     startDate,
//     endDate,
//     location,
//     locationType,
//     description,
//     isCurrentWorking,
//     skills,
//   } = req.body;
//   const userId = req.user.userId;

//   // upsert the experience in the DB

//   const experience = await Experience.findByIdAndUpdate(
//     req.body.id,
//     {
//       $set: {
//         title,
//         employmentType,
//         companyName,
//         startDate,
//         endDate,
//         location,
//         locationType,
//         description,
//         isCurrentWorking,
//         skills,
//       },
//     },
//     { new: true, upsert: true }
//   );
//   if (!experience) {
//     throw new ApiError(404, "Experience not found");
//   }

//   res.json(new ApiResponse(200, "Experience updated successfully", experience));
// });
const upsertExperience = asyncHandler(async (req, res) => {
  const {
    id,
    title,
    employmentType,
    companyName,
    startDate,
    endDate,
    location,
    locationType,
    description,
    isCurrentWorking,
    skills,
  } = req.body;
  const userId = req.user.userId;

  if (!title || !employmentType || !companyName || !startDate) {
    throw new ApiError(400, "Missing required fields");
  }

  let updateData = {
    title,
    employmentType,
    companyName,
    startDate,
    location,
    locationType,
    description,
    isCurrentWorking,
    skills,
    userId,
  };

  // Insert the skill if the skill is not in the Skill table
  if (skills && skills.length) {
    for (const skill of skills) {
      const skillExists = await Skill.findOne({ name: skill });
      if (!skillExists) {
        const newSkill = new Skill({ name: skill });
        await newSkill.save();
      }
    }
  }

  if (isCurrentWorking) {
    updateData.endDate = null;
  } else {
    updateData.endDate = endDate || null;
  }

  const experience = await Experience.findByIdAndUpdate(
    id || new mongoose.Types.ObjectId(),
    { $set: updateData },
    { new: true, upsert: true }
  );

  res.json(new ApiResponse(200, "Experience updated successfully", experience));
});

const upsertEducation = asyncHandler(async (req, res) => {
  const {
    id,
    institutionName,
    degree,
    fieldOfStudy,
    startDate,
    endDate,
    description,
    skills,
    grade,
  } = req.body;

  const userId = req.user.userId;

  const updateData = {
    institutionName,
    degree,
    fieldOfStudy,
    startDate,
    endDate: endDate || null,
    description,
    skills,
    grade,
    userId,
  };

  if (skills && skills.length) {
    for (const skill of skills) {
      const skillExists = await Skill.findOne({ name: skill });
      if (!skillExists) {
        const newSkill = new Skill({ name: skill });
        await newSkill.save();
      }
    }
  }

  const education = await Education.findByIdAndUpdate(
    id || new mongoose.Types.ObjectId(),
    { $set: updateData },
    { new: true, upsert: true }
  );

  res.json(new ApiResponse(200, "Education updated successfully", education));
});

const searchSkills = asyncHandler(async (req, res) => {
  const { skill } = req.query;
  if (!skill) {
    throw new ApiError(400, "Skill is required");
  }

  const skills = await Skill.find({
    name: { $regex: skill, $options: "i" },
  })
    .select("name")
    .limit(10);

  res.json(new ApiResponse(200, "Skills fetched successfully", skills));
});

const addStory = asyncHandler(async (req, res) => {
  const { mediaType, description } = req.body;
  const userId = req.user.userId;
  const storyFile = req.files?.media;
  if (mediaType === "video" || mediaType === "image") {
    if (!storyFile || !storyFile.length) {
      throw new ApiError(400, "Please upload a file");
    }
  }

  let mediaUrl = null;
  if (mediaType !== "text") {
    if (storyFile && storyFile.length) {
      // const uploadStatus = await uploadImage(storyFile[0]);
      if (mediaType === "image") {
        const uploadStatus = await saveCompressedImage(storyFile[0], 600);
        if (uploadStatus.success) {
          mediaUrl = uploadStatus.thumbnailUrl;
        }
      } else if (mediaType === "video") {

        const videoDuration = await getVideoDuration(storyFile[0].path);
        if (videoDuration > 30) {
          throw new ApiError(400, "Video duration should not exceed 30 seconds");
        }

        const compressedVideo = await compressVideo(
          storyFile[0].path,
          "./public/temp"
        );

        if (!compressedVideo.success) {
          throw new ApiError(400, "Unable to upload video to server");
        }

        const videoFile = {
          path: compressedVideo.outputPath,
          originalname: storyFile[0].originalname,
          filename: storyFile[0].filename,
          mimetype: storyFile[0].mimetype,
        };

        const uploadStatus = await uploadVideo(videoFile);
        if (uploadStatus.success) {
          mediaUrl = uploadStatus.videoUrl;
        } else {
          throw new ApiError(400, "Unable to upload video to server");
        }

        // remove the raw and compressed file from the server
        if (storyFile[0].path && fs.existsSync(storyFile[0].path)) {
          fs.unlinkSync(storyFile[0].path);
        }
      }
    }
    if (!mediaUrl) {
      throw new ApiError(400, "Unable to upload file to server");
    }
  }

  const story = new Story({
    userId,
    mediaType,
    mediaUrl,
    description,
  });

  await story.save();

  res.json(new ApiResponse(200, "Story added successfully", story));
});

const getStories = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const friendList = await FriendsModel.findOne({ userId }).select("friends");
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  let userIdsToFetch = [];
  if (!friendList) {
    userIdsToFetch = [userId];
  } else {
    userIdsToFetch = [userId, ...friendList.friends];
  }

  const stories = await Story.aggregate([
    {
      $match: {
        userId: { $in: userIdsToFetch },
        isDeleted: { $ne: true },
        createdAt: { $gte: twentyFourHoursAgo },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $group: {
        _id: "$userId",
        stories: {
          $push: {
            id: "$_id",
            mediaType: "$mediaType",
            mediaUrl: "$mediaUrl",
            description: "$description",
            createdAt: "$createdAt",
          },
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "userId",
        as: "userInfo",
      },
    },
    {
      $unwind: "$userInfo",
    },
    {
      $addFields: {
        priority: {
          $cond: [{ $eq: ["$_id", userId] }, 0, 1],
        },
      },
    },
    {
      $sort: { priority: 1 },
    },
    {
      $project: {
        userId: "$_id",
        name: "$userInfo.name",
        profile_image: "$userInfo.profile_image",
        stories: 1,
        _id: 0,
      },
    },
  ]);

  const myStories = await Story.find({
    userId,
    createdAt: { $gte: twentyFourHoursAgo },
  }).sort({ createdAt: -1 });

  if (myStories.length === 0) {
    stories.unshift({
      stories: [],
      userId,
      name: req.user.name,
      profile_image:
        req.user.profile_image ||
        `${req.protocol}://${req.hostname}:${process.env.PORT}/placeholder/image_place.png`,
    });
  }

  res.json(new ApiResponse(200, "Get the Stories Successfully", stories));
});

const deleteStory = asyncHandler(async (req, res) => {
  const { storyId } = req.params;
  const userId = req.user.userId;

  const story = await Story.findOne({ _id: storyId, userId });
  if (!story) {
    throw new ApiError(404, "Story not found");
  }
  if (story.mediaUrl) {
    await deleteObject(story.mediaUrl);
  }
  await Story.deleteOne({ _id: storyId });
  res.json(new ApiResponse(200, "Story deleted successfully", null));
});

const getAllUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const search = req.query.search || "";

  const aggregation = [];
  if (search) {
    aggregation.push({
      $match: {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { mobile: { $regex: search, $options: "i" } },
        ],
      },
    });
  }

  aggregation.push({
    $match: { role: "user" },
  });

  aggregation.push({
    $sort: { [sortBy]: sortOrder },
  });

  aggregation.push({
    $facet: {
      data: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            userId: 1,
            name: 1,
            email: 1,
            mobile: 1,
            profile_image: 1,
            gender: 1,
            city: 1,
            state: 1,
            country: 1,
            aboutMe: 1,
            referralCode: 1,
            isDeleted: 1,
          },
        },
      ],
      total: [{ $count: "count" }],
    },
  });

  const result = await User.aggregate(aggregation);

  const users = result[0].data;
  const totalCount = result[0].total[0]?.count || 0;

  const totalPages = Math.ceil(totalCount / limit);
  const currentPage = page;

  res.json(
    new ApiResponse(200, "Fetched all users successfully", {
      users,
      total_page: totalPages,
      current_page: currentPage,
      total_records: totalCount,
      per_page: limit,
    })
  );
});

const deleteAccountRequest = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const userId = req.user.userId;

  // Check if the delete account request already exists
  const existingRequest = await DeleteAccountRequestModel.findOne({
    userId,
    status: ["pending", "approved"],
  });
  if (existingRequest) {
    throw new ApiError(
      400,
      "A delete account request already exists for this user"
    );
  }

  if (!reason) {
    throw new ApiError(400, "Reason is required");
  }

  const deleteRequest = new DeleteAccountRequestModel({
    userId,
    reason,
  });
  await deleteRequest.save();

  res.json(
    new ApiResponse(
      200,
      "Delete account request submitted successfully",
      deleteRequest
    )
  );
});

const getAllDeleteRequest = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  let { search, sortBy } = req.query;
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

  if (sortBy === "userInfo") {
    sortBy = "user.name";
  }

  const aggregation = [];
  aggregation.push({
    $match: { status: "pending" },
  });
  aggregation.push({
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "userId",
      as: "user",
    },
  });
  aggregation.push({
    $unwind: "$user",
  });
  aggregation.push({
    $addFields: {
      profile_image: {
        $ifNull: [
          "$user.profile_image",
          `${req.protocol}://${req.hostname}:${process.env.PORT}/placeholder/image_place.png`,
        ],
      },
    },
  });

  if (search) {
    aggregation.push({
      $match: {
        $or: [
          { "user.name": { $regex: search, $options: "i" } },
          { "user.email": { $regex: search, $options: "i" } },
          { "user.userId": { $regex: search, $options: "i" } },
          { reason: { $regex: search, $options: "i" } },
        ],
      },
    });
  }

  aggregation.push({
    $sort: {
      [sortBy || "createdAt"]: sortOrder,
    },
  });

  aggregation.push({
    $project: {
      _id: 1,
      userId: 1,
      reason: 1,
      status: 1,
      profile_image: 1,
      name: "$user.name",
      email: "$user.email",
      createdAt: 1,
    },
  });

  aggregation.push({
    $skip: skip,
  });
  aggregation.push({
    $limit: limit,
  });

  const deleteRequests = await DeleteAccountRequestModel.aggregate(aggregation);
  const totalRequests = await DeleteAccountRequestModel.countDocuments({
    status: "pending",
  });
  const totalPages = Math.ceil(totalRequests / limit);
  const currentPage = page;
  const totalRecords = totalRequests;
  const perPage = limit;

  if (!deleteRequests.length) {
    return res.json(
      new ApiResponse(200, "No delete account requests found", [])
    );
  }

  res.json(
    new ApiResponse(200, "Fetched all delete account requests successfully", {
      deleteRequests,
      total_page: totalPages,
      current_page: currentPage,
      total_records: totalRecords,
      per_page: perPage,
    })
  );
});

const updateDeleteRequest = asyncHandler(async (req, res) => {
  const { requestId, status } = req.body;

  if (!isValidObjectId(requestId)) {
    throw new ApiError(400, "Invalid request ID");
  }

  // Check if the delete account request exists
  const deleteRequest = await DeleteAccountRequestModel.findById(requestId);
  if (!deleteRequest) {
    throw new ApiError(404, "Delete account request not found");
  }

  // Update the status of the delete account request
  if (status === "approved") {
    // update the user status to deleted add isDeleted key in the userModel
    await User.findOneAndUpdate(
      { userId: deleteRequest.userId },
      { $set: { isDeleted: true } }
    );

    deleteRequest.status = status;
    await deleteRequest.save();

    res.json(
      new ApiResponse(
        200,
        "Delete account request updated successfully",
        deleteRequest
      )
    );
  } else {
    await DeleteAccountRequestModel.findByIdAndDelete(requestId);
    return res.json(
      new ApiResponse(200, "Delete account request deleted successfully", null)
    );
  }
});

const saveResources = asyncHandler(async (req, res) => {
  const { type, resourceId } = req.body;
  const userId = req.user.userId;

  const resource = await saveResourceModel.create({
    userId,
    type,
    resourceId,
  });

  res.json(new ApiResponse(200, "Resource saved successfully", resource));
});

const getResources = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const userId = req.user.userId;
  const validTypes = ["job", "post", "health_wellness", "event"];
  if (!validTypes.includes(type)) {
    throw new ApiError(400, "Invalid resource type provided"); zs
  }

  const aggregation = [];

  aggregation.push({
    $match: { userId, type },
  });

  if (type === "job") {
    aggregation.push({
      $lookup: {
        from: "jobs",
        localField: "resourceId",
        foreignField: "_id",
        as: "resourceDetails",
      },
    });
  } else if (type === "post") {
    aggregation.push({
      $lookup: {
        from: "posts",
        localField: "resourceId",
        foreignField: "_id",
        as: "resourceDetails",
      },
    });
  } else if (type === "health_wellness") {
    aggregation.push({
      $lookup: {
        from: "health_wellness",
        localField: "resourceId",
        foreignField: "_id",
        as: "resourceDetails",
      },
    });
  } else if (type === "event") {
    aggregation.push({
      $lookup: {
        from: "events",
        localField: "resourceId",
        foreignField: "_id",
        as: "resourceDetails",
      },
    });
  }

  aggregation.push({
    $unwind: { path: "$resourceDetails", preserveNullAndEmptyArrays: true },
  });
  aggregation.push({
    $project: {
      _id: 0,
      userId: 1,
      type: 1,
      resourceId: 1,
      resourceDetails: 1,
    },
  });


  const resources = await saveResourceModel.aggregate(aggregation);
  if (!resources || resources.length === 0) {
    throw new ApiError(404, "Resources not found");
  }

  res.json(
    new ApiResponse(200, "Resources fetched successfully", resources)
  );
});

const addPages = asyncHandler(async (req, res) => {
  const { title, url, description } = req.body;
  const userId = req.user.userId;

  if (!title || !url || !description) {
    throw new ApiError(400, "Missing required fields");
  }

  const page = await PageModel.create({
    title,
    url,
    description,
  });

  res.json(new ApiResponse(200, "Page added successfully", page));
});


const saveFAQ = asyncHandler(async (req, res) => {
  const { question, answer } = req.body;

  if (!question || !answer) {
    throw new ApiError(400, "Missing required fields");
  }

  const faq = await FAQModel.create({
    question,
    answer,
  });

  res.json(new ApiResponse(200, "FAQ added successfully", faq));
});

const getPrivacyPolicy = asyncHandler(async (req, res) => {
  const privacyPolicy = await PageModel.findOne({ title: "Privacy Policy" });
  if (!privacyPolicy) {
    throw new ApiError(404, "Privacy policy not found");
  }
  res.json(
    new ApiResponse(200, "Privacy policy fetched successfully", privacyPolicy)
  );
});

const getTermsAndConditions = asyncHandler(async (req, res) => {
  const termsAndConditions = await PageModel.findOne({
    url: "term_and_conditions",
  });
  if (!termsAndConditions) {
    throw new ApiError(404, "Terms and conditions not found");
  }
  res.json(
    new ApiResponse(
      200,
      "Terms and conditions fetched successfully",
      termsAndConditions
    )
  );
});

const getFAQ = asyncHandler(async (req, res) => {
  const faqs = await FAQModel.find({})
    .select("-createdAt -__v -updatedAt")
    .sort({ createdAt: 1 });
  if (!faqs) {
    throw new ApiError(404, "FAQs not found");
  }
  res.json(new ApiResponse(200, "FAQs fetched successfully", faqs));
});

const updateFAQ = asyncHandler(async (req, res) => {
  const { faqId } = req.params;
  const { question, answer } = req.body;

  if (!isValidObjectId(faqId)) {
    throw new ApiError(400, "Invalid FAQ ID");
  }

  const faq = await FAQModel.findByIdAndUpdate(
    faqId,
    { question, answer },
    { new: true }
  );

  if (!faq) {
    throw new ApiError(404, "FAQ not found");
  }

  res.json(new ApiResponse(200, "FAQ updated successfully", faq));
});

const deleteFAQ = asyncHandler(async (req, res) => {
  const { faqId } = req.params;

  const faq = await FAQModel.findByIdAndDelete(faqId);
  if (!faq) {
    throw new ApiError(404, "FAQ not found");
  }

  res.json(new ApiResponse(200, "FAQ deleted successfully"));
});

const updateMatrimonialProfile = asyncHandler(async (req, res) => {
  const {
    matrimonialAboutMe,
    maritalStatus,
    dob,
    address,
    nativePlace,
    birthPlace,
    height,
    weight,
    religion,
    caste,
  } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        matrimonialAboutMe,
        maritalStatus,
        dob,
        address,
        nativePlace,
        birthPlace,
        height,
        weight,
        religion,
        caste,
      },
    },
    { new: true }
  ).select(
    "-password -refreshToken -previous_passwords -_id -__v -referrals -referredBy -otpExpire -otp"
  );

  res.json(
    new ApiResponse(200, "Matrimonial profile updated successfully", user)
  );
});

const getMatrimonialProfile = asyncHandler(async (req, res) => {
  const userId = req.query.user_id || req.user.userId;

  const aggregation = [];
  aggregation.push({ $match: { userId, role: "user", isDeleted: { $ne: true } } });

  aggregation.push({
    $lookup: {
      from: "friends",
      localField: "userId",
      foreignField: "userId",
      as: "friendsData",
    },
  });
  aggregation.push({
    $lookup: {
      from: "posts",
      localField: "userId",
      foreignField: "userId",
      as: "postsData",
    },
  });
  aggregation.push({
    $addFields: {
      profile_image: {
        $ifNull: [
          "$profile_image",
          `${req.protocol}://${req.hostname}:${process.env.PORT}/placeholder/image_place.png`,
        ],
      },
      friendsCount: { $size: { $ifNull: ["$friendsData.friends", []] } },
      postsCount: { $size: "$postsData" },
    },
  });
  aggregation.push({
    $project: {
      _id: 0,
      userId: 1,
      name: 1,
      email: 1,
      mobile: 1,
      city: 1,
      gender: 1,
      state: 1,
      country: 1,
      matrimonialAboutMe: 1,
      maritalStatus: 1,
      dob: 1,
      address: 1,
      nativePlace: 1,
      birthPlace: 1,
      height: 1,
      weight: 1,
      complexion: 1,
      religion: 1,
      caste: 1,
      profile_image: 1,
      friendsCount: 1,
      postsCount: 1,
    },
  });

  const user = await User.aggregate(aggregation);

  if (!user.length) {
    throw new ApiError(404, "User not found");
  }

  res.json(
    new ApiResponse(
      200,
      "User Matrimonial Profile fetched successfully",
      user[0]
    )
  );
});

const getMatrimonialProfileSuggestions = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const userId = req.user.userId;

  let { minAge, maxAge, minHeight, maxHeight, religion, caste, maritalStatus } =
    req.query;
  minAge = parseInt(minAge) || 18;
  maxAge = parseInt(maxAge) || 60;

  if (isNaN(minAge) || isNaN(maxAge)) {
    throw new ApiError(400, "Invalid age range provided");
  }

  maritalStatus = maritalStatus
    ? maritalStatus.split(",")
    : ["single", "divorced", "widowed"];
  religion = religion
    ? religion.split(",")
    : ["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist", "Other"];
  caste = caste ? caste.split(",") : [];

  const baseMatchPipeline = [
    { $match: { role: "user", matrimonialAboutMe: { $ne: null }, userId: { $ne: userId }, gender: { $ne: req.user.gender }, isDeleted: { $ne: true } } },
  ];

  const aggregation = [];
  aggregation.push(...baseMatchPipeline);

  const currentYear = new Date().getFullYear();
  aggregation.push({
    $match: {
      dob: {
        $gte: new Date(currentYear - maxAge, 0, 1),
        $lte: new Date(currentYear - minAge, 11, 31),
      },
    },
  });

  if (minHeight && maxHeight) {
    aggregation.push({
      $match: {
        height: {
          $gte: minHeight,
          $lte: maxHeight,
        },
      },
    });
  }

  aggregation.push({
    $match: {
      maritalStatus: { $in: maritalStatus },
    },
  });

  aggregation.push({
    $match: {
      religion: { $in: religion },
    },
  });

  if (caste.length > 0) {
    aggregation.push({
      $match: {
        caste: { $in: caste },
      },
    });
  }

  aggregation.push({
    $lookup: {
      from: "interestinprofiles",
      localField: "userId",
      foreignField: "senderId",
      as: "interests",
    },
  });

  aggregation.push({
    $addFields: {
      hasInterestSend: {
        $cond: {
          if: { $gt: [{ $size: "$interests" }, 0] },
          then: true,
          else: false,
        },
      },
    },
  });

  aggregation.push({
    $facet: {
      suggestions: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            userId: 1,
            name: 1,
            email: 1,
            mobile: 1,
            city: 1,
            state: 1,
            country: 1,
            profile_image: {
              $ifNull: [
                "$profile_image",
                `${req.protocol}://${req.hostname}:${process.env.PORT}/placeholder/image_place.png`,
              ],
            },
            matrimonialAboutMe: 1,
            maritalStatus: 1,
            dob: 1,
            address: 1,
            nativePlace: 1,
            birthPlace: 1,
            height: 1,
            weight: 1,
            complexion: 1,
            religion: 1,
            caste: 1,
            hasInterestSend: 1,
          },
        },
      ],
      totalCount: [{ $count: "count" }],
    },
  });

  const results = await User.aggregate(aggregation);

  const suggestions = results[0]?.suggestions || [];
  const totalCount = results[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return res.json(
    new ApiResponse(
      200,
      suggestions.length > 0
        ? "Matrimonial profile suggestions fetched successfully"
        : "No matrimonial profile suggestions found",
      suggestions.length > 0
        ? {
          suggestions,
          total_page: totalPages,
          current_page: page,
          total_records: totalCount,
          per_page: limit,
        }
        : null
    )
  );
});

const sendInterest = asyncHandler(async (req, res) => {
  const { receiverId } = req.body;

  if (!receiverId) {
    throw new ApiError(400, "Receiver ID is required");
  }

  // Check if any sender or receiver is the same as
  const aggregation = [];
  aggregation.push({
    $match: {
      $or: [
        { senderId: req.user.userId, receiverId },
        { senderId: receiverId, receiverId: req.user.userId },
      ],
      status: { $in: ["pending", "accepted"] },
    },
  });
  const existingInterest = await InterestInProfileModel.aggregate(aggregation);
  if (existingInterest.length > 0) {
    throw new ApiError(400, "Interest already sent or received");
  }

  const interest = await InterestInProfileModel.create({
    senderId: req.user.userId,
    receiverId,
  });

  res.json(new ApiResponse(201, "Interest sent successfully", interest));
});

const acceptRejectInterest = asyncHandler(async (req, res) => {
  const { interestId, status } = req.body;

  if (!interestId || !status) {
    throw new ApiError(400, "Interest ID and status are required");
  }

  const validStatuses = ["accepted", "rejected"];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  const interest = await InterestInProfileModel.findById(interestId);
  if (!interest) {
    throw new ApiError(404, "Interest not found");
  }
  if (interest.status !== "pending") {
    throw new ApiError(400, "Interest already processed");
  }

  const friendId = interest.senderId;
  const userId = req.user.userId;

  const friendExists = await User.findOne({
    userId: friendId,
  }).select(
    "-password -refreshToken -previous_passwords -_id -__v -referrals -referredBy -otpExpire -otp"
  );
  if (!friendExists) {
    throw new ApiError(404, "Invalid friend id provided");
  }

  let message = "";
  if (status === "accepted") {
    // Add the user to the friends list
    const friendList = await FriendsModel.findOneAndUpdate(
      { userId },
      { $addToSet: { friends: friendId } },
      { new: true, upsert: true }
    );

    const friendFriendList = await FriendsModel.findOneAndUpdate(
      { userId: friendId },
      { $addToSet: { friends: userId } },
      { new: true, upsert: true }
    );

    if (friendExists?.device_token?.length > 0) {
      // send push notification to the friend
      await sendPushNotification(
        friendExists?.device_token,
        "Matrimonial Interest Accepted",
        req?.user?.name + " has accepted your matrimonial interest",
        userId,
        friendId,
        {
          type: "matrimonial_interest_accepted",
          profileDetails: JSON.stringify(friendExists),
        }
      );
    }
    interest.status = "accepted";
    message = "Interest accepted successfully";
  } else {
    interest.status = "rejected";
    message = "Interest rejected successfully";
  }

  await interest.save();

  res.json(new ApiResponse(200, message, interest));
});

const getInterrestedProfiles = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const userId = req.user.userId;

  const aggregation = [];

  aggregation.push({
    $match: {
      receiverId: userId,
      status: "pending",
    },
  });

  aggregation.push({
    $lookup: {
      from: "users",
      localField: "senderId",
      foreignField: "userId",
      as: "senderInfo",
    },
  });
  aggregation.push({
    $unwind: {
      path: "$senderInfo",
      preserveNullAndEmptyArrays: true,
    },
  });

  aggregation.push({
    $facet: {
      interestedProfiles: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            senderId: 1,
            senderName: "$senderInfo.name",
            senderEmail: "$senderInfo.email",
            senderMobile: "$senderInfo.mobile",
            senderProfileImage: {
              $ifNull: [
                "$senderInfo.profile_image",
                `${req.protocol}://${req.hostname}:${process.env.PORT}/placeholder/image_place.png`,
              ],
            },
            createdAt: 1,
            status: 1,
          },
        },
      ],
      totalCount: [{ $count: "count" }],
    },
  });

  const results = await InterestInProfileModel.aggregate(aggregation);
  const interestedProfiles = results[0]?.interestedProfiles || [];
  const totalCount = results[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  res.json(
    new ApiResponse(
      200,
      interestedProfiles.length > 0
        ? "Interests fetched successfully"
        : "No interests found",
      interestedProfiles.length > 0
        ? {
          interestedProfiles,
          total_page: totalPages,
          current_page: page,
          total_records: totalCount,
          per_page: limit,
        }
        : null
    )
  );
});

const getAllInfoPages = asyncHandler(async (req, res) => {
  // const pages = await PageModel.find({});
  // res.json(new ApiResponse(200, "Info pages fetched successfully", pages));

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const { sortBy, sortOrder, search } = req.query;

  const aggregation = [];

  aggregation.push({
    $match: {
      isDeleted: { $ne: true },
      ...(search && {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } },
        ],
      }),
    },
  });

  aggregation.push({
    $sort: {
      [sortBy]: sortOrder === "asc" ? 1 : -1,
    },
  });

  aggregation.push({
    $facet: {
      infoPages: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            title: 1,
            url: 1,
            description: 1,
          },
        },
      ],
      totalCount: [{ $count: "count" }],
    },
  });

  const results = await PageModel.aggregate(aggregation);
  const infoPages = results[0]?.infoPages || [];
  const totalCount = results[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  res.json(
    new ApiResponse(
      200,
      infoPages.length > 0 ? "Info pages fetched successfully" : "No info pages found",
      infoPages.length > 0
        ? {
          infoPages,
          total_page: totalPages,
          current_page: page,
          total_records: totalCount,
          per_page: limit,
        }
        : null
    )
  );
});


const updatePage = asyncHandler(async (req, res) => {
  const { pageId } = req.params;
  const { title, url, description } = req.body;

  if (!isValidObjectId(pageId)) {
    throw new ApiError(400, "Invalid page ID");
  }




  const page = await PageModel.findByIdAndUpdate(
    pageId,
    { title, url, description },
    { new: true }
  );

  if (!page) {
    throw new ApiError(404, "Page not found");
  }

  res.json(new ApiResponse(200, "Page updated successfully", page));
});

const searchAllUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;
  const userId = req.user.userId;
  const { search } = req.query;
  if (!search) {
    throw new ApiError(400, "Search query is required");
  }

  const aggregation = [];
  aggregation.push({
    $match: {
      role: "user",
      userId: { $ne: userId },
      isDeleted: { $ne: true },
    },
  });
  aggregation.push({
    $match: {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
      ],
      role: "user",
    },
  });

  // added a key that will hasFriend boolean value to check if the user has friend request sent to them
  aggregation.push({
    $lookup: {
      from: "friends",
      localField: "userId",
      foreignField: "userId",
      as: "friends_data",
    },
  });

  aggregation.push({
    $addFields: {
      hasFriend: {
        $gt: [{ $size: "$friends_data" }, 0],
      },
    },
  });

  aggregation.push({
    $lookup: {
      from: "friendrequests",
      let: { senderId: userId, receiverId: "$userId" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$senderId", "$$senderId"] },
                { $eq: ["$receiverId", "$$receiverId"] },
              ],
            },
          },
        },
      ],
      as: "friend_request_sended",
    },
  });

  aggregation.push({
    $facet: {
      users: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            userId: 1,
            name: 1,
            email: 1,
            mobile: 1,
            country: 1,
            state: 1,
            city: 1,
            profile_image: {
              $ifNull: [
                "$profile_image",
                `${req.protocol}://${req.hostname}:${process.env.PORT}/placeholder/image_place.png`,
              ],
            },
            hasFriend: 1,
            friend_request_sended: {
              $cond: {
                if: { $gt: [{ $size: "$friend_request_sended" }, 0] },
                then: true,
                else: false,
              },
            },
          },
        },
      ],
      totalCount: [{ $count: "count" }],
    },
  });

  const result = await User.aggregate(aggregation);

  const users = result[0]?.users || [];
  const totalCount = result[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  res.json(
    new ApiResponse(
      200,
      users.length > 0 ? "Users fetched successfully" : "No users found",
      users.length > 0
        ? {
          users,
          total_page: totalPages,
          current_page: page,
          total_records: totalCount,
          per_page: limit,
        }
        : null
    )
  );
});

const deleteFriendRequest = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const currentUserId = req.user.userId;
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }
  await FriendRequestModel.findOneAndDelete({
    senderId: currentUserId,
    receiverId: userId,
  });
  res.json(new ApiResponse(200, "Friend request deleted successfully"));
});

const sendNotification = asyncHandler(async (req, res) => {
  const { receiverId, message } = req.body;
  if (!receiverId || !message) {
    throw new ApiError(400, "Receiver ID and message are required");
  }

  if (Array.isArray(receiverId)) {
    for (const id of receiverId) {
      const user = await User.findOne({ userId: id });
      if (user?.device_token.length > 0) {
        const saveNotification = await sendPushNotification(
          user?.device_token,
          "Message",
          message,
          req.user.userId,
          id
        );
      }
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Notification sent successfully"));
});

const uploadChatDocument = asyncHandler(async (req, res) => {
  const { document } = req.files;
  if (!document || !document.length) {
    throw new ApiError(400, "File is required");
  }

  const uploadStatus = await uploadImage(document[0]);
  if (!uploadStatus.success) {
    throw new ApiError(500, "Failed to upload file");
  }

  res.json(new ApiResponse(200, "File uploaded successfully", uploadStatus));
});

const removeFriend = asyncHandler(async (req, res) => {
  const { friendId } = req.body;
  const currentUserId = req.user.userId;

  if (!friendId) {
    throw new ApiError(400, "Friend ID is required");
  }

  const friendRequest = await FriendRequestModel.findOneAndDelete({
    $or: [
      { senderId: currentUserId, receiverId: friendId },
      { senderId: friendId, receiverId: currentUserId },
    ],
  });

  const friendList = await FriendsModel.findOne({ userId: currentUserId });
  if (!friendList) {
    throw new ApiError(404, "Friend list not found");
  }

  friendList.friends = friendList.friends.filter(
    (friend) => friend !== friendId
  );
  await friendList.save();
  // Remove the user from the friend's friend list
  const friendsFriendList = await FriendsModel.findOne({ userId: friendId });
  if (!friendsFriendList) {
    throw new ApiError(404, "Friend's friend list not found");
  }
  friendsFriendList.friends = friendsFriendList.friends.filter(
    (friend) => friend !== currentUserId
  );
  await friendsFriendList.save();

  res.json(new ApiResponse(200, "Friend removed successfully"));
});


const updateUserDetails = asyncHandler(async (req, res) => {
  const { name, email, mobile, gender, city, state, country, aboutMe } = req.body;
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const user = await User.findOne({ userId });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Remove the user from the request body if it exists


  // upload profile image if exists
  let profileImageUrl = null;
  if (req.files && req.files.profile_image) {

    if (user.profile_image) {
      await deleteImage(user.profile_image);
    }

    const profileImage = req.files.profile_image;
    if (!profileImage || !profileImage.length) {
      throw new ApiError(400, "Profile image is required");
    }
    const uploadStatus = await uploadImage(profileImage[0]);
    if (!uploadStatus.success) {
      throw new ApiError(500, "Failed to upload profile image");
    }
    profileImageUrl = uploadStatus.fileUrl;
  }

  user.name = name;
  user.email = email;
  user.mobile = mobile;
  user.gender = gender;
  user.city = city;
  user.state = state;
  user.country = country;
  user.aboutMe = aboutMe;
  user.profile_image = profileImageUrl || null;

  await user.save()



  res.json(new ApiResponse(200, "User details updated successfully"));
});

const updateUserDeleteStatus = asyncHandler(async (req, res) => {
  const { isDeleted } = req.body;
  const { userId } = req.params;

  if (!userId || typeof isDeleted !== "boolean") {
    throw new ApiError(400, "User ID and isDeleted status are required");
  }

  const user = await User.findOneAndUpdate(
    { userId: userId },
    { $set: { isDeleted: isDeleted, refreshToken: null } }
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  res.json(new ApiResponse(200, "User delete status updated successfully"));
});


const getAllEventOrganizers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const role = req.user.role;
  if (!role.includes("admin")) {
    throw new ApiError(403, "You do not have permission to access this resource");
  }

  const { sortBy = "createdAt", sortOrder = "desc", search } = req.query;


  const aggregation = [];
  aggregation.push({
    $match: { role: "event_manager", isDeleted: { $ne: true } },
  });
  if (search) {
    aggregation.push({
      $match: {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { mobile: { $regex: search, $options: "i" } },
        ],
      },
    });
  }

  aggregation.push({ $sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 } });

  aggregation.push({
    $facet: {
      data: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            userId: 1,
            name: 1,
            email: 1,
            mobile: 1,
            profile_image: {
              $ifNull: [
                "$profile_image",
                `${req.protocol}://${req.hostname}:${process.env.PORT}/placeholder/image_place.png`,
              ],
            },
            city: 1,
            state: 1,
            country: 1,
            gender: 1,
            role: 1,
          },
        },
      ],
      totalCount: [{ $count: "count" }],
    }
  });


  const result = await User.aggregate(aggregation);
  const eventOrganizers = result[0].data;
  const totalCount = result[0].totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  res.json(
    new ApiResponse(200, "Fetched all event organizers successfully", {
      eventOrganizers,
      total_page: totalPages,
      current_page: page,
      total_records: totalCount,
      per_page: limit,
    })
  );


});

const getAllVendors = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const role = req.user.role;
  if (!role.includes("admin")) {
    throw new ApiError(403, "You do not have permission to access this resource");
  }

  const { sortBy = "createdAt", sortOrder = "desc", search } = req.query;

  const aggregation = [];
  aggregation.push({
    $match: { role: "vendor", isDeleted: { $ne: true } },
  });

  if (search) {
    aggregation.push({
      $match: {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { mobile: { $regex: search, $options: "i" } },
        ],
      },
    });
  }

  aggregation.push({ $sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 } });

  aggregation.push({
    $facet: {
      data: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            userId: 1,
            name: 1,
            email: 1,
            mobile: 1,
            profile_image: {
              $ifNull: [
                "$profile_image",
                `${req.protocol}://${req.hostname}:${process.env.PORT}/placeholder/image_place.png`,
              ],
            },
            city: 1,
            state: 1,
            country: 1,
            gender: 1,
          },
        },
      ],
      totalCount: [{ $count: "count" }],
    },
  });

  const result = await User.aggregate(aggregation);
  const vendors = result[0].data;
  const totalCount = result[0].totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  res.json(
    new ApiResponse(200, "Fetched all vendors successfully", {
      vendors,
      total_page: totalPages,
      current_page: page,
      total_records: totalCount,
      per_page: limit,
    })
  );
});

export {
  getUserProfile,
  updateUserProfile,
  friendRequest,
  acceptRejectFriendRequest,
  getFriendRequestList,
  getFriendList,
  getFriendSuggestionList,
  getNotifications,
  getUserPosts,
  updateUserAboutMe,
  upsertExperience,
  upsertEducation,
  addStory,
  getStories,
  getAllUsers,
  deleteAccountRequest,
  getAllDeleteRequest,
  updateDeleteRequest,
  saveResources,
  addPages,
  saveFAQ,
  getPrivacyPolicy,
  getTermsAndConditions,
  getFAQ,
  updateMatrimonialProfile,
  getMatrimonialProfile,
  getAllInfoPages,
  getResources,
  updateProfessionalImage,
  getProfessionalProfile,
  searchSkills,
  searchAllUsers,
  deleteFriendRequest,
  sendNotification,
  uploadChatDocument,
  removeFriend,
  getMatrimonialProfileSuggestions,
  sendInterest,
  acceptRejectInterest,
  getInterrestedProfiles,
  updateUserDetails,
  updateUserDeleteStatus,
  getAllEventOrganizers,
  getAllVendors,
  updatePage,
  updateFAQ,
  deleteFAQ,
  deleteStory
};
