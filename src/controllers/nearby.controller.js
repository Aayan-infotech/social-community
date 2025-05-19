import mongoose from "mongoose";
import BusinessCategory from "../models/nearByBussinessCategory.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteObject, uploadImage } from "../utils/awsS3Utils.js";
import { isValidObjectId } from "../utils/isValidObjectId.js";
import Business from "../models/business.model.js";
import { UserDefinedMessageInstance } from "twilio/lib/rest/api/v2010/account/call/userDefinedMessage.js";

const upsertBussinessCategory = asyncHandler(async (req, res) => {
  const { id, category_name } = req.body;
  const userId = req.user.userId;

  let category_image = "";

  let existingCategory = null;
  if (id) {
    if (!isValidObjectId(id)) {
      throw new ApiError(400, "Invalid category ID");
    }

    existingCategory = await BusinessCategory.findById(id);
    if (!existingCategory) {
      throw new ApiError(404, "Business category not found");
    }
  }

  if (req.files && req.files.category_image) {
    if (existingCategory && existingCategory.category_image) {
      const deleted = await deleteObject(existingCategory.category_image);
      if (!deleted) {
        throw new ApiError(500, "Failed to delete old image");
      }
    }

    const file = req.files.category_image[0];
    const uploaded = await uploadImage(file);
    if (!uploaded.success) {
      throw new ApiError(500, "Failed to upload image");
    }

    category_image = uploaded.fileUrl;
  } else {
    category_image = existingCategory?.category_image || "";
  }

  const updateData = {
    category_name,
    category_image,
    userId,
  };

  const updatedCategory = await BusinessCategory.findByIdAndUpdate(
    id || new mongoose.Types.ObjectId(),
    { $set: updateData },
    { new: true, upsert: true }
  );

  res.json(
    new ApiResponse(
      200,
      id
        ? "Business category updated successfully"
        : "Business category created successfully",
      updatedCategory
    )
  );
});

const getBusinessCategory = asyncHandler(async (req, res) => {
  const { search } = req.query;

  const businessCategory = await BusinessCategory.find({
    category_name: { $regex: search ? search : "", $options: "i" },
  }).select("-__v -userId");
  if (!businessCategory) {
    throw new ApiError(404, "No business category found");
  }
  res.json(
    new ApiResponse(
      200,
      "Business category fetched successfully",
      businessCategory
    )
  );
});

const addBusiness = asyncHandler(async (req, res) => {
  const {
    categoryId,
    businessName,
    address,
    latitude,
    longitude,
    description,
  } = req.body;

  if (!isValidObjectId(categoryId)) {
    throw new ApiError(400, "Invalid category ID");
  }

  const userId = req.user.userId;

  const businessImages = [];
  if (req.files && req.files.businessImages) {
    for (let i = 0; i < req.files.businessImages.length; i++) {
      const file = req.files.businessImages[i];
      const saveUpload = await uploadImage(file);
      if (!saveUpload.success) {
        throw new ApiError(500, "Failed to upload image");
      }
      businessImages.push(saveUpload.fileUrl);
    }
  }

  const business = new Business({
    categoryId,
    businessName,
    address,
    latitude,
    longitude,
    location: {
      type: "Point",
      coordinates: [longitude, latitude],
    },
    description,
    userId,
    businessImage: businessImages,
  });

  await business.save();

  res.json(new ApiResponse(201, "Business added successfully", business));
});

const getBusiness = asyncHandler(async (req, res) => {
  const { categoryId } = req.query;

  if (!isValidObjectId(categoryId)) {
    throw new ApiError(400, "Invalid category ID");
  }
  const business = await Business.find({ categoryId, status: true }).select(
    "-__v -userId -location -createdAt -updatedAt"
  );
  if (business.length === 0) {
    throw new ApiError(404, "No business found");
  }

  res.json(new ApiResponse(200, "Business fetched successfully", business));
});

const getAllBussinesses = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;
  const { search } = req.query;

  const aggregation = [];

  if (search) {
    aggregation.push({
      $match: {
        businessName: { $regex: search, $options: "i" },
      },
    });
  }

  aggregation.push({
    $lookup: {
      from: "businesscategories",
      localField: "categoryId",
      foreignField: "_id",
      as: "category",
    },
  });
  aggregation.push({
    $unwind: {
      path: "$category",
      preserveNullAndEmptyArrays: true,
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
    $unwind: {
      path: "$user",
      preserveNullAndEmptyArrays: true,
    },
  });


  aggregation.push({
    $facet: {
      totalCount: [{ $count: "count" }],
      businesses: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            businessName: 1,
            address: 1,
            latitude: 1,
            longitude: 1,
            description: 1,
            status: 1,
            businessImage: 1,
            categoryId: 1,
            category_name: "$category.category_name",
            userName : "$user.name",
          },
        },
      ],
    },
  });

  const result = await Business.aggregate(aggregation);

  const businesses = result[0]?.businesses || [];
  const totalCount = result[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  res.json(
    new ApiResponse(
      200,
      businesses.length ? "Home Feed fetched successfully" : "No Home Feed found",
      {
        businesses,
        total_page: totalPages,
        current_page: page,
        total_records: totalCount,
        per_page: limit,
      }
    )
  );
});

const updateBusinessStatus = asyncHandler(async (req, res) => {
  const { businessId, status } = req.body;
  if (!isValidObjectId(businessId)) {
    throw new ApiError(400, "Invalid business ID");
  }
  const business = await Business.findById(businessId);
  if (!business) {
    throw new ApiError(404, "Business not found");
  }
  business.status = status;
  await business.save();
  res.json(
    new ApiResponse(200, "Business status updated successfully", business)
  );
});

const getNearByBusiness = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude) {
    throw new ApiError(400, "Latitude and longitude are required");
  }

  const businesses = await Business.find({
    status: true,
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
        $maxDistance: 10000, // 10 km
      },
    },
  }).select("-__v -userId -location -createdAt -updatedAt");

  console.log("business", businesses);

  if (businesses.length === 0) {
    throw new ApiError(404, "No business found");
  }

  res.json(
    new ApiResponse(200, "Nearby business fetched successfully", businesses)
  );
});

const deleteBussinessCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid Bussiness Category Id");
  }

  const deleted = await BusinessCategory.findByIdAndDelete(id);
  if (!deleted) {
    throw new ApiError(404, "Business category not found");
  }

  res.json(
    new ApiResponse(200, "Business category deleted successfully", deleted)
  );
});

export {
  upsertBussinessCategory,
  getBusinessCategory,
  addBusiness,
  getBusiness,
  updateBusinessStatus,
  getNearByBusiness,
  deleteBussinessCategory,
  getAllBussinesses,
};
