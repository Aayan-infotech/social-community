import matrimonialProfilesModel from "../models/matrimonialProfiles.model.js";
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
import { Country, State, City } from "country-state-city";
import Hobby from "../models/hobbies.model.js";
import InterestInProfileModel from "../models/matrimonialProfileInterest.model.js";
import mongoose from "mongoose";

export const addMatrimonialProfile = asyncHandler(async (req, res) => {
  const {
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
  } = req.body;

  const createdBy = req.user.userId;

  // Check if a profile already exists for the user
  const existingProfile = await matrimonialProfilesModel.findOne({
    $or: [
      { createdBy, profileFor, name },
      { email },
      { mobileNo },
    ],
  });
  if (existingProfile) {
    throw new ApiError(400, "A profile with the same details already exists.");
  }


  if (community) {
    let communityDoc = await Community.findOne({ name: community.trim() });

    if (!communityDoc) {
      const newCommunity = new Community({
        religion: religion.trim(),
        name: community.trim(),
      });
      await newCommunity.save();
      communityDoc = newCommunity;
    }

    const communityId = communityDoc._id;
    if (!communityId) {
      throw new ApiError(
        400,
        "Please add community before adding sub-community"
      );
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
    createdBy,
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
  return res.json(
    new ApiResponse(
      201,
      "Matrimonial profile created successfully",
      createdProfile
    )
  );
});

export const getCommunities = asyncHandler(async (req, res) => {
  const religion = req.query.religion;
  if (!religion) {
    throw new ApiError(400, "Religion query parameter is required");
  }
  if (
    ![
      "hindu",
      "muslim",
      "christian",
      "sikh",
      "jain",
      "buddhist",
      "parsi",
      "others",
    ].includes(religion.trim().toLowerCase())
  ) {
    throw new ApiError(
      400,
      "Invalid religion. Accepted values are: hindu, muslim, christian, sikh, jain, buddhist, parsi, others"
    );
  }
  const communities = await Community.find({ religion: religion.trim() })
    .select("name _id")
    .lean();
  return res.json(
    new ApiResponse(200, "Communities fetched successfully", communities)
  );
});

export const getSubCommunities = asyncHandler(async (req, res) => {
  const communityId = req.params.communityId;
  if (!communityId) {
    throw new ApiError(400, "communityId query parameter is required");
  }
  const subCommunities = await SubCommunity.find({ community: communityId })
    .select("name _id")
    .lean();
  return res.json(
    new ApiResponse(200, "Sub-Communities fetched successfully", subCommunities)
  );
});

export const getDegrees = asyncHandler(async (req, res) => {
  const degrees = await Degree.find().select("name _id").lean();
  return res.json(
    new ApiResponse(200, "Degrees fetched successfully", degrees)
  );
});

export const getColleges = asyncHandler(async (req, res) => {
  const colleges = await College.find().select("name _id").lean();
  return res.json(
    new ApiResponse(200, "Colleges fetched successfully", colleges)
  );
});

export const getCompanies = asyncHandler(async (req, res) => {
  const companies = await Company.find().select("name _id").lean();
  return res.json(
    new ApiResponse(200, "Companies fetched successfully", companies)
  );
});
export const getPositions = asyncHandler(async (req, res) => {
  const positions = await Position.find().select("name _id").lean();
  return res.json(
    new ApiResponse(200, "Positions fetched successfully", positions)
  );
});

export const getAllProfiles = asyncHandler(async (req, res) => {
  const page = Math.max(0, parseInt(req.query.page)) || 1;
  const limit = Math.max(1, parseInt(req.query.limit)) || 10;
  const skip = (page - 1) * limit;

  const aggregation = [];
  aggregation.push({
    $match: {
      createdBy: req.user.userId,
    },
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
            profileFor: 1,
            age: 1,
            gender: 1,
            location: 1,
            profilePicture: 1,
          },
        },
      ],
      totalCount: [{ $count: "count" }],
    },
  });

  const result = await matrimonialProfilesModel.aggregate(aggregation);

  const profiles = result[0]?.profiles || [];
  const totalCount = result[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  res.json(
    new ApiResponse(
      200,
      profiles.length > 0
        ? "Profiles fetched successfully"
        : "No profiles found",
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

  const profile = await matrimonialProfilesModel
    .findOne({ _id: profileId })
    .lean();
  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }
  return res.json(
    new ApiResponse(200, "Profile fetched successfully", profile)
  );
});

