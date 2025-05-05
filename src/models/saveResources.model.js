import mongoose from "mongoose";

const saveResourcesSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    type: {
      type: String,
      enum: ["health_wellness", "job", "post", "event"],
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const saveResourceModel = mongoose.model("SaveResource", saveResourcesSchema);
export default saveResourceModel;
