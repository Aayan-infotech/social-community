import mongoose from "mongoose";
import InterestCategoryList from "../models/InterestCategoryList.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId } from "../utils/isValidObjectId.js";
import InterestList from "../models/interestList.model.js";
import UserInterest from "../models/userInterest.model.js";



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


export const getInterestCategory = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const { search, sortBy, sortOrder, type } = req.query;
    const aggregation = [];

    const role = req.user.role;

    if (!role.includes("admin")) {
        throw new ApiError(403, "You are not authorized to access this resource");
    }

    if (search) {
        aggregation.push({
            $match: {
                $or: [
                    { category: { $regex: search, $options: "i" } },
                    { type: { $regex: search, $options: "i" } }
                ]
            }
        })
    }

    if (type) {
        aggregation.push({
            $match: {
                type: type
            }
        });
    }

    aggregation.push({
        $sort: {
            [sortBy]: sortOrder === "desc" ? -1 : 1
        }
    });


    aggregation.push({
        $facet: {
            interestsCategories: [
                { $skip: skip },
                { $limit: limit },
                {
                    $project: {
                        _id: 1,
                        category: 1,
                        type: 1
                    }
                }
            ],
            totalCount: [{ $count: "count" }],
        }
    });

    const result = await InterestCategoryList.aggregate(aggregation);

    const interestsCategories = result[0]?.interestsCategories || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    res.json(
        new ApiResponse(
            200,
            interestsCategories.length ? "Interest categories fetched successfully" : "No interest categories found",
            {
                interestsCategories,
                total_page: totalPages,
                current_page: page,
                total_records: totalCount,
                per_page: limit,
            }
        )
    );
});

export const updateInterestCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { category, type } = req.body;

    if (!isValidObjectId(id)) {
        throw new ApiError(400, "Invalid category ID");
    }

    const existingCategory = await InterestCategoryList.findById(id);
    if (!existingCategory) {
        throw new ApiError(404, "Category not found");
    }

    // check the same category and type
    const duplicateCategory = await InterestCategoryList.findOne({ category, type });
    if (duplicateCategory && duplicateCategory._id.toString() !== id) {
        throw new ApiError(400, "Category with the same name and type already exists");
    }

    existingCategory.category = category;
    existingCategory.type = type;

    await existingCategory.save();

    return res.json(new ApiResponse(200, "Interest category updated successfully", existingCategory));
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

export const getInterests = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const { search, sortBy, sortOrder, type, category } = req.query;

    const aggregation = [];

    aggregation.push({
        $lookup: {
            from: "interestcategorylists",
            localField: "categoryId",
            foreignField: "_id",
            as: "category"
        }
    });

    aggregation.push({
        $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true
        }
    });

    if (search) {
        aggregation.push({
            $match: {
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { "category.category": { $regex: search, $options: "i" } },
                    { type: { $regex: search, $options: "i" } }
                ]
            }
        });
    }

    if (type) {
        aggregation.push({
            $match: {
                type: { $regex: type, $options: "i" }
            }
        });
    }

    if (category) {
        aggregation.push({
            $match: {
                "category.category": { $regex: category, $options: "i" }
            }
        });
    }

    aggregation.push({
        $sort: {
            [sortBy]: sortOrder === "desc" ? -1 : 1
        }
    });

    aggregation.push({
        $facet: {
            interests: [
                { $skip: skip },
                { $limit: limit },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        category: "$category.category",
                        type: 1
                    }
                }
            ],
            totalCount: [
                { $count: "count" }
            ]
        }
    });


    const result = await InterestList.aggregate(aggregation);

    const interests = result[0]?.interests || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    res.json(
        new ApiResponse(
            200,
            interests.length ? "Interests fetched successfully" : "No interests found",
            {
                interests,
                total_page: totalPages,
                current_page: page,
                total_records: totalCount,
                per_page: limit,
            }
        )
    );

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
    const type = req.query.type || "social";
    const categories = await InterestCategoryList.find({ type });
    return res.json(new ApiResponse(200, "Interest categories fetched successfully", categories));
});



export const addUserInterest = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { categoryId, interestIds } = req.body;

    if (!isValidObjectId(categoryId)) {
        throw new ApiError(400, "Invalid category ID");
    }

    const category = await InterestCategoryList.findById(categoryId);
    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    if (!Array.isArray(interestIds) || interestIds.length === 0) {
        throw new ApiError(400, "At least one interest must be provided");
    }

    const validInterestIds = [];
    for (const interestId of interestIds) {
        if (!isValidObjectId(interestId)) {
            throw new ApiError(400, `Invalid interest ID: ${interestId}`);
        }
        const interest = await InterestList.findById(interestId);
        if (!interest) {
            throw new ApiError(404, `Interest not found: ${interestId}`);
        }
        validInterestIds.push(interest._id);
    }

    await UserInterest.deleteMany({ userId, categoryId });

    const newUserInterests = validInterestIds.map(interestId => ({
        userId,
        categoryId,
        interestId
    }));

    const savedInterests = await UserInterest.insertMany(newUserInterests);

    return res.json(new ApiResponse(200, "User interests added successfully", savedInterests));
});
