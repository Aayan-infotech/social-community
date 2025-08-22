import mongoose from "mongoose";
import { type } from "os";

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: null },
    type: { type: String, enum: ["social", "professional"], required: true },
    // media: [
    //   {
    //     url: { type: String, required: true },
    //     type: { type: String, enum: ["image", "video"], required: true },
    //   },
    // ],
    media: { type: String, required: false },
    mediaType: { type: String, enum: ["image", "video", "text"], required: true },
    mediaWidth: { type: String, default: null },
    mediaHeight: { type: String, default: null },
    mediaAspectRatio: { type: String, default: null },
    mediaOrientation: { type: String, default: null },
    likes: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] },
    userId: { type: String, ref: "User", required: true },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }], // Reference comments
  },
  { timestamps: true }
);

const PostModel = mongoose.model("Post", postSchema);
export default PostModel;
