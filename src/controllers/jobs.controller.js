import mongoose from "mongoose";
import ApplyJobModel from "../models/appliedJob.model.js";
import JobModel from "../models/jobs.model.js";
import ResumeModel from "../models/resume.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  saveCompressedImage,
  uploadImage,
  deleteObject,
} from "../utils/awsS3Utils.js";
import fs from "fs";
import { isValidObjectId } from "../utils/isValidObjectId.js";
import { sendEmail } from "../services/emailService.js";
import { User } from "../models/user.model.js";

export const addJob = asyncHandler(async (req, res) => {
  const { description, location, companyName, position, salary } = req.body;
  const userId = req.user.userId;

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
      $match: { userId: req.query.userId, isDeleted: false },
    });
  } else {
    aggregation.push({
      $match: { userId: { $ne: req.user.userId }, isDeleted: false },
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

  const job = await JobModel.find({ _id: jobId, userId });
  if (!job || job.length === 0) {
    throw new ApiError(
      404,
      "Job not found or you are not authorized to view this job"
    );
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;
  const aggregation = [];

  aggregation.push({
    $match: { jobId: new mongoose.Types.ObjectId(jobId) },
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
    $project: {
      userId: 1,
      email: 1,
      phone: 1,
      currentCTC: 1,
      expectedCTC: 1,
      noticePeriod: 1,
      status: 1,
      appliedAt: "$createdAt",
      user: {
        name: "$user.name",
        profile_image: {
          $ifNull: [
            "$user.profile_image",
            `${req.protocol}://${req.hostname}:${process.env.PORT}/placeholder/person.png`,
          ],
        },
        userId: "$user.userId",
      },
    },
  });

  aggregation.push({
    $facet: {
      applicants: [{ $skip: skip }, { $limit: limit }],
      totalCount: [{ $count: "count" }],
    },
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

export const editJob = asyncHandler(async (req, res) => {
  const { jobId, description, location, companyName, position, salary } =
    req.body;
  const userId = req.user.userId;

  if (!isValidObjectId(jobId)) {
    throw new ApiError(400, "Invalid job ID");
  }

  const job = await JobModel.findById(jobId);
  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (job.userId.toString() !== userId) {
    throw new ApiError(403, "You are not authorized to edit this job");
  }

  let jobImage = job.jobImage;

  if (req.files && req.files.jobImage) {
    // Delete the old image from S3 if it exists
    if (jobImage) {
      await deleteObject(jobImage);
    }
    const file = req.files.jobImage[0];
    const saveUpload = await saveCompressedImage(file, 600);
    if (!saveUpload.success) {
      throw new ApiError(400, "Image upload failed");
    } else {
      jobImage = saveUpload.thumbnailUrl;
    }
    fs.unlinkSync(file.path);
  }

  const updatedJob = await JobModel.findByIdAndUpdate(
    jobId,
    {
      description,
      location,
      companyName,
      position,
      salary,
      jobImage: jobImage || job.jobImage,
    },
    { new: true }
  );

  res.json(new ApiResponse(200, "Job updated successfully", updatedJob));
});

export const deleteJob = asyncHandler(async (req, res) => {
  const jobId = req.params.jobId;
  if (!isValidObjectId(jobId)) {
    throw new ApiError(400, "Invalid job ID");
  }

  const job = await JobModel.findById(jobId);
  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  // Delete the image from S3 if it exists
  if (job.jobImage) {
    await deleteObject(job.jobImage);
  }

  await JobModel.findByIdAndUpdate(jobId, { isDeleted: true });

  res.json(new ApiResponse(200, "Job deleted successfully"));
});

export const getApplicantDetails = asyncHandler(async (req, res) => {
  const applicationId = req.query.applicationId;
  console.log(applicationId);
  if (!isValidObjectId(applicationId)) {
    throw new ApiError(400, "Invalid application ID");
  }

  const aggregation = [];
  aggregation.push({
    $match: { _id: new mongoose.Types.ObjectId(applicationId) },
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
      appliedAt: "$createdAt",
      user: {
        name: "$user.name",
        profile_image: {
          $ifNull: [
            "$user.profile_image",
            `${req.protocol}://${req.hostname}:${process.env.PORT}/placeholder/person.png`,
          ],
        },
        userId: "$user.userId",
      },
      resume: "$resume.resume",
    },
  });

  const applicantDetails = await ApplyJobModel.aggregate(aggregation);
  if (!applicantDetails || applicantDetails.length === 0) {
    throw new ApiError(404, "Applicant not found");
  }
  // return the first element of the array
  const applicant = applicantDetails[0];

  res.json(
    new ApiResponse(200, "Applicant details fetched successfully", applicant)
  );
});

export const updateApplicantStatus = asyncHandler(async (req, res) => {
  const { applicationId, status } = req.body;
  if (!isValidObjectId(applicationId)) {
    throw new ApiError(400, "Invalid application ID");
  }
  if (!["shortlisted", "rejected"].includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  // send mail to the user
  const application = await ApplyJobModel.findById(applicationId);
  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  if (application.status !== "applied") {
    throw new ApiError(400, "Application already processed");
  } 
  // get the details of the user
  const user = await User.find({ userId: application.userId }).select(
    "email name"
  );
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // console.log(user);
  const userEmail = user[0].email;
  const userName = user[0].name;

  if (status === "shortlisted") {
    // send mail to the user
    const html = fs.readFileSync(
      "./src/emails/InterviewInvitation.html",
      "utf-8"
    );
    const subject = "Shortlisted for the interview";
    const pattern = new RegExp(`{{name}}`, "g");
    const updatedHtml = html.replace(pattern, userName);
    sendEmail(userEmail, subject, updatedHtml);
  } else {
    // send mail to the user
    const html = fs.readFileSync(
      "./src/emails/rejectedApplication.html",
      "utf-8"
    );
    const subject = "Job Application Rejected";
    const pattern = new RegExp(`{{name}}`, "g");
    const updatedHtml = html.replace(pattern, userName);

    sendEmail(userEmail, subject, updatedHtml);
  }

  const updatedApplication = await ApplyJobModel.findByIdAndUpdate(
    applicationId,
    { status },
    { new: true }
  );

  if (!updatedApplication) {
    throw new ApiError(404, "Application not found");
  }

  res.json(
    new ApiResponse(
      200,
      "Application status updated successfully",
      updatedApplication
    )
  );
});
