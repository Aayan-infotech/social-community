import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: null },
    type: { type: String, enum: ["social", "professional"], required: true },
    media: { type: [String], default: [] },
    likes: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] },
    userId: { type: String, ref: "User", required: true },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }], // Reference comments
  },
  { timestamps: true }
);

const PostModel = mongoose.model("Post", postSchema);
export default PostModel;
