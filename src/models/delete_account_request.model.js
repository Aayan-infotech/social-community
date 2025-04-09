import mongoose from "mongoose";

const deleteAccountRequestSchema = new mongoose.Schema(
  {
    userId: {
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
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export const DeleteAccountRequestModel = mongoose.model(
  "DeleteAccountRequest",
  deleteAccountRequestSchema
);
