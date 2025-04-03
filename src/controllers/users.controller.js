import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  deleteImage,
  saveCompressedImage,
  uploadImage,
} from "../utils/awsS3Utils.js";
import { FriendsModel } from "../models/friends.model.js";
import sendPushNotification from "../utils/sendPushNotification.js";
import NotificationModel from "../models/notification.model.js";
import FriendRequestModel from "./../models/friends_request.model.js";
import PostModel from "../models/posts.model.js";
import fs from "fs";
import { Experience } from "../models/experience.model.js";
import { Education } from "../models/education.model.js";

const getUserProfile = asyncHandler(async (req, res) => {
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
      profile_image: {
        $ifNull: [
          "$profile_image",
          `${req.protocol}://${req.hostname}:${process.env.PORT}/placeholder/person.png`,
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
      profile_image: 1,
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

const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, state, city, gender, bio } = req.body;

  // check the other user don't have the same email and mobile number
  const userExists = await User.findOne({ _id: { $ne: req.user._id } });
  // if (userExists) {
  //   if (userExists.email === email) {
  //     throw new ApiError(400, "Email already exists");
  //   } else if (userExists.mobile === mobile) {
  //     throw new ApiError(400, "Mobile number already exists");
  //   }
  // }
  console.log(req.files);

  let profile_image = req.user?.profile_image
    ? req.user?.profile_image
    : process.env.APP;

  if (req.files && req.files.profile_image) {
    // Delete the previous profile image from AWS
    if (req.user.profile_image) {
      await deleteImage(req.user.profile_image);
    }

    // Upload the new profile image to AWS S3
    const updateStatus = await saveCompressedImage(
      req.files.profile_image[0],
      200
    );
    // console.log("updateStatus", updateStatus);
    if (updateStatus.success) {
      profile_image = updateStatus.thumbnailUrl;
    }

    // remove the oringinal file from the server
    fs.unlinkSync(req.files.profile_image[0].path);
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

    // send push notification in the accepted case
    await sendPushNotification(
      friendExists?.device_token,
      "Friend Request Accepted",
      user?.name + " has accepted your friend request",
      userId,
      friendId,
      {
        type: "friend_request_accepted",
        friendDetails: user,
      }
    );
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
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const userId = user.userId;
  const friendRequests = await FriendRequestModel.find({
    receiverId: userId,
    status: "pending",
  }).select("senderId");

  const senderIds = friendRequests.map((request) => request.senderId);

  if (!senderIds.length) {
    throw new ApiError(404, "No friend requests found");
  }

  // Fetch details of those users who sent the friend request
  const senders = await User.find({
    userId: { $in: senderIds },
  }).select(
    "-password -refreshToken -previous_passwords -_id -__v -referrals -referredBy -otpExpire -otp"
  );

  res.json(
    new ApiResponse(200, "Friend requests fetched successfully", senders)
  );
});

const getFriendList = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const userId = user?.userId;
  const friendList = await FriendsModel.findOne({ userId });
  if (!friendList) {
    throw new ApiError(404, "Friend list not found");
  }
  const friends = await User.find({
    userId: { $in: friendList.friends },
  }).select(
    "-password -refreshToken -previous_passwords -_id -__v -referrals -referredBy -otpExpire -otp"
  );
  res.json(new ApiResponse(200, "Friend list fetched successfully", friends));
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

  const baseMatchPipeline = [
    { $match: { city: user?.city } },
    { $match: { userId: { $ne: userId } } },
    { $match: { userId: { $nin: friends } } },
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
          `${req.protocol}://${req.hostname}:${process.env.PORT}/placeholder/person.png`,
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
          `${req.protocol}://${req.hostname}:${process.env.PORT}/placeholder/person.png`,
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

//   console.log(req.body);
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

  const education = await Education.findByIdAndUpdate(
    id || new mongoose.Types.ObjectId(),
    { $set: updateData },
    { new: true, upsert: true }
  );

  res.json(new ApiResponse(200, "Education updated successfully", education));
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
};
