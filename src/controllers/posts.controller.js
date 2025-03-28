import CommentModel from "../models/comment.model.js";
import PostModel from "../models/posts.model.js";
import ReplyModel from "../models/reply.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadImage } from "../utils/awsS3Utils.js";

const createPost = asyncHandler(async (req, res) => {
  const { title, description, type } = req.body;

  let media = [];
  if (req.files && req.files.media) {
    for (const file of req.files.media) {
      media.push(await uploadImage(file));
    }
  }

  // save the post data
  const post = new PostModel({
    title,
    description,
    type,
    userId: req.user.userId,
    media,
  });

  await post.save();
  res.status(200).json({
    status: 200,
    message: "Post created successfully",
    data: post,
  });
});

const updatePost = asyncHandler(async function (req, res) {
  const postId = req.params.postId;
  const { title, description, type } = req.body;
});

const getPosts = asyncHandler(async function (req, res) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  // do this with aggregation
  const excludeUserId = req.user.userId;
  const totalPosts = await PostModel.find({
    userId: { $ne: excludeUserId },
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
    $match: { userId: { $ne: excludeUserId } },
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
      likes: 1,
      likedBy: 1,
      comments: 1,
      createdAt: 1,
    },
  });

  const posts = await PostModel.aggregate(aggregation);
  console.log(posts);

  res.status(200).json({
    status: 200,
    message: "Posts fetched successfully",
    data: {
      posts,
      total_page: Math.ceil(totalPosts / limit),
      current_page: page,
      total_records: totalPosts,
      per_page: limit,
    },
  });
});

const likeDisLikePost = asyncHandler(async (req, res) => {
  const { postId, like } = req.body;
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

  res.status(200).json({
    status: 200,
    message: "Post liked/disliked successfully",
    data: post,
  });
});

const addComment = asyncHandler(async (req, res) => {
  const { postId, comment } = req.body;
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

  res.status(200).json({
    status: 200,
    message: "Comment added successfully",
    data: addComment,
  });

  // const post = await PostModel.findById(postId);
  // if (!post) {
  //   throw new ApiError(404, "Post not found");
  // }

  // post.comments.push({
  //   userId,
  //   comment,
  // });
  // await post.save();

  // res.status(200).json({
  //   status: 200,
  //   message: "Comment added successfully",
  //   data: post,
  // });
});

const editComment = asyncHandler(async function (req, res) {
  const { postId, commentId, comment } = req.body;
  const userId = req.user.userId;
  console.log(userId);

  const updateComment = await CommentModel.findOneAndUpdate(
    { _id: commentId, userId, postId },
    { comment },
    { new: true }
  );

  if (!updateComment) {
    throw new ApiError(404, "Comment not found");
  }

  res.status(200).json({
    status: 200,
    message: "Comment updated successfully",
    data: updateComment,
  });
});

const getComments = asyncHandler(async (req, res) => {
  const postId = req.params.postId;
  if (!postId) {
    throw new ApiError(400, "Post ID is required");
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

  res.status(200).json({
    status: 200,
    message: "Comments fetched successfully",
    data: {
      comments,
      total_page: Math.ceil(totalComments / limit),
      current_page: page,
      total_records: totalComments,
      per_page: limit,
    },
  });
});

const addReplyComment = asyncHandler(async (req, res) => {
  const { commentId, comment } = req.body;
  const userId = req.user.userId;

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

  res.status(200).json({
    status: 200,
    message: "Reply comment added successfully",
    data: replyComment,
  });
});

const getPostDetails = asyncHandler(async (req, res) => {
  const postId = req.params.postId;
  if (!postId) {
    throw new ApiError(400, "Post ID is required");
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
    },
  });

  const post = await PostModel.aggregate(aggregation);

  res.status(200).json({
    status: 200,
    message: "Post fetched successfully",
    data: post,
  });
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
};
