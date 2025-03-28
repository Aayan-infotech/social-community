import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
    {
      userId: { type: String, ref: "User", required: true },
      commentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", required: true },
      comment: { type: String, required: true },
    },
    { timestamps: true }
  );
  
  const ReplyModel = mongoose.model("Reply", replySchema);
  export default ReplyModel;