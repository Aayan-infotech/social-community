import mongoose from "mongoose";

const commentSchema =  new mongoose.Schema(
    {
      userId: { type: String, ref: "User", required: true },
      postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
      comment: { type: String, required: true },
      replies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Reply" }], // Reference replies
    },
    { timestamps: true }
  );
  
  const CommentModel = mongoose.model("Comment", commentSchema);
  export default CommentModel;