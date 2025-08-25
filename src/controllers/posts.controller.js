import CommentModel from "../models/comment.model.js";
import PostModel from "../models/posts.model.js";
import ReplyModel from "../models/reply.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadImage,
  saveCompressedImage,
  uploadVideo,
  compressVideo,
  deleteObject,
  getVideoDuration,
  getMediaMetadata,
} from "../utils/awsS3Utils.js";
import fs, { stat } from "fs";
import { isValidObjectId } from "../utils/isValidObjectId.js";
import { url } from "inspector";
import { Education } from "../models/education.model.js";
import { Experience } from "../models/experience.model.js";
import mongoose from "mongoose";
import ReportedPost from "../models/reportedPost.model.js";

const createPost = asyncHandler(async (req, res) => {
  const { title, description, type } = req.body;

  // let media = [];
  let media = null;
  let mediaType = null;
  let mediaWidth = null;
  let mediaHeight = null;
  let mediaAspectRatio = null;
  let mediaOrientation = null;
  if (req.files && req.files.media) {
    const file = req.files.media[0];
    const { width, height, aspectRatio, orientation } = await getMediaMetadata(file);

    if (!width || !height || !aspectRatio || !orientation) {
      throw new ApiError(400, "Invalid media metadata");
    }
    [mediaWidth, mediaHeight, mediaAspectRatio, mediaOrientation] = [width, height, aspectRatio, orientation];

    if (file.mimetype !== "video/mp4") {
      const saveUpload = await saveCompressedImage(file, 600);
      if (!saveUpload.success) {
        throw new ApiError(400, "Image upload failed");
      } else {
        // const uploadImageObject = {
        //   url: saveUpload.thumbnailUrl,
        //   type: "image",
        // };
        // media.push(uploadImageObject);

        media = saveUpload.thumbnailUrl;
        mediaType = "image";
      }
    } else {

      const videoDuration = await getVideoDuration(file.path);
      if (videoDuration > 30) {
        throw new ApiError(400, "Video duration should not exceed 30 seconds");
      }
      const status = await compressVideo(file.path, "./public/temp");
      if (!status.success) {
        throw new ApiError(400, "Video compression failed");
      }
      const compressedFile = {
        path: status.outputPath,
        originalname: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
      };
      const upload = await uploadVideo(compressedFile);
      if (!upload.success) {
        throw new ApiError(400, "Video upload failed");
      } else {
        // media.push(upload.videoUrl);
        // const uploadVideoObject = {
        //   url: upload.videoUrl,
        //   type: "video",
        // };
        // media.push(uploadVideoObject);

        media = upload.videoUrl;
        mediaType = "video";
      }
    }
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }



  // save the post data
  const post = new PostModel({
    title,
    description,
    type,
    userId: req.user.userId,
    media,
    mediaType: mediaType ? mediaType : "text",
    mediaWidth: mediaWidth,
    mediaHeight: mediaHeight,
    mediaAspectRatio: mediaAspectRatio,
    mediaOrientation: mediaOrientation,
  });

  await post.save();

  res.json(new ApiResponse(200, "Post created successfully", post));
});

