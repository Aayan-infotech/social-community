import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { deleteImage, uploadImage } from "../utils/awsS3Utils.js";
import { FriendsModel } from "../models/friends.model.js";
import sendPushNotification from "../utils/sendPushNotification.js";
import NotificationModel from "../models/notification.model.js";
import FriendRequestModel from "./../models/friends_request.model.js";

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password").lean();
  const friends = await FriendsModel.findOne({ userId: user.userId });
  let count = friends ? friends.friends.length : 0;
  user.friendsCount = count;
  res.json(new ApiResponse(200, "User profile fetched successfully", user));
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, email, mobile, state, city, gender, bio } = req.body;

  // check the other user don't have the same email and mobile number
  const userExists = await User.findOne({
    $and: [{ _id: { $ne: req.user._id } }, { $or: [{ email }, { mobile }] }],
  });
  if (userExists) {
    if (userExists.email === email) {
      throw new ApiError(400, "Email already exists");
    } else if (userExists.mobile === mobile) {
      throw new ApiError(400, "Mobile number already exists");
    }
  }

  let profile_image = req.user?.profile_image ? req.user?.profile_image : null;

  if (req.files && req.files.profile_image) {
    // Delete the previous profile image from aws account
    if (req.user.profile_image) {
      await deleteImage(req.user.profile_image);
    }
    // Upload the new profile image to aws account
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
    "-password -refreshToken -_id -__v -referrals -referredBy -otpExpire -otp"
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

  // Send push notification to the friend
  await sendPushNotification(
    friendExists?.device_token,
    "Friend Request",
    "You have received a friend request from " + user?.name,
    userId,
    friendId,
    {
      type: "friend_request",
      friendDetails: friendExists,
    }
  );

  const data = await friendRequest.save();

  // let friendList = await FriendsModel.findOne({ userId });
  // if (!friendList) {
  //   friendList = new FriendsModel({ userId, friend_requests: [friendId] });
  // } else {
  //   if (!friendList.friends.includes(friendId)) {
  //     if (!friendList.friend_requests.includes(friendId)) {
  //       friendList.friend_requests.push(friendId);
  //     } else {
  //       throw new ApiError(400, "Friend request already sent");
  //     }
  //   } else {
  //     throw new ApiError(400, "Friend already in your friend list");
  //   }
  // }

  // // Send push notification to the friend
  // await sendPushNotification(
  //   friendExists?.device_token,
  //   "Friend Request",
  //   "You have received a friend request from " + user?.name,
  //   userId,
  //   friendId,
  //   {
  //     type: "friend_request",
  //     friendDetails: friendExists,
  //   }
  // );

  // const data = await friendList.save();
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
    "-password -refreshToken -_id -__v -referrals -referredBy -otpExpire -otp"
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
    "-password -refreshToken -_id -__v -referrals -referredBy -otpExpire -otp"
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
    "-password -refreshToken -_id -__v -referrals -referredBy -otpExpire -otp"
  );
  res.json(new ApiResponse(200, "Friend list fetched successfully", friends));
});

const getFriendSuggestionList = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const userId = user?.userId;
  const friendList = await FriendsModel.findOne({ userId });

  let friends = friendList ? friendList.friends : [];
  let friend_request = friendList ? friendList.friend_requests : [];

  let aggregation = [];
  aggregation.push({ $match: { city: { $eq: user?.city } } });
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

  const friendSuggestionList = await User.aggregate(aggregation);

  res.json(
    new ApiResponse(
      200,
      "Friend suggestion list fetched successfully",
      friendSuggestionList
    )
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
    new ApiResponse(
      200,
      "Notification list fetched successfully",
      {
        notificationList,
        total_page: Math.ceil(totalNotifications / limit), 
        current_page: page,
        total_records:totalNotifications,
        per_page: limit, 
      }
    )
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
};
