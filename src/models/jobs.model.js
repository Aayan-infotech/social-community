import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    description: { type: String, default: null },
    location: { type: String, required: true },
    companyName: { type: String, required: true },
    position: { type: String, required: true },
    userId: { type: String, ref: "User", required: true },
    salary:{type:String,default:null},
    jobImage:{ type: String, default: null },
    isDeleted: { type: Boolean, default: false },
    requiredSkills: { type: [String], default: [] },
  },
  { timestamps: true }
);

const JobModel = mongoose.model("Job", jobSchema);
export default JobModel;

