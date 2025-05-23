import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import HealthWellnessModel from "../models/health_wellness.model.js";
import { saveCompressedImage } from "../utils/awsS3Utils.js";
import fs from "fs";
import { ApiResponse } from "../utils/ApiResponse.js";
import { isValidObjectId } from "../utils/isValidObjectId.js";
import mongoose from "mongoose";
import { title } from "process";

export const addResources = asyncHandler(async (req, res) => {
  const { title, description, location } = req.body;

  const userId = req.user.userId;

  let resourceImage = null;
  if (req.files && req.files?.resourceImage) {
    const file = req.files.resourceImage[0];
    const saveUpload = await saveCompressedImage(file, 600);
    if (!saveUpload.success) {
      throw new ApiError(400, "Image upload failed");
    } else {
      resourceImage = saveUpload.thumbnailUrl;
    }
    fs.unlinkSync(file.path);
  }

  const resource = await HealthWellnessModel.create({
    userId,
    title,
    description,
    location,
    resourceImage,
  });

  res.json(new ApiResponse(200, "Resource added successfully", resource));
});

export const upsertResource = asyncHandler(async (req, res) => {
  const { id, title, description, location } = req.body;

  if (id && !isValidObjectId(id)) {
    throw new ApiError(400, "Invalid resource ID format");
  }

  const userId = req.user.userId;

  let resourceImage = null;

  if (req.files && req.files?.resourceImage) {
    const file = req.files.resourceImage[0];
    const saveUpload = await saveCompressedImage(file, 600);
    if (!saveUpload.success) {
      throw new ApiError(400, "Image upload failed");
    } else {
      resourceImage = saveUpload.thumbnailUrl;
    }
    fs.unlinkSync(file.path);
  } else {
    resourceImage = null;
  }

  const updateData = {
    userId,
    title,
    description,
    location,
    resourceImage,
  };

  const resource = await HealthWellnessModel.findByIdAndUpdate(
    id || new mongoose.Types.ObjectId(),
    { $set: updateData },
    { new: true, upsert: true }
  );

  res.json(new ApiResponse(200, "Resource updated successfully", resource));
});

export const getResources = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const aggregation = [];
  if (req.query.userId) {
    aggregation.push({
      $match: { userId: req.query.userId },
    });
  } else {
    aggregation.push({
      $match: { userId: { $ne: req.user.userId } },
    });
  }
  aggregation.push({
    $sort: { createdAt: -1 },
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
    $facet: {
      jobs: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            "user.name": 1,
            "user.profile_image": 1,
            "user.userId": 1,
            title: 1,
            description: 1,
            location: 1,
            resourceImage: 1,
          },
        },
      ],
      totalCount: [{ $count: "count" }],
    },
  });

  const result = await HealthWellnessModel.aggregate(aggregation);

  const resources = result[0]?.jobs || [];
  const totalCount = result[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  res.json(
    new ApiResponse(
      200,
      resources.length > 0
        ? "Resources fetched successfully"
        : "No resources found",
      resources.length > 0
        ? {
            resources,
            total_page: totalPages,
            current_page: page,
            total_records: totalCount,
            per_page: limit,
          }
        : null
    )
  );
});

export const getResourcesDetails = asyncHandler(async (req, res) => {
  const { resourceId } = req.query;
    if (!resourceId) {
        throw new ApiError(400, "Resource ID is required");
    }
    if (!isValidObjectId(resourceId)) {
        throw new ApiError(400, "Invalid resource ID format");
    }
    const resource = await HealthWellnessModel.findById(resourceId).select("-__v ");
    res.json(
        new ApiResponse(
            200,
            resource ? "Resource details fetched successfully" : "Resource not found",
            resource
        )
    );
});
