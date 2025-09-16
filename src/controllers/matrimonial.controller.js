import matrimonialProfilesModel from "../models/matrimonialProfiles.model.js";
import Religion from "../models/community.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadImage } from "../utils/awsS3Utils.js";
import Community from "../models/community.model.js";
import SubCommunity from "../models/subCommunity.model.js";
import College from "../models/college.model.js";
import Company from "../models/companies.model.js";
import Degree from "../models/degree.model.js";
import Position from "../models/positions.model.js";

export const addMatrimonialProfile = asyncHandler(async (req, res) => {
    const { profileFor, gender, name, age, dob, mobileNo, email, religion, community, livingIn, marryInOtherCaste, maritalStatus, noOfChildren, diet, height, weight, state, city, subCommunity, disability, highestQualification, college, workWith, workAs, annualIncome, workLocation, about } = req.body;

    const createdBy = req.user.userId;


    // Check if a profile already exists for the user
    const existingProfile = await matrimonialProfilesModel.findOne({ createdBy, profileFor, name });
    if (existingProfile) {
        throw new ApiError(400, "A profile with the same details already exists.");
    }



    if (community) {
        let communityDoc = await Community.findOne({ name: community.trim() });

        if (!communityDoc) {
            const newCommunity = new Community({
                religion: religion.trim(),
                name: community.trim()
            });
            await newCommunity.save();
            communityDoc = newCommunity;
        }

        const communityId = communityDoc._id;
        if (!communityId) {
            throw new ApiError(400, "Please add community before adding sub-community");
        }
        if (subCommunity) {
            const subCommunityDoc = await SubCommunity.updateOne(
                { name: subCommunity.trim(), community: communityId },
                { $setOnInsert: { name: subCommunity.trim(), community: communityId } },
                { upsert: true }
            );
        }
    }

    if (college) {
        const collegeDoc = await College.updateOne(
            { name: college.trim() },
            { $setOnInsert: { name: college.trim() } },
            { upsert: true }
        );
    }

    if (workWith) {
        const workWithDoc = await Company.updateOne(
            { name: workWith.trim() },
            { $setOnInsert: { name: workWith.trim() } },
            { upsert: true }
        );
    }

    if (highestQualification) {
        const highestQualificationDoc = await Degree.updateOne(
            { name: highestQualification.trim() },
            { $setOnInsert: { name: highestQualification.trim() } },
            { upsert: true }
        );
    }

    if (workAs) {
        const workAsDoc = await Position.updateOne(
            { name: workAs.trim() },
            { $setOnInsert: { name: workAs.trim() } },
            { upsert: true }
        );
    }

    const newProfile = {
        profileFor,
        gender,
        name,
        age,
        dob,
        mobileNo,
        email,
        religion,
        community,
        livingIn,
        marryInOtherCaste,
        maritalStatus,
        noOfChildren,
        diet,
        height,
        weight,
        state,
        city,
        subCommunity,
        disability,
        highestQualification,
        college,
        workWith,
        workAs,
        annualIncome,
        workLocation,
        about,
        createdBy
    };
    if (req.files && req.files.profilePicture) {
        newProfile.profilePicture = await Promise.all(
            req.files.profilePicture.map(async (file) => {
                const filePath = await uploadImage(file);
                if (!filePath.success) {
                    throw new ApiError(500, "Failed to upload image");
                }
                return filePath.fileUrl;
            })
        );
    }


    const createdProfile = await matrimonialProfilesModel.create(newProfile);
    return res.json(new ApiResponse(201, "Matrimonial profile created successfully", createdProfile));
});

export const getCommunities = asyncHandler(async (req, res) => {
    const religion = req.query.religion;
    if (!religion) {
        throw new ApiError(400, "Religion query parameter is required");
    }
    if (!['hindu', 'muslim', 'christian', 'sikh', 'jain', 'buddhist', 'parsi', 'others'].includes(religion.trim().toLowerCase())) {
        throw new ApiError(400, "Invalid religion. Accepted values are: hindu, muslim, christian, sikh, jain, buddhist, parsi, others");
    }
    const communities = await Community.find({ religion: religion.trim() }).select('name _id').lean();
    return res.json(new ApiResponse(200, "Communities fetched successfully", communities));
});


