import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    userId: { type: String, ref: "User", required: true },
    resume: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const ResumeModel = mongoose.model("Resume", resumeSchema);
export default ResumeModel;
