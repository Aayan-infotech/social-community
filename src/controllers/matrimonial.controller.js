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
import VedicAstrology from "vedic-astrology";
import { DesiredPartner } from "../models/desiredPartner.model.js";

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
    $or: [{ createdBy, profileFor, name }, { email }, { mobileNo }],
  });
  if (existingProfile) {
    throw new ApiError(400, "A profile with the same details already exists.");
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
    lifestyle: { diet },
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
  const aggregation = [
    {
      $match: { _id: new mongoose.Types.ObjectId(profileId) },
    },
    {
      $project: {
        createdBy: { $ifNull: ["$createdBy", "not filled"] },
        profileFor: { $ifNull: ["$profileFor", "not filled"] },
        relationToUser: { $ifNull: ["$relationToUser", "not filled"] },
        gender: { $ifNull: ["$gender", "not filled"] },
        name: { $ifNull: ["$name", "not filled"] },
        age: { $ifNull: ["$age", "not filled"] },
        dob: { $ifNull: ["$dob", "not filled"] },
        mobileNo: { $ifNull: ["$mobileNo", "not filled"] },
        email: { $ifNull: ["$email", "not filled"] },
        religion: { $ifNull: ["$religion", "not filled"] },
        community: { $ifNull: ["$community", "not filled"] },
        subCommunity: { $ifNull: ["$subCommunity", "not filled"] },
        gothra: { $ifNull: ["$gothra", "not filled"] },
        marryInOtherCaste: { $ifNull: ["$marryInOtherCaste", "not filled"] },
        maritalStatus: { $ifNull: ["$maritalStatus", "not filled"] },
        noOfChildren: { $ifNull: ["$noOfChildren", "not filled"] },
        motherTongue: { $ifNull: ["$motherTongue", "not filled"] },
        height: { $ifNull: ["$height", "not filled"] },
        weight: { $ifNull: ["$weight", "not filled"] },
        livingIn: { $ifNull: ["$livingIn", "not filled"] },
        state: { $ifNull: ["$state", "not filled"] },
        city: { $ifNull: ["$city", "not filled"] },
        annualIncome: { $ifNull: ["$annualIncome", "not filled"] },
        profilePicture: { $ifNull: ["$profilePicture", "not filled"] },

        // About
        about: { $ifNull: ["$about", "not filled"] },
        shortDescription: { $ifNull: ["$shortDescription", "not filled"] },
        disability: { $ifNull: ["$disability", "not filled"] },
        disabilityDetails: { $ifNull: ["$disabilityDetails", "not filled"] },

        // Verification
        isVerified: { $ifNull: ["$isVerified", "not filled"] },
        identityProof: { $ifNull: ["$identityProof", "not filled"] },
        documentNumber: { $ifNull: ["$documentNumber", "not filled"] },
        documentName: { $ifNull: ["$documentName", "not filled"] },

        educationAbout: { $ifNull: ["$educationAbout", "not filled"] },
        highestQualification: {
          $ifNull: ["$highestQualification", "not filled"],
        },
        college: { $ifNull: ["$college", "not filled"] },
        ugdegree: { $ifNull: ["$ugdegree", "not filled"] },
        schoolName: { $ifNull: ["$schoolName", "not filled"] },

        // Career
        careerAbout: { $ifNull: ["$careerAbout", "not filled"] },
        employmentType: { $ifNull: ["$employmentType", "not filled"] },
        workWith: { $ifNull: ["$workWith", "not filled"] },
        workAs: { $ifNull: ["$workAs", "not filled"] },
        workLocation: { $ifNull: ["$workLocation", "not filled"] },

        // Family Details
        familyDetails: {
          about: { $ifNull: ["$familyDetails.about", "not filled"] },
          familyType: { $ifNull: ["$familyDetails.familyType", "not filled"] },
          fatherName: { $ifNull: ["$familyDetails.fatherName", "not filled"] },
          motherName: { $ifNull: ["$familyDetails.motherName", "not filled"] },
          noOfBrothers: {
            $ifNull: ["$familyDetails.noOfBrothers", "not filled"],
          },
          noOfSisters: {
            $ifNull: ["$familyDetails.noOfSisters", "not filled"],
          },
          marriedBrothers: {
            $ifNull: ["$familyDetails.marriedBrothers", "not filled"],
          },
          marriedSisters: {
            $ifNull: ["$familyDetails.marriedSisters", "not filled"],
          },
          financialStatus: {
            $ifNull: ["$familyDetails.financialStatus", "not filled"],
          },
          livedWithFamily: {
            $ifNull: ["$familyDetails.livedWithFamily", "not filled"],
          },
          fatherOccupation: {
            $ifNull: ["$familyDetails.fatherOccupation", "not filled"],
          },
          motherOccupation: {
            $ifNull: ["$familyDetails.motherOccupation", "not filled"],
          },
          familyIncome: {
            $ifNull: ["$familyDetails.familyIncome", "not filled"],
          },
          familyValues: {
            $ifNull: ["$familyDetails.familyValues", "not filled"],
          },
          LivingWithParents: {
            $ifNull: ["$familyDetails.LivingWithParents", "not filled"],
          },
          familyLocation: {
            $ifNull: ["$familyDetails.familyLocation", "not filled"],
          },
        },

        // Horoscope Details
        horoscopeDetails: {
          birthTime: { $ifNull: ["$horoscopeDetails.birthTime", "not filled"] },
          birthPlace: {
            $ifNull: ["$horoscopeDetails.birthPlace", "not filled"],
          },
          rashi: { $ifNull: ["$horoscopeDetails.rashi", "not filled"] },
          nakshatra: { $ifNull: ["$horoscopeDetails.nakshatra", "not filled"] },
          manglik: { $ifNull: ["$horoscopeDetails.manglik", "not filled"] },
        },

        // Lifestyle
        lifestyle: {
          diet: { $ifNull: ["$lifestyle.diet", "not filled"] },
          smoke: { $ifNull: ["$lifestyle.smoke", "not filled"] },
          drink: { $ifNull: ["$lifestyle.drink", "not filled"] },
          openToPets: { $ifNull: ["$lifestyle.openToPets", "not filled"] },
          OwnHouse: { $ifNull: ["$lifestyle.OwnHouse", "not filled"] },
          OwnCar: { $ifNull: ["$lifestyle.OwnCar", "not filled"] },
          FoodCooked: { $ifNull: ["$lifestyle.FoodCooked", "not filled"] },
          hobbies: { $ifNull: ["$lifestyle.hobbies", "not filled"] },
          favoriteMusic: {
            $ifNull: ["$lifestyle.favoriteMusic", "not filled"],
          },
          favoritebooks: {
            $ifNull: ["$lifestyle.favoritebooks", "not filled"],
          },
          dressStyle: { $ifNull: ["$lifestyle.dressStyle", "not filled"] },
          sports: { $ifNull: ["$lifestyle.sports", "not filled"] },
          cuisine: { $ifNull: ["$lifestyle.cuisine", "not filled"] },
          movies: { $ifNull: ["$lifestyle.movies", "not filled"] },
          tvShows: { $ifNull: ["$lifestyle.tvShows", "not filled"] },
          vacationDestination: {
            $ifNull: ["$lifestyle.vacationDestination", "not filled"],
          },
        },
      },
    },
  ];
  const profile = await matrimonialProfilesModel.aggregate(aggregation);

  // const profile = await matrimonialProfilesModel
  //   .findOne({ _id: profileId })
  //   .lean();
  // if (!profile) {
  //   throw new ApiError(404, "Profile not found");
  // }
  // const filledProfile = fillWithDefaults(
  //   profile,
  //   matrimonialProfilesModel.schema
  // );
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

    if (!profileId || profileId.trim() === "") {
      throw new ApiError(400, "profileId parameter is required");
    }

    const profile = await matrimonialProfilesModel
      .findOne({ _id: profileId })
      .lean();
    if (!profile) {
      throw new ApiError(404, "Profile not found");
    }

    // --- Base conditions (always apply) ---
    const baseMatch = {
      _id: { $ne: profile._id },
      createdBy: { $ne: req.user.userId },
      gender: { $ne: profile.gender },
    };

    // --- Strict filters (preferences + query params) ---
    const matchCriteria = { ...baseMatch };

    if (minAge || maxAge) {
      matchCriteria.age = {};
      if (minAge) matchCriteria.age.$gte = parseInt(minAge);
      if (maxAge) matchCriteria.age.$lte = parseInt(maxAge);
    }

    if (minHeight || maxHeight) {
      matchCriteria.height = {};
      if (minHeight) matchCriteria.height.$gte = parseFloat(minHeight);
      if (maxHeight) matchCriteria.height.$lte = parseFloat(maxHeight);
    }

    if (minIncome || maxIncome) {
      matchCriteria.income = {};
      if (minIncome) matchCriteria.income.$gte = parseInt(minIncome);
      if (maxIncome) matchCriteria.income.$lte = parseInt(maxIncome);
    }

    if (religion) matchCriteria.religion = religion;

    if (profile.marryInOtherCaste === false && profile.community) {
      matchCriteria.community = profile.community;
    } else if (community) {
      matchCriteria.community = community;
    }

    if (location) matchCriteria.location = location;

    if (maritalStatus) {
      matchCriteria.maritalStatus = { $in: maritalStatus.split(",") };
    }

    // --- Helper function to build aggregation ---
    const buildAggregation = (criteria) => [
      { $match: criteria },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "interestinprofiles",
          let: { receiverId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: [
                        "$senderId",
                        new mongoose.Types.ObjectId(profileId),
                      ],
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
      },
      {
        $addFields: {
          isInterestSend: {
            $cond: [{ $gt: [{ $size: "$interestData" }, 0] }, true, false],
          },
        },
      },
      {
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
      },
    ];

    // --- Run with strict filters first ---
    let results = await matrimonialProfilesModel.aggregate(
      buildAggregation(matchCriteria)
    );
    let profiles = results[0]?.profiles || [];
    let totalCount = results[0]?.totalCount[0]?.count || 0;

    // --- If no profiles, fallback to base conditions ---
    if (profiles.length === 0) {
      results = await matrimonialProfilesModel.aggregate(
        buildAggregation(baseMatch)
      );
      profiles = results[0]?.profiles || [];
      totalCount = results[0]?.totalCount[0]?.count || 0;
    }

    return res.json(
      new ApiResponse(
        200,
        "Matrimonial profile suggestions fetched successfully",
        {
          profiles,
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

export const updateBasicDetails = asyncHandler(async (req, res) => {
  const {
    name,
    height,
    weight,
    dob,
    maritalStatus,
    community,
    subCommunity,
    motherTongue,
    country,
    state,
    city,
    annualIncome,
  } = req.body;
  const profileId = req.params.profileId;

  if (
    !profileId ||
    profileId.trim() === "" ||
    profileId === undefined ||
    profileId === null
  ) {
    throw new ApiError(400, "profileId parameter is required");
  }

  // update the basic details of matrimonial profile
  const profile = await matrimonialProfilesModel.findOne({
    _id: profileId,
    createdBy: req.user.userId,
  });

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  profile.name = name;
  profile.height = height;
  profile.weight = weight;
  profile.dob = dob;
  profile.maritalStatus = maritalStatus;
  profile.community = community;
  profile.subCommunity = subCommunity;
  profile.motherTongue = motherTongue;
  profile.country = country;
  profile.state = state;
  profile.city = city;
  profile.annualIncome = annualIncome;
  await profile.save();

  return res.json(
    new ApiResponse(200, "Basic details updated successfully", profile)
  );
});

export const updateAbout = asyncHandler(async (req, res) => {
  const { about, shortDescription, profileFor, disability, disabilityDetails } =
    req.body;
  const profileId = req.params.profileId;
  if (
    !profileId ||
    profileId.trim() === "" ||
    profileId === undefined ||
    profileId === null
  ) {
    throw new ApiError(400, "profileId parameter is required");
  }
  const profile = await matrimonialProfilesModel.findOne({
    _id: profileId,
    createdBy: req.user.userId,
  });
  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  profile.about = about;
  profile.shortDescription = shortDescription;
  profile.profileFor = profileFor;
  profile.disability = disability;
  profile.disabilityDetails = disability === "no" ? "" : disabilityDetails;

  await profile.save();
  return res.json(
    new ApiResponse(200, "About section updated successfully", profile)
  );
});

export const updateEducation = asyncHandler(async (req, res) => {
  const {
    highestQualification,
    educationAbout,
    ugdegree,
    college,
    schoolName,
  } = req.body;
  const profileId = req.params.profileId;
  if (
    !profileId ||
    profileId.trim() === "" ||
    profileId === undefined ||
    profileId === null
  ) {
    throw new ApiError(400, "profileId parameter is required");
  }

  const profile = await matrimonialProfilesModel.findOne({
    _id: profileId,
    createdBy: req.user.userId,
  });

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  profile.highestQualification = highestQualification;
  profile.educationAbout = educationAbout;
  profile.ugdegree = ugdegree;
  profile.college = college;
  profile.schoolName = schoolName;
  await profile.save();
  return res.json(
    new ApiResponse(200, "Education section updated successfully", profile)
  );
});

export const updateCareer = asyncHandler(async (req, res) => {
  const {
    careerAbout,
    employmentType,
    organizationName,
    occupation,
    workLocation,
  } = req.body;
  const profileId = req.params.profileId;
  if (
    !profileId ||
    profileId.trim() === "" ||
    profileId === undefined ||
    profileId === null
  ) {
    throw new ApiError(400, "profileId parameter is required");
  }

  const profile = await matrimonialProfilesModel.findOne({
    _id: profileId,
    createdBy: req.user.userId,
  });

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  profile.careerAbout = careerAbout;
  profile.employmentType = employmentType;
  profile.workAs = occupation;
  profile.workWith = organizationName;
  profile.workLocation = workLocation;
  await profile.save();
  return res.json(
    new ApiResponse(200, "Career section updated successfully", profile)
  );
});

export const updateFamily = asyncHandler(async (req, res) => {
  const {
    familyAbout,
    familyType,
    fatherName,
    motherName,
    noOfBrothers,
    noOfSisters,
    marriedBrothers,
    marriedSisters,
    financialStatus,
    livedWithFamily,
    fatherOccupation,
    motherOccupation,
    familyIncome,
    familyValues,
    LivingWithParents,
    familyLocation,
  } = req.body;
  const profileId = req.params.profileId;
  if (
    !profileId ||
    profileId.trim() === "" ||
    profileId === undefined ||
    profileId === null
  ) {
    throw new ApiError(400, "profileId parameter is required");
  }

  const profile = await matrimonialProfilesModel
    .findOne({
      _id: profileId,
      createdBy: req.user.userId,
    })
    .populate("familyDetails");
  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  profile.familyDetails = {
    about: familyAbout,
    familyType: familyType,
    fatherName: fatherName,
    motherName: motherName,
    noOfBrothers: noOfBrothers,
    noOfSisters: noOfSisters,
    marriedBrothers: marriedBrothers,
    marriedSisters: marriedSisters,
    financialStatus: financialStatus,
    livedWithFamily: livedWithFamily,
    fatherOccupation: fatherOccupation,
    motherOccupation: motherOccupation,
    familyIncome: familyIncome,
    familyValues: familyValues,
    LivingWithParents: LivingWithParents,
    familyLocation: familyLocation,
  };
  await profile.save();
  return res.json(
    new ApiResponse(200, "Family section updated successfully", profile)
  );
  //
  throw new ApiError(403, "This function is under development");
});

export const updateHoroscope = asyncHandler(async (req, res) => {
  const { birthTime, birthPlace, manglik } = req.body;
  const profileId = req.params.profileId;
  if (
    !profileId ||
    profileId.trim() === "" ||
    profileId === undefined ||
    profileId === null
  ) {
    throw new ApiError(400, "profileId parameter is required");
  }

  const profile = await matrimonialProfilesModel.findOne({
    _id: profileId,
    createdBy: req.user.userId,
  });

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }
  console.log(birthTime);
  console.log(birthPlace);
  console.log(manglik);
  // const birthChart = vedicAstrology
  const birthChart = VedicAstrology.positioner.getBirthChart(
    "2002-09-30",
    "05:00:00",
    26.8467,
    80.9462,
    5.5
  );
  console.log(birthChart);
  return res.json(
    new ApiResponse(200, "Horoscope section updated successfully", birthChart)
  );
  // console.log(birthChart.getLagna());
  // console.log(birthChart.getRashi());
  // console.log(birthChart.getNakshatra());

  throw new ApiError(403, "This function is under development");
});

export const updateLifestyle = asyncHandler(async (req, res) => {
  const {
    diet,
    smoke,
    drink,
    openToPets,
    OwnHouse,
    OwnCar,
    FoodCooked,
    hobbies,
    favoriteMusic,
    favoritebooks,
    dressStyle,
    sports,
    cuisine,
  } = req.body;
  const profileId = req.params.profileId;
  if (
    !profileId ||
    profileId.trim() === "" ||
    profileId === undefined ||
    profileId === null
  ) {
    throw new ApiError(400, "profileId parameter is required");
  }

  const profile = await matrimonialProfilesModel.findOne({
    _id: profileId,
    createdBy: req.user.userId,
  });

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  profile.lifestyle = {
    diet,
    smoke,
    drink,
    openToPets,
    OwnHouse,
    OwnCar,
    FoodCooked,
    hobbies,
    favoriteMusic,
    favoritebooks,
    dressStyle,
    sports,
    cuisine,
  };

  await profile.save();
  return res.json(
    new ApiResponse(200, "Lifestyle section updated successfully", profile)
  );
});

export const desiredPartner = asyncHandler(async (req, res) => {
  const {
    ageFrom,
    ageTo,
    heightFrom,
    heightTo,
    maritalStatus,
    religion,
    motherTongue,
    annualIncomeMin,
    annualIncomeMax,
  } = req.body;
  const userId = req.user.userId;
  const profileId = req.params.profileId;
  if (
    !profileId ||
    profileId.trim() === "" ||
    profileId === undefined ||
    profileId === null
  ) {
    throw new ApiError(400, "profileId parameter is required");
  }

  const profile = await matrimonialProfilesModel.findOne({
    _id: profileId,
    createdBy: userId,
  });

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  const existingPreference = await DesiredPartner.findOne({
    createdBy: userId,
    profileId,
  });
  if (existingPreference) {
    throw new ApiError(400, "Preferences already set for this profile");
  }

  const newPreference = {
    createdBy: userId,
    profileId,
    ageFrom,
    ageTo,
    heightFrom,
    heightTo,
    maritalStatus,
    religion,
    motherTongue,
    annualIncome: { min: annualIncomeMin, max: annualIncomeMax },
    smoking: ["no"],
    drinking: ["no"],
    diet: ["vegetarian"],
    community: profile.marryInOtherCaste ? [] : [profile.community],
    country: [profile.country],
    state: [profile.state],
    city: [profile.city],
  };
  await DesiredPartner.create(newPreference);

  return res.json(
    new ApiResponse(
      200,
      "Desired partner preferences updated successfully",
      newPreference
    )
  );
});


export const partnerBasicDetails = asyncHandler(async (req, res) =>{
  const { ageFrom, ageTo, heightFrom, heightTo , maritalStatus, country , state , city} = req.body;
  const userId = req.user.userId;
  const profileId = req.params.profileId;
  if (
    !profileId ||
    profileId.trim() === "" ||
    profileId === undefined ||
    profileId === null
  ) {
    throw new ApiError(400, "profileId parameter is required");
  }

  const profile = await matrimonialProfilesModel.findOne({
    _id: profileId,
    createdBy: userId,
  });
  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  const existingPreference = await DesiredPartner.findOne({
    createdBy: userId,
    profileId,
  });

  console.log(existingPreference);
  if (!existingPreference) {
    throw new ApiError(400, "Preferences not000000000000000000000000000000000000000000000000000000 set for this profile");
  }

  const newPreference = {
    ageFrom,
    ageTo,
    heightFrom,
    heightTo,
    maritalStatus,
    country,
    state,
    city
  };

  console.log(newPreference);


  throw new ApiError(403, "This function is under development");

});