export const getSubCommunities = asyncHandler(async (req, res) => {
    const communityId = req.params.communityId;
    if (!communityId) {
        throw new ApiError(400, "communityId query parameter is required");
    }
    const subCommunities = await SubCommunity.find({ community: communityId }).select('name _id').lean();
    return res.json(new ApiResponse(200, "Sub-Communities fetched successfully", subCommunities));
});


export const getDegrees = asyncHandler(async (req, res) => {
    const degrees = await Degree.find().select('name _id').lean();
    return res.json(new ApiResponse(200, "Degrees fetched successfully", degrees));
});

export const getColleges = asyncHandler(async (req, res) => {
    const colleges = await College.find().select('name _id').lean();
    return res.json(new ApiResponse(200, "Colleges fetched successfully", colleges));
});

export const getCompanies = asyncHandler(async (req, res) => {
    const companies = await Company.find().select('name _id').lean();
    return res.json(new ApiResponse(200, "Companies fetched successfully", companies));
});
export const getPositions = asyncHandler(async (req, res) => {
    const positions = await Position.find().select('name _id').lean();
    return res.json(new ApiResponse(200, "Positions fetched successfully", positions));
});

export const getAllProfiles = asyncHandler(async (req, res) => {
    const page = Math.max(0, parseInt(req.query.page)) || 1;
    const limit = Math.max(1, parseInt(req.query.limit)) || 10;
    const skip = (page - 1) * limit;


    const aggregation = [];
    aggregation.push({
        $match: {
            createdBy: req.user.userId
        }
    });
    aggregation.push({ $sort: { createdAt: -1 } });
    aggregation.push({
        $facet: {
            profiles: [
                { $skip: skip },
                { $limit: limit },
                {
                    $project: {
                        name: 1,
                        age: 1,
                        gender: 1,
                        location: 1,
                        profilePicture: 1
                    },
                },
            ],
            totalCount: [{ $count: "count" }],
        }
    });

    const result = await matrimonialProfilesModel.aggregate(aggregation);

    const profiles = result[0]?.profiles || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    res.json(
        new ApiResponse(
            200,
            profiles.length > 0 ? "Profiles fetched successfully" : "No profiles found",
            profiles.length > 0
                ? {
                    profiles,
                    total_page: totalPages,
                    current_page: page,
                    total_records: totalCount,
                    per_page: limit,
                }
                : null
        )
    );

});


export const getProfileById = asyncHandler(async (req, res) => {
    const profileId = req.params.profileId;
    if (!profileId || profileId.trim() === "") {
        throw new ApiError(400, "profileId parameter is required");
    }

    const profile = await matrimonialProfilesModel.findOne({ _id: profileId, createdBy: req.user.userId }).lean();
    if (!profile) {
        throw new ApiError(404, "Profile not found");
    }
    return res.json(new ApiResponse(200, "Profile fetched successfully", profile));
});


export const addIndentyProofDocument = asyncHandler(async (req, res) => {
    const { documentName, documentNumber } = req.body;
    const profileId = req.params.profileId;
    if (!profileId || profileId.trim() === "") {
        throw new ApiError(400, "profileId parameter is required");
    }

    const profile = await matrimonialProfilesModel.findOne({ _id: profileId, createdBy: req.user.userId });
    if (!profile) {
        throw new ApiError(404, "Profile not found");
    }

    if (!req.files || !req.files.identityProofDocument) {
        throw new ApiError(400, "identityProofDocument file is required");
    }


    const uploadedFiles = await Promise.all(
        req.files.identityProofDocument.map(async (file) => {
            const filePath = await uploadImage(file);
            if (!filePath.success) {
                throw new ApiError(500, "Failed to upload image");
            }
            return filePath.fileUrl;
        })
    );

    profile.identityProof = uploadedFiles[0]; 
    profile.isVerified = false;
    profile.documentName = documentName;
    profile.documentNumber = documentNumber;
    await profile.save();

    return res.json(new ApiResponse(200, "Identity proof document added successfully", profile));


});

export const addFamilyDetails = asyncHandler(async (req, res) => {
    const {fatherName, motherName, noOfBrother,noOfSister,livedWithFamily,financialStatus} = req.body;
    const profileId = req.params.profileId;
    if (!profileId || profileId.trim() === "") {
        throw new ApiError(400, "profileId parameter is required");
    }

    throw new ApiError(500, "Not implemented yet");

    
});