const updatePost = asyncHandler(async function (req, res) {
  const { postId, title, description, type } = req.body;

  if (!isValidObjectId(postId)) {
    throw new ApiError(400, "Invalid post ID");
  }

  const post = await PostModel.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  let media = post.media || null;
  let mediaType = post.mediaType || null;
  let width = post.mediaWidth || null;
  let height = post.mediaHeight || null;
  let aspectRatio = post.mediaAspectRatio || null;
  let orientation = post.mediaOrientation || null;

  if (req.files && req.files.media) {
    const file = req.files.media[0];
    const metadata = await getMediaMetadata(file);

    if (
      !metadata.width ||
      !metadata.height ||
      !metadata.aspectRatio ||
      !metadata.orientation
    ) {
      throw new ApiError(400, "Invalid media metadata");
    }

    width = metadata.width;
    height = metadata.height;
    aspectRatio = metadata.aspectRatio;
    orientation = metadata.orientation;

    if (file.mimetype !== "video/mp4") {
      const saveUpload = await saveCompressedImage(file, 600);
      if (!saveUpload.success) {
        throw new ApiError(400, "Image upload failed");
      }
      media = saveUpload.thumbnailUrl;
      mediaType = "image";
    } else {
      const videoDuration = await getVideoDuration(file.path);
      if (videoDuration > 30) {
        throw new ApiError(400, "Video duration should not exceed 30 seconds");
      }

      const status = await compressVideo(file.path, "./public/temp");
      if (!status.success) {
        throw new ApiError(400, "Video compression failed");
      }

      const compressedFile = {
        path: status.outputPath,
        originalname: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
      };

      const upload = await uploadVideo(compressedFile);
      if (!upload.success) {
        throw new ApiError(400, "Video upload failed");
      }

      media = upload.videoUrl;
      mediaType = "video";
    }

    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // remove the previous from s3
    const previousMedia = post.media;
    if (previousMedia && previousMedia !== media) {
      await deleteObject(previousMedia);
    }
  }

  // Update post fields
  post.title = title || post.title;
  post.description = description || post.description;
  post.type = type || post.type;
  post.media = media;
  post.mediaType = mediaType ? mediaType : "text";
  post.mediaWidth = width;
  post.mediaHeight = height;
  post.mediaAspectRatio = aspectRatio;
  post.mediaOrientation = orientation;

  await post.save();

  res.json(new ApiResponse(200, "Post updated successfully", post));
});


const getPosts = asyncHandler(async function (req, res) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;
  const userId = req.query.userId || req.user.userId;
  const type = req.query.type || "social";

  const getUser = await User.find({ userId });
  if (!getUser.length > 0) {
    throw new ApiError(400, "Invalid User Id");
  }

  const totalPosts = await PostModel.find({
    userId: { $eq: userId },
  }).countDocuments();

  let aggregation = [];
  aggregation.push({
    $match: { userId: { $eq: userId }, type: { $eq: type } },
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
    $sort: { createdAt: -1 },
  });
  aggregation.push({
    $skip: skip,
  });
  aggregation.push({
    $limit: limit,
  });

  // isLiked boolean field that logged in user liked the post or not
  aggregation.push({
    $addFields: {
      isLiked: {
        $gt: [
          {
            $size: {
              $setIntersection: [[req.user.userId], "$likedBy"],
            },
          },
          0,
        ],
      },
    },
  });

  aggregation.push({
    $project: {
      "user.name": 1,
      "user.profile_image": 1,
      "user.userId": 1,
      title: 1,
      description: 1,
      type: 1,
      media: 1,
      mediaType: 1,
      likes: 1,
      isLiked: 1,
      // likedBy: 1,
      // comments: 1,
      // createdAt: 1,
      comment_count: { $size: "$comments" },
    },
  });

  const posts = await PostModel.aggregate(aggregation);

  if (posts.length === 0) {
    return res.json(new ApiResponse(200, "No posts found", []));
  }

  res.json(
    new ApiResponse(200, "Posts fetched successfully", {
      posts,
      total_page: Math.ceil(totalPosts / limit),
      current_page: page,
      total_records: totalPosts,
      per_page: limit,
    })
  );
});

const likeDisLikePost = asyncHandler(async (req, res) => {
  const { postId, like } = req.body;
  if (!isValidObjectId(postId)) {
    throw new ApiError(400, "Invalid post ID");
  }
  const userId = req.user.userId;
  const post = await PostModel.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  if (like) {
    // if already liked then don't add the count and push the new userId
    if (!post.likedBy.includes(userId)) {
      post.likes += 1;
      post.likedBy.push(userId);
    }
  } else {
    // if already disliked then don't subtract the count and remove the userId
    if (post.likedBy.includes(userId)) {
      post.likes -= 1;
      post.likedBy = post.likedBy.filter((id) => id !== userId);
    }
  }

  await post.save();

  res.json(new ApiResponse(200, "Post liked/disliked successfully", post));
});