export const addIndentyProofDocument = asyncHandler(async (req, res) => {
  const { documentName, documentNumber } = req.body;
  const profileId = req.params.profileId;
  if (!profileId || profileId.trim() === "") {
    throw new ApiError(400, "profileId parameter is required");
  }

  const profile = await matrimonialProfilesModel.findOne({
    _id: profileId,
    createdBy: req.user.userId,
  });
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

  return res.json(
    new ApiResponse(200, "Identity proof document added successfully", profile)
  );
});

export const addFamilyDetails = asyncHandler(async (req, res) => {
  const {
    fatherName,
    motherName,
    noOfBrothers,
    noOfSisters,
    livedWithFamily,
    financialStatus,
  } = req.body;
  const profileId = req.params.profileId;
  if (!profileId || profileId.trim() === "") {
    throw new ApiError(400, "profileId parameter is required");
  }

  const profile = await matrimonialProfilesModel.findById({ _id: profileId });
  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  profile.familyDetails = {
    fatherName,
    motherName,
    noOfBrothers,
    noOfSisters,
    livedWithFamily,
    financialStatus,
  };
  await profile.save();

  return res.json(
    new ApiResponse(
      200,
      "Family details added successfully",
      profile.familyDetails
    )
  );
});

export const updateMatrimonialProfile = asyncHandler(async (req, res) => {
  const {
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
    documentName,
    documentNumber,
    fatherName,
    motherName,
    noOfBrothers,
    noOfSisters,
    livedWithFamily,
    financialStatus,
  } = req.body;
  const profileId = req.params.profileId;
  if (!profileId || profileId.trim() === "") {
    throw new ApiError(400, "profileId parameter is required");
  }

  // update the matrimonial profile
  const profile = await matrimonialProfilesModel.findOne({
    _id: profileId,
    createdBy: req.user.userId,
  });
  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  // update profile picture if provided
  if (req.files && req.files.profilePicture) {
    profile.profilePicture = await Promise.all(
      req.files.profilePicture.map(async (file) => {
        const filePath = await uploadImage(file);
        if (!filePath.success) {
          throw new ApiError(500, "Failed to upload image");
        }
        return filePath.fileUrl;
      })
    );
  }
  if (req.files && req.files.identityProofDocument) {
    profile.identityProof = await Promise.all(
      req.files.identityProofDocument.map(async (file) => {
        const filePath = await uploadImage(file);
        if (!filePath.success) {
          throw new ApiError(500, "Failed to upload image");
        }
        return filePath.fileUrl;
      })
    )[0];
    profile.isVerified = false;
  }

  profile.profileFor = profileFor;
  profile.gender = gender;
  profile.name = name;
  profile.age = age;
  profile.dob = dob;
  profile.mobileNo = mobileNo;
  profile.email = email;
  profile.religion = religion;
  profile.community = community;
  profile.livingIn = livingIn;
  profile.marryInOtherCaste = marryInOtherCaste;
  profile.maritalStatus = maritalStatus;
  profile.noOfChildren = noOfChildren;
  profile.diet = diet;
  profile.height = height;
  profile.weight = weight;
  profile.state = state;
  profile.city = city;
  profile.subCommunity = subCommunity;
  profile.disability = disability;
  profile.highestQualification = highestQualification;
  profile.college = college;
  profile.workWith = workWith;
  profile.workAs = workAs;
  profile.annualIncome = annualIncome;
  profile.workLocation = workLocation;
  profile.about = about;
  profile.documentName = documentName;
  profile.documentNumber = documentNumber;
  profile.familyDetails = {
    fatherName,
    motherName,
    noOfBrothers,
    noOfSisters,
    livedWithFamily,
    financialStatus,
  };

  console.log(profile);
  await profile.save();

  return res.json(
    new ApiResponse(200, "Profile updated successfully", profile)
  );
});

