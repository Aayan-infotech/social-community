import mongoose from "mongoose";
import BusinessCategory from "../models/nearByBussinessCategory.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteObject, uploadImage } from "../utils/awsS3Utils.js";
import { isValidObjectId } from "../utils/isValidObjectId.js";
import Business from "../models/business.model.js";

const upsertBussinessCategory = asyncHandler(async (req, res) => {
  const { id, category_name } = req.body;
  const userId = req.user.userId;

  let category_image = "";
  if (req.files && req.files.category_image) {
    const businessCategory = await BusinessCategory.findById(id);
    if (businessCategory && businessCategory.category_image) {
      const deleteImage = await deleteObject(businessCategory.category_image);
      if (!deleteImage) {
        throw new ApiError(500, "Failed to delete old image");
      }
    }

    const file = req.files.category_image[0];
    const saveUpload = await uploadImage(file);
    if (!saveUpload.success) {
      throw new ApiError(500, "Failed to upload image");
    }
    category_image = saveUpload?.fileUrl;
  }

  let updateData = {
    category_name,
    category_image,
    userId,
  };

  const businessCategory = await BusinessCategory.findByIdAndUpdate(
    id || new mongoose.Types.ObjectId(),
    { $set: updateData },
    { new: true, upsert: true }
  );

  res.json(
    new ApiResponse(
      200,
      "Business category updated successfully",
      businessCategory
    )
  );
});

const getBusinessCategory = asyncHandler(async (req, res) => {
  const {search} = req.query;

  const businessCategory = await BusinessCategory.find({
    category_name: { $regex: search, $options: "i" },
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

export {
  upsertBussinessCategory,
  getBusinessCategory,
  addBusiness,
  getBusiness,
  updateBusinessStatus,
  getNearByBusiness,
};
