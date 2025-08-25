import mongoose from "mongoose";
import InterestCategoryList from "../models/InterestCategoryList.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId } from "../utils/isValidObjectId.js";
import InterestList from "../models/InterestList.model.js";


export const addInterestCategory = asyncHandler(async (req, res) => {
    const { category, type } = req.body;

    // Check if the interest already exists
    const existingInterest = await InterestCategoryList.findOne({ name: category, type });
    if (existingInterest) {
        throw new ApiError(400, "Interest category already exists");
    }

    const newInterest = await InterestCategoryList.create({
        category,
        type
    });


    return res.json(new ApiResponse(200, "Interest category added successfully", newInterest));
});


export const addInterest = asyncHandler(async (req, res) => {
    const { name, categoryId } = req.body;

    if (!isValidObjectId(categoryId)) {
        throw new ApiError(400, "Invalid category ID");
    }

    // Check 
    const existingCategory = await InterestCategoryList.findById({ _id: new mongoose.Types.ObjectId(categoryId) });
    
    if (!existingCategory) {
        throw new ApiError(400, "Please select Category");
    }

    // Check if the interest already exists
    const existingInterest = await InterestList.findOne({ name, categoryId: existingCategory._id });
    if (existingInterest) {
        throw new ApiError(400, "Interest already exists");
    }

    const newInterest = await InterestList.create({
        name,
        categoryId: existingCategory._id,
        type: existingCategory.type
    });

    return res.json(new ApiResponse(200, "Interest added successfully", newInterest));
});


export const getInterestList = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    if (!isValidObjectId(categoryId)) {
        throw new ApiError(400, "Invalid category ID");
    }


    const aggregation = [];
    aggregation.push({
        $match: {
            categoryId: new mongoose.Types.ObjectId(categoryId)
        }
    });

    const interests = await InterestList.aggregate(aggregation);
    return res.json(new ApiResponse(200, "Interest list fetched successfully", interests));
});


export const getInterestCategoryList = asyncHandler(async (req, res) => {
    const categories = await InterestCategoryList.find();
    return res.json(new ApiResponse(200, "Interest categories fetched successfully", categories));
});

