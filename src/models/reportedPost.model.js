import mongoose from "mongoose";

const reportPostSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true,
    },
    reportedBy: {
        type: String,
        ref: "User",
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "resolved", "rejected", "removed"],
        default: "pending",
    },
}, { timestamps: true });

const ReportedPost = mongoose.model("ReportPost", reportPostSchema);

export default ReportedPost;
