import mongoose from "mongoose";

const appliedJobSchema = new mongoose.Schema({
    userId: { type: String, ref: "User", required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: "Resume", required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    currentCTC: { type: String, default: null },
    expectedCTC: { type: String, default: null },
    noticePeriod: { type: String, default: null },
    status: { type: String, enum: ["applied", "shortlisted", "rejected"], default: "applied" },
}, { timestamps: true });

const ApplyJobModel = mongoose.model("AppliedJob", appliedJobSchema);
export default ApplyJobModel;