export const getAllCountries = asyncHandler(async (req, res) => {
  const countries = Country.getAllCountries();
  const formattedCountries = countries.map((country) => ({
    name: country.name,
    isoCode: country.isoCode,
  }));
  return res.json(
    new ApiResponse(200, "Countries fetched successfully", formattedCountries)
  );
});

export const getStatesByCountry = asyncHandler(async (req, res) => {
  const countryIsoCode = req.params.countryCode;
  if (!countryIsoCode || countryIsoCode.trim() === "") {
    throw new ApiError(400, "countryIsoCode parameter is required");
  }

  const states = State.getStatesOfCountry(countryIsoCode);
  return res.json(new ApiResponse(200, "States fetched successfully", states));
});

export const getCitiesByState = asyncHandler(async (req, res) => {
  const countryCode = req.params.countryCode;
  const stateCode = req.params.stateCode;
  if (!countryCode || countryCode.trim() === "") {
    throw new ApiError(400, "countryCode parameter is required");
  }
  if (!stateCode || stateCode.trim() === "") {
    throw new ApiError(400, "stateCode parameter is required");
  }

  const cities = City.getCitiesOfState(countryCode, stateCode);
  return res.json(new ApiResponse(200, "Cities fetched successfully", cities));
});

export const getMatrimonialProfileSuggesstions = asyncHandler(
  async (req, res) => {
    const profileId = req.params.profileId;
    const {
      minAge,
      maxAge,
      minHeight,
      maxHeight,
      religion,
      community,
      location,
      maritalStatus,
      minIncome,
      maxIncome,
    } = req.query;
    const page = Math.max(1, parseInt(req.query.page)) || 1;
    const limit = Math.max(1, parseInt(req.query.limit)) || 10;
    const skip = (page - 1) * limit;

    // Validate profileId
    if (!profileId || profileId.trim() === "") {
      throw new ApiError(400, "profileId parameter is required");
    }

    // Get the profile details of the given profileId
    const profile = await matrimonialProfilesModel
      .findOne({ _id: profileId })
      .lean();
    if (!profile) {
      throw new ApiError(404, "Profile not found");
    }

    // Validate numeric inputs
    const parsedMinAge = minAge ? parseInt(minAge) : undefined;
    const parsedMaxAge = maxAge ? parseInt(maxAge) : undefined;
    const parsedMinHeight = minHeight ? parseFloat(minHeight) : undefined;
    const parsedMaxHeight = maxHeight ? parseFloat(maxHeight) : undefined;
    const parsedMinIncome = minIncome ? parseInt(minIncome) : undefined;
    const parsedMaxIncome = maxIncome ? parseInt(maxIncome) : undefined;
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);

    if (
      (parsedMinAge && isNaN(parsedMinAge)) ||
      (parsedMaxAge && isNaN(parsedMaxAge))
    ) {
      throw new ApiError(400, "Invalid age range provided");
    }
    if (
      (parsedMinHeight && isNaN(parsedMinHeight)) ||
      (parsedMaxHeight && isNaN(parsedMaxHeight))
    ) {
      throw new ApiError(400, "Invalid height range provided");
    }
    if (
      (parsedMinIncome && isNaN(parsedMinIncome)) ||
      (parsedMaxIncome && isNaN(parsedMaxIncome))
    ) {
      throw new ApiError(400, "Invalid income range provided");
    }
    if (isNaN(parsedPage) || parsedPage < 1) {
      throw new ApiError(400, "Invalid page number");
    }
    if (isNaN(parsedLimit) || parsedLimit < 1) {
      throw new ApiError(400, "Invalid limit value");
    }

    // Build aggregation pipeline
    const matchCriteria = {
      _id: { $ne: profileId },
      createdBy: { $ne: req.user.userId },
      gender: { $ne: profile.gender },
      // isVerified: true,
    };

    // Add filters dynamically
    if (parsedMinAge || parsedMaxAge) {
      matchCriteria.age = {};
      if (parsedMinAge) matchCriteria.age.$gte = parsedMinAge;
      if (parsedMaxAge) matchCriteria.age.$lte = parsedMaxAge;
    }

    if (parsedMinHeight || parsedMaxHeight) {
      matchCriteria.height = {};
      if (parsedMinHeight) matchCriteria.height.$gte = parsedMinHeight;
      if (parsedMaxHeight) matchCriteria.height.$lte = parsedMaxHeight;
    }

    if (parsedMinIncome || parsedMaxIncome) {
      matchCriteria.income = {};
      if (parsedMinIncome) matchCriteria.income.$gte = parsedMinIncome;
      if (parsedMaxIncome) matchCriteria.income.$lte = parsedMaxIncome;
    }

    if (religion) {
      matchCriteria.religion = religion;
    }

    if (profile.marryInOtherCaste === false && profile.community) {
      matchCriteria.community = profile.community;
    } else if (community) {
      matchCriteria.community = community;
    }

    if (location) {
      matchCriteria.location = location;
    }

    if (maritalStatus) {
      matchCriteria.maritalStatus = { $in: maritalStatus.split(",") };
    }

    const aggregation = [];
    aggregation.push({ $match: matchCriteria });
    aggregation.push({ $sort: { createdAt: -1 } });

    aggregation.push({
      $lookup: {
        from: "interestinprofiles",
        let: { receiverId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$senderId", new mongoose.Types.ObjectId(profileId)],
                  },
                  { $eq: ["$receiverId", "$$receiverId"] },
                ],
              },
            },
          },
          { $limit: 1 },
        ],
        as: "interestData",
      },
    });

    aggregation.push({
      $addFields: {
        isInterestSend: {
          $cond: [{ $gt: [{ $size: "$interestData" }, 0] }, true, false],
        },
      },
    });

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
              createdAt: 1,
              religion: 1,
              community: 1,
              profilePicture: 1,
              subCommunity: 1,
              height: 1,
              income: 1,
              maritalStatus: 1,
              isVerified: 1,
              isInterestSend: 1,
            },
          },
        ],
        totalCount: [{ $count: "count" }],
      },
    });

    const results = await matrimonialProfilesModel.aggregate(aggregation);
    const profiles = results[0]?.profiles || [];
    const totalCount = results[0]?.totalCount[0]?.count || 0;

    return res.json(
      new ApiResponse(
        200,
        "Matrimonial profile suggestions fetched successfully",
        {
          profiles: profiles,
          total_page: Math.ceil(totalCount / limit),
          current_page: page,
          total_records: totalCount,
          per_page: limit,
        }
      )
    );
  }
);