const addComment = asyncHandler(async (req, res) => {
  const { postId, comment } = req.body;
  if (!isValidObjectId(postId)) {
    throw new ApiError(400, "Invalid post ID");
  }
  const userId = req.user.userId;
  const post = await PostModel.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const addComment = new CommentModel({
    userId,
    postId,
    comment,
  });
  await addComment.save();

  post.comments.push(addComment._id);
  await post.save();

  res.json(new ApiResponse(200, "Comment added successfully", addComment));
});

const editComment = asyncHandler(async function (req, res) {
  const { postId, commentId, comment } = req.body;
  if (!isValidObjectId(postId)) {
    throw new ApiError(400, "Invalid post ID");
  }
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }
  const userId = req.user.userId;

  const updateComment = await CommentModel.findOneAndUpdate(
    { _id: commentId, userId, postId },
    { comment },
    { new: true }
  );

  if (!updateComment) {
    throw new ApiError(404, "Comment not found");
  }

  res.json(new ApiResponse(200, "Comment updated successfully", updateComment));
});

const getComments = asyncHandler(async (req, res) => {
  const postId = req.params.postId;
  if (!postId) {
    throw new ApiError(400, "Post ID is required");
  }
  if (!isValidObjectId(postId)) {
    throw new ApiError(400, "Invalid post ID");
  }

  const post = await PostModel.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const totalComments = await CommentModel.countDocuments({ postId });

  let aggregation = [];
  aggregation.push({
    $match: { postId: post._id },
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
    $sort: { createdAt: -1 },
  });
  aggregation.push({
    $skip: skip,
  });
  aggregation.push({
    $limit: limit,
  });

  aggregation.push({
    $project: {
      "user.name": 1,
      "user.profile_image": 1,
      "user.userId": 1,
      comment: 1,
      createdAt: 1,
    },
  });

  const comments = await CommentModel.aggregate(aggregation);

  if (comments.length === 0) {
    return res.json(new ApiResponse(200, "No comments found", []));
  }

  res.json(
    new ApiResponse(200, "Comments fetched successfully", {
      comments,
      total_page: Math.ceil(totalComments / limit),
      current_page: page,
      total_records: totalComments,
      per_page: limit,
    })
  );
});

const addReplyComment = asyncHandler(async (req, res) => {
  const { commentId, comment } = req.body;
  const userId = req.user.userId;

  if (!userId) {
    throw new ApiError(400, "User Not found");
  }

  // find the comment
  const getComment = await CommentModel.findById(commentId);
  if (!getComment) {
    throw new ApiError(404, "Comment not found");
  }

  // save the reply comment
  const replyComment = new ReplyModel({
    userId,
    commentId,
    comment,
  });

  await replyComment.save();
  getComment.replies.push(replyComment._id);
  await getComment.save();

  res.json(
    new ApiResponse(200, "Reply comment added successfully", replyComment)
  );
});

const editReplyComment = asyncHandler(async (req, res) => {
  const { replyId, comment } = req.body;
  if (!isValidObjectId(replyId)) {
    throw new ApiError(400, "Invalid reply ID");
  }
  const userId = req.user.userId;

  if (!userId) {
    throw new ApiError(400, "User Not found");
  }

  // find the reply comment
  const getReplyComment = await ReplyModel.findById(replyId);
  if (!getReplyComment) {
    throw new ApiError(404, "Reply comment not found");
  }

  // update the reply comment
  getReplyComment.comment = comment;
  await getReplyComment.save();

  res.json(
    new ApiResponse(200, "Reply comment updated successfully", getReplyComment)
  );
});

const getReplyofComment = asyncHandler(async (req, res) => {
  const commentId = req.query.commentId;

  if (!commentId) {
    throw new ApiError(400, "Comment ID is required");
  }
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const comment = await CommentModel.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const totalComments = await ReplyModel.countDocuments({ commentId });

  let aggregation = [];
  aggregation.push({
    $match: { commentId: new mongoose.Types.ObjectId(commentId) },
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
    $sort: { createdAt: -1 },
  });
  aggregation.push({
    $skip: skip,
  });
  aggregation.push({
    $limit: limit,
  });

  aggregation.push({
    $project: {
      "user.name": 1,
      "user.profile_image": 1,
      "user.userId": 1,
      comment: 1,
      createdAt: 1,
    },
  });

  const comments = await ReplyModel.aggregate(aggregation);

  if (comments.length === 0) {
    return res.json(new ApiResponse(200, "No comments found", []));
  }

  res.json(
    new ApiResponse(200, "Comments fetched successfully", {
      comments,
      total_page: Math.ceil(totalComments / limit),
      current_page: page,
      total_records: totalComments,
      per_page: limit,
    })
  );

});

