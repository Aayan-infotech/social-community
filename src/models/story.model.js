import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      ref: "user",
      required: true,
    },
    mediaType: {
      type: String,
      enum: ["image", "video", "text"],
      required: true,
    },
    mediaUrl: {
      type: String,
      default: null,
      required: false,
    },
    description: {
      type: String,
      default: null,
      required: false,
    },
    likes: {
      type: Number,
      default: 0,
      required: false,
    },
    likedBy: [
      {
        type: String,
        ref: "user",
      },
    ],
  },
  { timestamps: true }
);

export const Story = mongoose.model("story", storySchema);

