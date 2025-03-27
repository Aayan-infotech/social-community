import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
  {
    userId: { type: String, ref: "User", required: true },
    comment: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const commentSchema = new mongoose.Schema(
  {
    userId: { type: String, ref: "User", required: true },
    comment: { type: String, required: true },
    replies: {
      type: [replySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: null,
    },
    type:{
        type: String,
        enum: ["social", "professional"],
        required: true,
    },
    media: {
      type: [String],
      default: [],
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: {
      type: [String],
      default: [],
    },
    comments: {
      type: [commentSchema],
      default: [],
    },
    userId: {
      type: String,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const PostModel = mongoose.model("Post", postSchema);

export default PostModel;