const getPostDetails = asyncHandler(async (req, res) => {
  const postId = req.params.postId;
  if (!postId) {
    throw new ApiError(400, "Post ID is required");
  }
  if (!isValidObjectId(postId)) {
    throw new ApiError(400, "Invalid post ID");
  }
  const getPost = await PostModel.findById(postId);
  if (!getPost) {
    throw new ApiError(404, "Post not found");
  }

  let aggregation = [];
  aggregation.push({
    $match: { _id: getPost._id },
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
    $addFields: {
      comment_count: { $size: "$comments" },
    },
  });

  // isLiked boolean field that logged in user liked the post or not
  aggregation.push({
    $addFields: {
      isLiked: {
        $gt: [
          {
            $size: {
              $setIntersection: [[req.user.userId], "$likedBy"],
            },
          },
          0,
        ],
      },
    },
  });

  aggregation.push({
    $unset: ["likedBy", "comments"],
  });


  aggregation.push({
    $project: {
      "user.name": 1,
      "user.profile_image": 1,
      "user.userId": 1,
      title: 1,
      description: 1,
      type: 1,
      media: 1,
      likes: 1,
      isLiked: 1,
      comment_count: 1,
      createdAt: 1,
      "user.profile_image": {
        $ifNull: [
          "$user.profile_image",
          `${req.protocol}://${req.hostname}:${process.env.PORT}/placeholder/image_place.png`,
        ],
      },
    },
  });

  const post = await PostModel.aggregate(aggregation);

  res.json(new ApiResponse(200, "Post details", post));
});

const getPostLikedBy = asyncHandler(async (req, res) => {
  const postId = req.params.postId;
  if (!postId) {
    throw new ApiError(400, "Post ID is required");
  }
  if (!isValidObjectId(postId)) {
    throw new ApiError(400, "Invalid post ID");
  }

  const post = await PostModel.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  let aggregation = [];
  aggregation.push({
    $match: { userId: { $in: post.likedBy } },
  });
  aggregation.push({
    $project: {
      name: 1,
      profile_image: 1,
      userId: 1,
    },
  });

  const users = await User.aggregate(aggregation);

  res.json(new ApiResponse(200, "Post liked by users", users));
});

const getShortsVideo = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const aggregation = [
    {
      $match: { mediaType: "video" },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "userId",
        as: "user",
        pipeline: [
          {
            $match: { isDeleted: { $ne: true } },
          },
        ],
      },
    },
    {
      $unwind: "$user",
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $facet: {
        posts: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              "user.name": 1,
              "user.profile_image": 1,
              "user.userId": 1,
              title: 1,
              description: 1,
              type: 1,
              media: 1,
              likes: 1,
              comment_count: { $size: "$comments" },
            },
          },
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const result = await PostModel.aggregate(aggregation);

  const posts = result[0]?.posts || [];
  const totalCount = result[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  res.json(
    new ApiResponse(
      200,
      posts.length
        ? "Short Videos fetched successfully"
        : "No Short Video found",
      {
        posts,
        total_page: totalPages,
        current_page: page,
        total_records: totalCount,
        per_page: limit,
      }
    )
  );
});

