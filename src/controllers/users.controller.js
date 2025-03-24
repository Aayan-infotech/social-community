import { asyncHanlder } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { uploadImage } from "../utils/awsS3Utils.js";
import { FriendsModel } from "../models/friends.model.js";

const getUserProfile = asyncHanlder(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password").lean();
  const friends = await FriendsModel.findOne({ userId: user.userId });
  let count = friends ? friends.friends.length : 0;
  user.friendsCount = count;
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

// Friends
const friendRequest = asyncHanlder(async (req, res) => {
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
  });

  if (!friendExists) {
    throw new ApiError(404, "Friend not found");
  }

  let friendList = await FriendsModel.findOne({ userId });
  console.log(friendList);
  if (!friendList) {
    friendList = new FriendsModel({ userId, friend_requests: [friendId] });
  } else {
    if (!friendList.friends.includes(friendId)) {
      if (!friendList.friend_requests.includes(friendId)) {
        friendList.friend_requests.push(friendId);
      } else {
        throw new ApiError(400, "Friend request already sent");
      }
    } else {
      throw new ApiError(400, "Friend already in your friend list");
    }
  }
  const data = await friendList.save();
  res.json(new ApiResponse(200, "Friend request added successfully", data));
});

const acceptRejectFriendRequest = asyncHanlder(async (req, res) => {
  const { friendId, status } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const userId = user?.userId;
  const friendList = await FriendsModel.findOne({ userId });
  if (!friendList) {
    throw new ApiError(404, "Friend request not found");
  }
  if (!friendList.friend_requests.includes(friendId)) {
    throw new ApiError(404, "Friend request not found");
  }
  if (status === "accept") {
    friendList.friend_requests = friendList.friend_requests.filter(
      (friend) => friend !== friendId
    );

    friendList.friends.push(friendId);

    let friendFriendList = await FriendsModel.findOne({ userId: friendId });
    if (!friendFriendList) {
      friendFriendList = new FriendsModel({
        userId: friendId,
        friends: [userId],
      });
      await friendFriendList.save();
    } else {
      friendFriendList.friends.push(userId);
    }
  } else {
    friendList.friend_requests = friendList.friend_requests.filter(
      (friend) => friend !== friendId
    );
  }

  const data = await friendList.save();
  res.json(
    new ApiResponse(
      200,
      status === "accept"
        ? "Friend request accepted"
        : "Friend request rejected",
      data
    )
  );
});

const getFriendRequestList = asyncHanlder(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const userId = user?.userId;
  const friendList = await FriendsModel.findOne({ userId });
  if (!friendList) {
    throw new ApiError(404, "Friend request not found");
  }
  const friendRequests = await User.find({
    userId: { $in: friendList.friend_requests },
  }).select(
    "-password -refreshToken -_id -__v -referrals -referredBy -otpExpire -otp"
  );
  res.json(
    new ApiResponse(
      200,
      "Friend request list fetched successfully",
      friendRequests
    )
  );
});

const getFriendList = asyncHanlder(async (req, res) => {
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

const getFriendSuggestionList = asyncHanlder(async (req, res) => {
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

export {
  getUserProfile,
  updateUserProfile,
  friendRequest,
  acceptRejectFriendRequest,
  getFriendRequestList,
  getFriendList,
  getFriendSuggestionList,
};
