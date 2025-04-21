import mongoose from "mongoose";
import ApplyJobModel from "../models/appliedJob.model.js";
import JobModel from "../models/jobs.model.js";
import ResumeModel from "../models/resume.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { saveCompressedImage, uploadImage } from "../utils/awsS3Utils.js";
import fs from "fs";
import { isValidObjectId } from "../utils/isValidObjectId.js";

export const addJob = asyncHandler(async (req, res) => {
  const { description, location, companyName, position, salary } = req.body;
  const userId = req.user.userId;

  console.log(description, location, companyName, position, salary, userId);

  let jobImage = null;
  if (req.files && req.files.jobImage) {
    const file = req.files.jobImage[0];
    const saveUpload = await saveCompressedImage(file, 600);
    if (!saveUpload.success) {
      throw new ApiError(400, "Image upload failed");
    } else {
      jobImage = saveUpload.thumbnailUrl;
    }
    fs.unlinkSync(file.path);
  }

  const newJob = await JobModel.create({
    description,
    location,
    companyName,
    position,
    userId,
    salary,
    jobImage,
  });

  res.json(new ApiResponse(200, "Job added successfully", newJob));
});

export const getAllJobs = asyncHandler(async (req, res) => {
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
      from: "appliedjobs",
      localField: "_id",
      foreignField: "jobId",
      as: "appliedJobs",
    },
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
            description: 1,
            location: 1,
            companyName: 1,
            position: 1,
            salary: 1,
            jobImage: 1,
            totalApplications: { $size: "$appliedJobs" },
          },
        },
      ],
      totalCount: [{ $count: "count" }],
    },
  });

  const result = await JobModel.aggregate(aggregation);

  const jobs = result[0]?.jobs || [];
  const totalCount = result[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  res.json(
    new ApiResponse(
      200,
      jobs.length > 0 ? "Jobs fetched successfully" : "No jobs found",
      jobs.length > 0
        ? {
            jobs,
            total_page: totalPages,
            current_page: page,
            total_records: totalCount,
            per_page: limit,
          }
        : null
    )
  );
});

export const applyJob = asyncHandler(async (req, res) => {
  const {
    jobId,
    email,
    phone,
    resumeId,
    currentCTC,
    expectedCTC,
    noticePeriod,
  } = req.body;
  if (!isValidObjectId(jobId)) {
    throw new ApiError(400, "Invalid job ID");
  }
  if (!isValidObjectId(resumeId)) {
    throw new ApiError(400, "Please upload a resume");
  }
  const userId = req.user.userId;

  const appliedEarlier = await ApplyJobModel.findOne({ userId, jobId });

  if (appliedEarlier) {
    throw new ApiError(400, "You have already applied for this job");
  }

  const appliedJob = await ApplyJobModel.create({
    userId,
    jobId,
    resumeId,
    email,
    phone,
    currentCTC,
    expectedCTC,
    noticePeriod,
  });

  res.json(new ApiResponse(200, "Job applied successfully", appliedJob));
});

export const uploadResume = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  if (!req.files || !req.files.resume) {
    throw new ApiError(400, "Resume file is required");
  }
  const file = req.files.resume[0];

  let resume = null;
  const saveUpload = await uploadImage(file);
  if (!saveUpload.success) {
    throw new ApiError(400, "Image upload failed");
  } else {
    resume = saveUpload.fileUrl;
  }

  const addResume = await ResumeModel.create({
    userId,
    resume,
  });

  res.json(new ApiResponse(200, "Resume uploaded successfully", addResume));
});

export const getResume = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const resume = await ResumeModel.find({ userId });
  if (!resume) {
    throw new ApiError(404, "Resume not found");
  }
  res.json(new ApiResponse(200, "Resume fetched successfully", resume));
});

export const getJobDetails = asyncHandler(async (req, res) => {
  const jobId = req.params.jobId;
  if (!isValidObjectId(jobId)) {
    throw new ApiError(400, "Invalid job ID");
  }

  const aggregation = [];
  aggregation.push({
    $match: { _id: new mongoose.Types.ObjectId(jobId) },
  });
  aggregation.push({
    $lookup: {
      from: "appliedjobs",
      localField: "_id",
      foreignField: "jobId",
      as: "appliedJobs",
    },
  });
  aggregation.push({
    $project: {
      "user.name": 1,
      "user.profile_image": 1,
      "user.userId": 1,
      description: 1,
      location: 1,
      companyName: 1,
      position: 1,
      salary: 1,
      jobImage: 1,
      totalApplications: { $size: "$appliedJobs" },
    },
  });

  const result = await JobModel.aggregate(aggregation);

  return res.json(
    new ApiResponse(200, "Job details fetched successfully", result)
  );
});

export const getApplicantList = asyncHandler(async (req, res) => {
  // jobId is Required
  if (!req.query.jobId) {
    throw new ApiError(400, "Job ID is required");
  }
  const jobId = req.query.jobId;
  if (!isValidObjectId(jobId)) {
    throw new ApiError(400, "Invalid job ID");
  }
  const userId = req.user.userId;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;
  const aggregation = [];

  aggregation.push({
    $match: { jobId: new mongoose.Types.ObjectId(jobId) },
  });
  aggregation.push({
    $lookup: {
      from: "resumes",
      localField: "resumeId",
      foreignField: "_id",
      as: "resume",
    },
  });
  aggregation.push({
    $unwind: "$resume",
  });
  aggregation.push({
    $project: {
      userId: 1,
      email: 1,
      phone: 1,
      currentCTC: 1,
      expectedCTC: 1,
      noticePeriod: 1,
      resume: "$resume.resume",
      appliedAt: "$createdAt",
    },
  });

  aggregation.push({
    $facet:{
      applicants: [
        { $skip: skip },
        { $limit: limit },
      ],
      totalCount: [{ $count: "count" }],
    }
  });

  const applicantList = await ApplyJobModel.aggregate(aggregation);
  const applicants = applicantList[0]?.applicants || [];
  const totalCount = applicantList[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);


  res.json(
    new ApiResponse(200, "Applicant list fetched successfully", {
      applicants,
      total_page: totalPages,
      current_page: page,
      total_records: totalCount,
      per_page: limit,
    })
  );
});