export const saveHobbies = asyncHandler(async (req, res) => {
  const profileId = req.params.profileId;
  const { hobbiesIds } = req.body;
  if (!profileId || profileId.trim() === "") {
    throw new ApiError(400, "profileId parameter is required");
  }
  if (!hobbiesIds || !Array.isArray(hobbiesIds) || hobbiesIds.length === 0) {
    throw new ApiError(400, "Please provide at least one hobby");
  }

  const hobbies = await Hobby.create({
    userId: req.user.userId,
    profileId,
    hobbiesIds,
  });
  return res.json(new ApiResponse(200, "Hobbies saved successfully", hobbies));
});

export const sendInterest = asyncHandler(async (req, res) => {
  const { receiverId } = req.body;
  const profileId = req.params.profileId;
  if (!profileId || profileId.trim() === "") {
    throw new ApiError(400, "profileId parameter is required");
  }

  const profile = await matrimonialProfilesModel.findById({ _id: profileId });
  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  // check if the receiver profile exists
  const aggregation = [];
  aggregation.push({
    $match: {
      $or: [
        {
          senderId: new mongoose.Types.ObjectId(profileId),
          receiverId: new mongoose.Types.ObjectId(receiverId),
        },
        {
          senderId: new mongoose.Types.ObjectId(receiverId),
          receiverId: new mongoose.Types.ObjectId(profileId),
        },
      ],
      status: { $in: ["pending", "accepted"] },
    },
  });

  const existingInterest = await InterestInProfileModel.aggregate(aggregation);
  if (existingInterest.length > 0) {
    throw new ApiError(
      400,
      "Interest already sent or received for this profile"
    );
  }

  const interest = await InterestInProfileModel.create({
    userId: req.user.userId,
    senderId: profileId,
    receiverId: receiverId,
    status: "pending",
  });

  return res.json(new ApiResponse(200, "Interest sent successfully", interest));
});

