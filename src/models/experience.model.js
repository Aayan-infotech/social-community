import mongoose from "mongoose";

const experienceSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    companyName: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    employmentType:{
        type: String,
        enum: ["Full-time", "Part-time", "Internship", "Self-employed", "Freelance", "Trainee"],
        required: true,
    },
    location: {
      type: String,
      required: true,
    },
    locationType: {
      type: String,
      enum: ["On-site", "Remote", "Hybrid"],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      default: null,
      required: false,
    },
    description: {
      type: String,
      default: null,
      required: false,
    },
    isCurrentWorking:{
        type: Boolean,
        default: true,
    },
    skills: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Experience = mongoose.model("Experience", experienceSchema);
