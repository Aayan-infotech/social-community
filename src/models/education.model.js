import mongoose from "mongoose";

const educationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    institutionName: {
      type: String,
      required: true,
    },
    degree: {
      type: String,
      required: true,
    },
    fieldOfStudy: {
      type: String,
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
    skills: {
      type: [String],
      default: [],
    },
    grade: {
      type: String,
      default: null,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Education = mongoose.model("Education", educationSchema);