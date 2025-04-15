import mongoose from "mongoose";
// import { FamilyModel } from "../models/familyMemberRequest.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId } from "../utils/isValidObjectId.js";
import FamilyMemberRequest from "../models/familyMemberRequest.model.js";
import { User } from "../models/user.model.js";
import { sendEmail } from "../services/emailService.js";
import FamilyMember from "../models/familyMember.model.js";
import {
  getRelatedRelation,
  getHierarchyLevel,
} from "../utils/HelperFunctions.js";

export const upsertFamily = asyncHandler(async (req, res) => {
  const { id, familyName, familyLocation } = req.body;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid family ID format");
  }

  const userId = req.user.userId;

  const family = await FamilyModel.findByIdAndUpdate(
    id || new mongoose.Types.ObjectId(),
    { familyName, familyLocation },
    { new: true, upsert: true }
  );

  if (!family) {
    throw new ApiError(400, "Unable to create or update family");
  }

  res.json(
    new ApiResponse(200, "Family created or updated successfully", family)
  );
});

export const getFamily = asyncHandler(async (req, res) => {
  throw new ApiError(400, "Not implemented yet");
});

export const addFamilyMember = asyncHandler(async (req, res) => {
  throw new ApiError(400, "Not implemented yet");
});

export const addFamilyMemberRequest = asyncHandler(async (req, res) => {
  const { name, relationship, jobRole, company, email, mobile, address } =
    req.body;
  const userId = req.user.userId;

  const requestExists = await FamilyMemberRequest.findOne({
    $or: [{ email }, { mobile }],
    status: "pending",
    relationship,
  });
  if (requestExists) {
    throw new ApiError(400, "Request already exists with this email or mobile");
  }

  const link = "https://google.com/download";

  const html = `<div>
      <h1>Family Member Request</h1>
      <p>Dear ${name}</p>
      <p>${req.user.name} is requesting to add you to their family.</p>
      <p>Relationship: ${relationship}</p>
      <button><a href="${link}">Download App</a></button>
    </div>`;
  // send otp to email address
  const send = await sendEmail(email, "Family Member Request", html);
  if (!send.success) {
    throw new ApiError(500, "Failed to send email");
  }

  const familyMemberRequest = await FamilyMemberRequest.create({
    name,
    relationship,
    jobRole,
    company,
    email,
    mobile,
    address,
    userId,
  });

  res.json(
    new ApiResponse(
      200,
      "Family member request created successfully",
      familyMemberRequest
    )
  );
});

export const getFamilyMembersRequest = asyncHandler(async (req, res) => {
  const { type } = req.query;
  if (!type) {
    throw new ApiError(400, "Type is required");
  }
  if (type !== "send" && type !== "received") {
    throw new ApiError(400, "Type should be either send or received");
  }

  if (type === "send") {
    const familyMemberRequests = await FamilyMemberRequest.find({
      userId: req.user.userId,
    });

    res.json(
      new ApiResponse(
        200,
        familyMemberRequests.length > 0
          ? "Family member requests fetched successfully"
          : "No family member requests found",
        familyMemberRequests
      )
    );
  } else {
    const aggregation = [];
    aggregation.push({
      $match: {
        email: req.user.email,
        status: "pending",
      },
    });
    aggregation.push({
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "userId",
        as: "senderDetails",
      },
    });
    aggregation.push({
      $unwind: "$senderDetails",
    });
    aggregation.push({
      $project: {
        _id: 1,
        name: 1,
        relationship: 1,
        status: 1,
        senderDetails: {
          name: "$senderDetails.name",
          email: "$senderDetails.email",
          mobile: "$senderDetails.mobile",
          profile_image: {
            $ifNull: [
              "$senderDetails.profile_image",
              `${req.protocol}://${req.hostname}:${process.env.PORT}/placeholder/person.png`,
            ],
          },
        },
      },
    });

    const familyMemberRequests =
      await FamilyMemberRequest.aggregate(aggregation);

    res.json(
      new ApiResponse(
        200,
        familyMemberRequests.length > 0
          ? "Family member requests fetched successfully"
          : "No family member requests found",
        familyMemberRequests
      )
    );
  }
});

export const acceptFamilyMemberRequest = asyncHandler(async (req, res) => {
  const { requestId, status } = req.body;
  if (!isValidObjectId(requestId)) {
    throw new ApiError(400, "Invalid request ID format");
  }

  const familyMemberRequestExists = await FamilyMemberRequest.find({
    _id: requestId,
    status: "pending",
  });

  if (!familyMemberRequestExists.length > 0) {
    throw new ApiError(404, "Family member request not found");
  }

  let familyMemberRequest = null;

  if (status === "accepted") {
    const getFamilyRequest = await FamilyMemberRequest.findById(requestId);
    if (!getFamilyRequest) {
      throw new ApiError(404, "Family member request not found");
    }

 
    const hierarchyLevel1 = getHierarchyLevel(getFamilyRequest.relationship);

    // requested family member added to family member List
    const addFamilyMember = await FamilyMember.create({
      userId: getFamilyRequest.userId,
      relationship: getFamilyRequest.relationship,
      relationWithUserId: req.user.userId,
      hierarchyLevel: hierarchyLevel1,
    });

    const relation = getRelatedRelation(
      getFamilyRequest.relationship,
      req.user.gender
    );

    const hierarchyLevel2 = getHierarchyLevel(relation);
    // add the family member to accepted user family List
    const addFamilyMemberToUser = await FamilyMember.create({
      userId: req.user.userId,
      relationship: relation,
      relationWithUserId: getFamilyRequest.userId,
      hierarchyLevel: hierarchyLevel2,
    });

    // update the request status to accepted

    getFamilyRequest.status = "accepted";
    await getFamilyRequest.save();

    familyMemberRequest = getFamilyRequest;
  } else {
    familyMemberRequest = await FamilyMemberRequest.findByIdAndUpdate(
      requestId,
      { status },
      { new: true }
    );
  }

  res.json(
    new ApiResponse(
      200,
      "Family member request updated successfully",
      familyMemberRequest
    )
  );
});

export const getFamilyTree = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const aggregation = [];
  aggregation.push({
    $match: {
      userId,
    },
  });
  aggregation.push({
    $lookup: {
      from: "users",
      localField: "relationWithUserId",
      foreignField: "userId",
      as: "relationWithUserDetails",
    },
  });
  aggregation.push({
    $unwind: "$relationWithUserDetails",
  });
  aggregation.push({
    $sort: {
      hierarchyLevel: 1,
    },
  });
  aggregation.push({
    $project: {
      relationship: 1,
      relationWithUserId: 1,
      userId: 1,
      name: "$relationWithUserDetails.name",
      email: "$relationWithUserDetails.email",
      mobile: "$relationWithUserDetails.mobile",
      profile_image: {
        $ifNull: [
          "$relationWithUserDetails.profile_image",
          `${req.protocol}://${req.hostname}:${process.env.PORT}/placeholder/person.png`,
        ],
      },
    },
  });

  const familyTree = await FamilyMember.aggregate(aggregation);

  res.json(
    new ApiResponse(200, "Family tree fetched successfully", familyTree)
  );
});