export const acceptRejectInterest = asyncHandler(async (req, res) => {
  const { interestId, action } = req.body;
  if (!interestId || interestId.trim() === "") {
    throw new ApiError(400, "interestId parameter is required");
  }
  if (!["accept", "reject"].includes(action)) {
    throw new ApiError(
      400,
      "Invalid action. Accepted values are: accept, reject"
    );
  }

  const interest = await InterestInProfileModel.findById(interestId);
  if (!interest) {
    throw new ApiError(404, "Interest not found");
  }

  if (interest.status !== "pending") {
    throw new ApiError(400, `Interest already ${interest.status}`);
  }
  interest.status = action === "accept" ? "accepted" : "rejected";
  await interest.save();

  return res.json(
    new ApiResponse(200, `Interest ${interest.status} successfully`, interest)
  );
});

export const getInterestedProfiles = asyncHandler(async (req, res) => {
  const profileId = req.params.profileId;
  if (!profileId || profileId.trim() === "") {
    throw new ApiError(400, "profileId parameter is required");
  }

  const page = Math.max(1, parseInt(req.query.page)) || 1;
  const limit = Math.max(1, parseInt(req.query.limit)) || 10;
  const skip = (page - 1) * limit;

  const { type } = req.query;
  if (!["send", "received", "accepted"].includes(type)) {
    throw new ApiError(
      400,
      "Invalid type. Accepted values are: send, received, accepted"
    );
  }

  const aggregation = [];

  // Match Stage
  if (type === "send") {
    aggregation.push({
      $match: {
        senderId: new mongoose.Types.ObjectId(profileId),
        status: "pending",
      },
    });
  } else if (type === "received") {
    aggregation.push({
      $match: {
        receiverId: new mongoose.Types.ObjectId(profileId),
        status: "pending",
      },
    });
  } else if (type === "accepted") {
    aggregation.push({
      $match: {
        $or: [
          {
            senderId: new mongoose.Types.ObjectId(profileId),
            status: "accepted",
          },
          {
            receiverId: new mongoose.Types.ObjectId(profileId),
            status: "accepted",
          },
        ],
      },
    });
  }

  // Lookup profile details
  aggregation.push({
    $lookup: {
      from: "matrimonialprofiles",
      localField: type === "received" ? "senderId" : "receiverId",
      foreignField: "_id",
      as: "profile",
    },
  });

  aggregation.push({
    $unwind: {
      path: "$profile",
      preserveNullAndEmptyArrays: true,
    },
  });

  aggregation.push({ $sort: { createdAt: -1 } });

  // Facet for pagination + count
  aggregation.push({
    $facet: {
      interests: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            profileId: "$profile._id",
            name: "$profile.name",
            age: "$profile.age",
            location: "$profile.location",
            occupation: "$profile.occupation",
            education: "$profile.education",
            profilePicture: "$profile.profilePicture",
            isVerified: "$profile.isVerified",
            status: 1,
          },
        },
      ],
      totalCount: [{ $count: "count" }],
    },
  });

  const result = await InterestInProfileModel.aggregate(aggregation);

  const interests = result[0]?.interests || [];
  const totalCount = result[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return res.json(
    new ApiResponse(200, "Interests fetched successfully", {
      interests,
      total_page: totalPages,
      current_page: page,
      total_records: totalCount,
      per_page: limit,
    })
  );
});
