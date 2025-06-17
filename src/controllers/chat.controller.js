import ChatGroup from "../models/chatgroup.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadImage } from "../utils/awsS3Utils.js";
import Chat from "../models/chat.model.js";
import { isValidObjectId } from "../utils/isValidObjectId.js";
import mongoose from "mongoose";
import Message from "../models/message.model.js";

const createGroup = asyncHandler(async (req, res) => {
  const { groupName, groupDescription, members } = req.body;

  let groupImage = "";
  if (req.files && req.files.groupIcon) {
    const groupIcon = await uploadImage(req.files.groupIcon[0]);
    if (!groupIcon.success) {
      throw new ApiError(500, "Failed to upload group icon");
    }
    groupImage = groupIcon.fileUrl;
  }

  const groupMembers = [...members, req.user.userId];

  const groupData = {
    groupName,
    groupDescription,
    members: groupMembers,
    groupAdmins: [req.user.userId],
    groupImage: groupImage || "https://example.com/default-group-image.png",
  };
  const newGroup = await ChatGroup.create(groupData);
  if (!newGroup) {
    throw new ApiError(500, "Failed to create group");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, "Group created successfully", newGroup));
});

const sendMessage = asyncHandler(async (req, res) => {
  const { userId, groupId, message } = req.body;

  if ((!userId || !groupId) && !message) {
    throw new ApiError(400, "User ID or Group ID and message are required");
  }

  let chatId = "";
  let responseData = {
    sender: req.user.userId,
  };
  if (userId) {
    const chatMembers = [userId, req.user.userId];

    // find existing chat
    const existingChat = await Chat.findOne({
      members: { $all: chatMembers },
      isGroupChat: false,
    });
    if (existingChat) {
      existingChat.latestMessage = message;
      chatId = existingChat._id;
      responseData.chat = await existingChat.save();
    } else {
      const chatData = {
        members: chatMembers,
        isGroupChat: false,
        latestMessage: message,
      };
      const status = await Chat.create(chatData);
      chatId = status._id;
      responseData.chat = status;
      if (!status) {
        throw new ApiError(500, "Failed to send message");
      }
    }
  } else {

    if (!groupId || !isValidObjectId(groupId)) {
      throw new ApiError(400, "Valid Group ID is required");
    }
    // check groupId chat exists
    const existingGroupChat = await Chat.findOne({
      chatGroupId: groupId,
      isGroupChat: true,
    });

    if (existingGroupChat) {
      existingGroupChat.latestMessage = message;
      chatId = existingGroupChat._id;
      responseData.chat = await existingGroupChat.save();
    } else {
      // get all the members of the group
      const groupMembers = await ChatGroup.findById(groupId).select("members");
      const chatData = {
        members: groupMembers.members,
        isGroupChat: true,
        chatGroupId: groupId,
        latestMessage: message,
      };
      const status = await Chat.create(chatData);
      chatId = status._id;
      responseData.chat = status;
      if (!status) {
        throw new ApiError(500, "Failed to send message");
      }
    }
  }

  const chatMessage = new Message({
    chatId,
    senderId: req.user.userId,
    content: message,
  });

  await chatMessage.save();

  return res.status(200).json(new ApiResponse(200, "Message sent successfully", responseData));
});

const getGroupDetails = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  if (!groupId && !isValidObjectId(groupId)) {
    throw new ApiError(400, "Group ID is required");
  }

  const aggregation = [];

  aggregation.push({
    $match: { _id: new mongoose.Types.ObjectId(groupId) },
  });

  aggregation.push({
    $lookup: {
      from: "users",
      localField: "members",
      foreignField: "_id",
      as: "memberDetails",
    },
  });
  aggregation.push({
    $lookup: {
      from: "users",
      localField: "groupAdmins",
      foreignField: "_id",
      as: "adminDetails",
    },
  });

  const group = await ChatGroup.aggregate(aggregation);
  return res
    .status(200)
    .json(new ApiResponse(200, "Group details fetched successfully", group));
});

const getChats = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const aggregation = [];

  // Match chats where the user is a member
  aggregation.push({
    $match: {
      members: { $in: [req.user.userId] },
    },
  });

  aggregation.push({
    $lookup: {
      from: "chatgroups",
      localField: "chatGroupId",
      foreignField: "_id",
      as: "groupDetails",
    },
  });

  aggregation.push({
    $lookup: {
      from: "users",
      localField: "members",
      foreignField: "userId",
      as: "memberDetails",
    },
  });

  aggregation.push({
    $addFields: {
      chatName: {
        $cond: {
          if: "$isGroupChat",
          then: { $arrayElemAt: ["$groupDetails.groupName", 0] },
          else: {
            $let: {
              vars: {
                otherUser: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$memberDetails",
                        as: "user",
                        cond: { $ne: ["$$user.userId", req.user.userId] },
                      },
                    },
                    0,
                  ],
                },
              },
              in: "$$otherUser.name",
            },
          },
        },
      },
      chatImage: {
        $cond: {
          if: "$isGroupChat",
          then: { $arrayElemAt: ["$groupDetails.groupImage", 0] },
          else: {
            $let: {
              vars: {
                otherUser: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$memberDetails",
                        as: "user",
                        cond: { $ne: ["$$user.userId", req.user.userId] },
                      },
                    },
                    0,
                  ],
                },
              },
              in: "$$otherUser.profile_image",
            },
          },
        },
      },
    },
  });

  // aggregation.push({

  // });

  aggregation.push({
    $facet: {
      chats: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            memberDetails: 0,
            groupDetails: 0,
            members: 0,
            __v: 0,
          },
        },
      ],
      totalCount: [{ $count: "count" }],
    },
  });


  const result = await Chat.aggregate(aggregation);

  const chats = result[0]?.chats || [];
  const totalCount = result[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  res.json(
    new ApiResponse(
      200,
      chats.length > 0 ? "Chats fetched successfully" : "No chats found",
      chats.length > 0
        ? {
          chats,
          total_page: totalPages,
          current_page: page,
          total_records: totalCount,
          per_page: limit,
        }
        : null
    )
  );

});


export { createGroup, sendMessage, getGroupDetails, getChats };