const getHomeFeed = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;
  const type = req.query.type || "social";
  if (type !== "social" && type !== "professional") {
    throw new ApiError(
      400,
      "Invalid type. Type should be either social or professional"
    );
  }

  // add filter global , local and trending
  const filter = req.query.filter || "global";
  if (filter !== "global" && filter !== "local" && filter !== "trending") {
    throw new ApiError(
      400,
      "Invalid filter. Filter should be either global, local or trending"
    );
  }

  const [education, experience] = await Promise.all([
    Education.aggregate([
      { $match: { userId: req.user.userId, isDeleted: { $ne: true }, role: "user" } },
      {
        $group: {
          _id: null,
          institutionNames: { $addToSet: "$institutionName" },
          degrees: { $addToSet: "$degree" },
          fieldsOfStudy: { $addToSet: "$fieldOfStudy" },
          skills: { $addToSet: "$skills" },
        },
      },
    ]),
    Experience.aggregate([
      { $match: { userId: req.user.userId, isDeleted: { $ne: true }, role: "user" } },
      {
        $group: {
          _id: null,
          companyNames: { $addToSet: "$companyName" },
          locations: { $addToSet: "$location" },
          skills: { $addToSet: "$skills" },
        },
      },
    ]),
  ]);

  const uniqueInstitutionNames = education[0]?.institutionNames || [];
  const uniqueDegrees = education[0]?.degrees || [];
  const uniqueFieldsOfStudy = education[0]?.fieldsOfStudy || [];
  const uniqueEducationSkills = education[0]?.skills || [];
  const uniqueLocations = experience[0]?.locations || [];
  const uniqueCompanyNames = experience[0]?.companyNames || [];
  const uniqueExperienceSkills = experience[0]?.skills || [];

  const optionalFilters = [];
  if (filter === "local") {
    optionalFilters.push({ "user.city": req.user.city });
  } else if (filter === "global" || filter === "trending") {
    optionalFilters.push({});
  }

  optionalFilters.push({
    $expr: {
      $gt: [
        {
          $size: {
            $setIntersection: [uniqueCompanyNames, "$experience.companyName"],
          },
        },
        0,
      ],
    },
  });
  optionalFilters.push({
    $expr: {
      $gt: [
        {
          $size: {
            $setIntersection: [
              uniqueInstitutionNames,
              "$education.institutionName",
            ],
          },
        },
        0,
      ],
    },
  });
  optionalFilters.push({
    $expr: {
      $gt: [
        {
          $size: {
            $setIntersection: [uniqueDegrees, "$education.degree"],
          },
        },
        0,
      ],
    },
  });
  optionalFilters.push({
    $expr: {
      $gt: [
        {
          $size: {
            $setIntersection: [uniqueFieldsOfStudy, "$education.fieldOfStudy"],
          },
        },
        0,
      ],
    },
  });
  optionalFilters.push({
    $expr: {
      $gt: [
        {
          $size: {
            $setIntersection: [uniqueLocations, "$experience.location"],
          },
        },
        0,
      ],
    },
  });
  optionalFilters.push({
    $expr: {
      $gt: [
        {
          $size: {
            $setIntersection: [uniqueCompanyNames, "$experience.companyName"],
          },
        },
        0,
      ],
    },
  });
  optionalFilters.push({
    $expr: {
      $gt: [
        {
          $size: {
            $setIntersection: [uniqueExperienceSkills, "$experience.skills"],
          },
        },
        0,
      ],
    },
  });
  optionalFilters.push({
    $expr: {
      $gt: [
        {
          $size: {
            $setIntersection: [uniqueEducationSkills, "$education.skills"],
          },
        },
        0,
      ],
    },
  });

  // add isLiked boolean field that logged in user liked the post or not

  const reportedPosts = await ReportedPost.find({
    reportedBy: req.user.userId,
  }).distinct("postId");


  const aggregation = [];
  aggregation.push({
    $match: { type: type, _id: { $nin: reportedPosts } },
  });

  // remove the post who isDeleted is true
  aggregation.push({
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "userId",
      as: "user",
      pipeline: [
        {
          $match: {
            isDeleted: { $ne: true },
          },
        },
      ],
    },
  });
  aggregation.push({
    $unwind: {
      path: "$user",
    },
  });

  aggregation.push({
    $lookup: {
      from: "experiences",
      localField: "userId",
      foreignField: "userId",
      as: "experience",
    },
  });

  aggregation.push({
    $lookup: {
      from: "educations",
      localField: "userId",
      foreignField: "userId",
      as: "education",
    },
  });

  aggregation.push({
    $match: {
      $or: optionalFilters,
    },
  });

  if (filter === "trending") {
    aggregation.push({
      $sort: { likes: -1 },
    });
  } else {
    aggregation.push({
      $sort: { createdAt: -1 },
    });
  }

  aggregation.push({
    $addFields: {
      isLiked: {
        $gt: [
          {
            $size: {
              $setIntersection: [[req.user.userId], "$likedBy"],
            },
          },
          0,
        ],
      },
    },
  });


  aggregation.push({
    $facet: {
      posts: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            "user.name": 1,
            "user.profile_image": {
              $ifNull: [
                "$user.profile_image",
                `${req.protocol}://${req.get("host")}/placeholder/image_place.png`,
              ],
            },
            "user.userId": 1,
            title: 1,
            description: 1,
            type: 1,
            media: 1,
            mediaType: 1,
            likes: 1,
            isLiked: 1,
            comment_count: { $size: "$comments" },
            mediaWidth: 1,
            mediaHeight: 1,
            mediaAspectRatio: 1,
            mediaOrientation: 1,
          },
        },
      ],
      totalCount: [{ $count: "count" }],
    },
  });

  const result = await PostModel.aggregate(aggregation);
  const posts = result[0]?.posts || [];
  const totalCount = result[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  res.json(
    new ApiResponse(
      200,
      posts.length ? "Home Feed fetched successfully" : "No Home Feed found",
      {
        posts,
        total_page: totalPages,
        current_page: page,
        total_records: totalCount,
        per_page: limit,
      }
    )
  );
});

