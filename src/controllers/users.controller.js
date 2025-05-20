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
      referralCode: 1,
      profile_image: 1,
      friendsCount: 1,
      postsCount: 1,
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

  const userExists = await User.findOne({ _id: { $ne: req.user._id } });

  let profile_image = req.user?.profile_image
    ? req.user?.profile_image
    : process.env.APP;

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
    // console.log("updateStatus", updateStatus);
    if (updateStatus.success) {
      professional_image = updateStatus.thumbnailUrl;
    }

    // remove the oringinal file from the server
    fs.unlinkSync(req.files.professional_image[0].path);
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
  }).select("name");

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
        const uploadStatus = await saveCompressedImage(storyFile[0], 200);
        if (uploadStatus.success) {
          mediaUrl = uploadStatus.thumbnailUrl;
        }
      } else if (mediaType === "video") {
        const compressedVideo = await compressVideo(
          storyFile[0].path,
          "./public/temp"
        );
        // console.log("compressedVideo", compressedVideo);
        if (!compressedVideo.success) {
          // mediaUrl = uploadStatus.fileUrl;
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
        fs.unlinkSync(storyFile[0].path);
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
  const userIdsToFetch = [userId, ...friendList.friends];
  const stories = await Story.aggregate([
    {
      $match: {
        userId: { $in: userIdsToFetch },
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
      $project: {
        userId: "$_id",
        name: "$userInfo.name",
        profile_image: "$userInfo.profile_image",
        stories: 1,
        _id: 0,
      },
    },
  ]);

  res.json(new ApiResponse(200, "Get the Stories Successfully", stories));
});

const getAllUsers = asyncHandler(async (req, res) => {
  // pagination
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  // add the pagination to the query
  const users = await User.find()
    .select(
      "name userId email mobile profile_image gender city state country aboutMe referralCode"
    )
    .skip(skip)
    .limit(limit);
  const totalUsers = await User.countDocuments({});
  const totalPages = Math.ceil(totalUsers / limit);
  const currentPage = page;
  const totalRecords = totalUsers;
  const perPage = limit;
  if (!users.length) {
    throw new ApiError(404, "No users found");
  }
  res.json(
    new ApiResponse(200, "Fetched all users successfully", {
      users,
      total_page: totalPages,
      current_page: currentPage,
      total_records: totalRecords,
      per_page: perPage,
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
          `${req.protocol}://${req.hostname}:${process.env.PORT}/placeholder/person.png`,
        ],
      },
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
    },
  });

  aggregation.push({
    $skip: skip,
  });
  aggregation.push({
    $limit: limit,
  });

  const deleteRequests = await DeleteAccountRequestModel.aggregate(aggregation);
  // console.log(deleteRequests);
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

  console.log("userId", userId);
  console.log("type", type);
  // console.log("resourceId", resourceId);
  console.log("req.body", req.body);

  const resource = await saveResourceModel.create({
    userId,
    type,
    resourceId,
  });

  res.json(new ApiResponse(200, "Resource saved successfully", resource));
});

const getResources = asyncHandler(async (req, res) => {
  const { type } = req.body;
  const userId = req.user.userId;

  const resources = await saveResourceModel
    .find({ userId, type })
    .populate("resourceId")
    .select("-_id -__v -createdAt -updatedAt");

  if (!resources) {
    throw new ApiError(404, "Resources not found");
  }

  res.json(new ApiResponse(200, "Resources fetched successfully", resources));
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
    .select("-_id -createdAt -__v -updatedAt")
    .sort({ createdAt: 1 });
  if (!faqs) {
    throw new ApiError(404, "FAQs not found");
  }
  res.json(new ApiResponse(200, "FAQs fetched successfully", faqs));
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

const getAllInfoPages = asyncHandler(async (req, res) => {
  const pages = await PageModel.find({});
  res.json(new ApiResponse(200, "Info pages fetched successfully", pages));
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
};
