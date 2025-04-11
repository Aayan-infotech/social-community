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
} from "../utils/awsS3Utils.js";
import fs, { stat } from "fs";
import { isValidObjectId } from "../utils/isValidObjectId.js";
import { url } from "inspector";

const createPost = asyncHandler(async (req, res) => {
  const { title, description, type } = req.body;

  // let media = [];
  let media = null;
  let mediaType = null;
  if (req.files && req.files.media) {
    const file = req.files.media[0];
    // for (const file of req.files.media) {
    // console.log(file);
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
    // remove the file from the server
    fs.unlinkSync(file.path);
    // }
  }

  // save the post data
  const post = new PostModel({
    title,
    description,
    type,
    userId: req.user.userId,
    media,
    mediaType,
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

  // update the post images and videos
  let media = post.media || [];
  if (req.files && req.files.media) {
    for (const file of req.files.media) {
      if (file.mimetype !== "video/mp4") {
        const saveUpload = await saveCompressedImage(file, 600);
        if (!saveUpload.success) {
          throw new ApiError(400, "Image upload failed");
        } else {
          post.media.push(saveUpload.thumbnailUrl);
        }
      } else {
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
          post.media.push(upload.videoUrl);
        }
      }

      fs.unlinkSync(file.path);
    }
  }

  post.title = title || post.title;
  post.description = description || post.description;
  post.type = type || post.type;
  post.media = media || post.media;

  await post.save();

  res.json(new ApiResponse(200, "Post updated successfully", post));
});

const getPosts = asyncHandler(async function (req, res) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;
  const userId = req.query.userId || req.user.userId;

  const getUser = await User.find({ userId });
  if (!getUser.length > 0) {
    throw new ApiError(400, "Invalid User Id");
  }

  // do this with aggregation
  // const excludeUserId = req.user.userId;
  const totalPosts = await PostModel.find({
    userId: { $eq: userId },
  }).countDocuments();

  let aggregation = [];
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
    $match: { userId: { $eq: userId } },
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
      title: 1,
      description: 1,
      type: 1,
      media: 1,
      mediaType: 1,
      likes: 1,
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
  if(!isValidObjectId(postId)){
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
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const aggregation = [];
  aggregation.push({
    $match: { commentId: commentId },
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
    skip: skip,
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

  const replyComments = await ReplyModel.aggregate(aggregation);
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
      comment_count: 1,
      createdAt: 1,
      "user.profile_image": {
        $ifNull: [
          "$user.profile_image",
          `${req.protocol}://${req.hostname}:${process.env.PORT}/placeholder/person.png`,
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
        totalCount: [
          { $count: "count" },
        ],
      },
    },
  ];

  const result = await PostModel.aggregate(aggregation);

  const posts = result[0]?.posts || [];
  const totalCount = result[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  res.json(
    new ApiResponse(200, posts.length ? "Short Videos fetched successfully" : "No Short Video found", {
      posts,
      total_page: totalPages,
      current_page: page,
      total_records: totalCount,
      per_page: limit,
    })
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
};