const deletePost = asyncHandler(async (req, res) => {
  const postId = req.params.postId;
  if (!postId) {
    throw new ApiError(400, "Post ID is required");
  }
  if (!isValidObjectId(postId)) {
    throw new ApiError(400, "Invalid post ID");
  }
  console.log(postId);
  const post = await PostModel.findById(postId);
  console.log(post);
  // delete post images and videos from s3
  if (!post) {
    throw new ApiError(404, "Post not found");
  }
  if (post.media) {
    const media = post.media;
    console.log(media);
    if (Array.isArray(media)) {
      for (const file of media) {
        const fileName = file.split("/").pop();
        await deleteObject(fileName);
      }
    } else {
      console.log(media);
      const fileName = media.split("/").pop();
      const result = await deleteObject(fileName);
      console.log(result);
    }
  }

  await PostModel.deleteOne({ _id: postId });

  res.json(new ApiResponse(200, "Post deleted successfully",null));
});


const reportPost = asyncHandler(async (req, res) => {
  const { postId, reason } = req.body;
  if (!postId) {
    throw new ApiError(400, "Post ID is required");
  }

  if (!isValidObjectId(postId)) {
    throw new ApiError(400, "Invalid post ID");
  }


  const post = await PostModel.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const reportedPostExists = await ReportedPost.findOne({
    postId,
    reportedBy: req.user.userId,
  });

  if (reportedPostExists) {
    throw new ApiError(400, "You have already reported this post");
  }


  const reportedPost = new ReportedPost({
    postId,
    reportedBy: req.user.userId,
    reason,
  });
  await reportedPost.save();
  res.json(new ApiResponse(200, "Post reported successfully", reportedPost));
});



// const getAllReportedPosts = asyncHandler(async (req, res) => {
//   const page = Math.max(1, parseInt(req.query.page) || 1);
//   const limit = Math.max(1, parseInt(req.query.limit) || 10);
//   const skip = (page - 1) * limit;


//   const role = req.user.role;
//   if (!role.includes("admin")) {
//     throw new ApiError(403, "You are not authorized to access this resource");
//   }

//   const aggregation = [];

//   aggregation.push({ $sort: { createdAt: -1 } });


//   aggregation.push({
//     $lookup: {
//       from: "posts",
//       localField: "postId",
//       foreignField: "_id",
//       as: "post",
//     },
//   });
//   aggregation.push({ $unwind: { path: "$post", preserveNullAndEmptyArrays: true } });


//   aggregation.push({
//     $lookup: {
//       from: "users",
//       localField: "reportedBy",
//       foreignField: "userId",
//       as: "user",
//     },
//   });
//   aggregation.push({ $unwind: { path: "$user", preserveNullAndEmptyArrays: true } });

//   aggregation.push({
//     $facet: {
//       reportedPosts: [
//         { $skip: skip },
//         { $limit: limit },
//         {
//           $project: {
//             _id: 1,
//             postId: 1,
//             reportedBy: 1,
//             reason: 1,
//             createdAt: 1,
//             updatedAt: 1,
//             post: {
//               _id: "$post._id",
//               title: "$post.title",
//               content: "$post.content",
//               media: "$post.media",
//               createdAt: "$post.createdAt",
//               updatedAt: "$post.updatedAt",
//             },
//             user: {
//               _id: "$user._id",
//               name: "$user.name",
//               email: "$user.email",
//               profile_image: {
//                 $ifNull: [
//                   "$user.profile_image",
//                   `${req.protocol}://${req.get("host")}/placeholder/image_place.png`,
//                 ],
//               },
//             },
//           },
//         },
//       ],
//       totalCount: [{ $count: "count" }],
//     },
//   });


//   const result = await ReportedPost.aggregate(aggregation);

//   const reportedPosts = result?.[0]?.reportedPosts || [];
//   const totalCount = result?.[0]?.totalCount?.[0]?.count || 0;
//   const totalPages = Math.ceil(totalCount / limit);

//   return res.json(
//     new ApiResponse(
//       200,
//       reportedPosts.length > 0 ? "Reported posts fetched successfully" : "No reported posts found",
//       reportedPosts.length > 0
//         ? {
//           reportedPosts,
//           total_page: totalPages,
//           current_page: page,
//           total_records: totalCount,
//           per_page: limit,
//         }
//         : null
//     )
//   );
// });

const getAllReportedPosts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const role = req.user.role;
  if (!role.includes("admin")) {
    throw new ApiError(403, "You are not authorized to access this resource");
  }

  const aggregation = [];

  // Group reports by postId
  aggregation.push({
    $group: {
      _id: "$postId",
      totalReports: { $sum: 1 },
      // reasons: { $push: "$reason" },
      // reporters: { $push: "$reportedBy" },
      latestReportTime: { $max: "$createdAt" },
    },
  });

  // Join with posts
  aggregation.push({
    $lookup: {
      from: "posts",
      localField: "_id",
      foreignField: "_id",
      as: "post",
    },
  });
  aggregation.push({ $unwind: { path: "$post", preserveNullAndEmptyArrays: true } });

  // Sort by latest report or total reports
  aggregation.push({ $sort: { latestReportTime: -1 } });

  // Pagination
  aggregation.push({ $skip: skip });
  aggregation.push({ $limit: limit });

  // Final shape
  aggregation.push({
    $project: {
      postId: "$_id",
      totalReports: 1,
      reasons: 1,
      reporters: 1,
      latestReportTime: 1,
      post: {
        _id: "$post._id",
        title: "$post.title",
        content: "$post.content",
        media: "$post.media",
        createdAt: "$post.createdAt",
        updatedAt: "$post.updatedAt",
        userId: "$post.userId",
        type: "$post.type",
        media: "$post.media",
        mediaType: "$post.mediaType",
        likes: "$post.likes",
        comments: "$post.comments",
      },
    },
  });

  // For total count
  const [groupedData, totalCountData] = await Promise.all([
    ReportedPost.aggregate(aggregation),
    ReportedPost.aggregate([
      {
        $group: {
          _id: "$postId",
        },
      },
      { $count: "count" },
    ]),
  ]);

  const reportedPosts = groupedData;
  const totalCount = totalCountData?.[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return res.json(
    new ApiResponse(
      200,
      reportedPosts.length > 0 ? "Grouped reported posts fetched successfully" : "No reports found",
      reportedPosts.length > 0
        ? {
          reportedPosts,
          total_page: totalPages,
          current_page: page,
          total_records: totalCount,
          per_page: limit,
        }
        : null
    )
  );
});




export {
  createPost,
  getPosts,
  likeDisLikePost,
  addComment,
  editComment,
  getComments,
  addReplyComment,
  getPostDetails,
  getPostLikedBy,
  editReplyComment,
  getReplyofComment,
  updatePost,
  getShortsVideo,
  getHomeFeed,
  deletePost,
  reportPost,
  getAllReportedPosts
};
