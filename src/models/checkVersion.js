import mongoose from "mongoose";

const versionSchema = new mongoose.Schema({
  version: {
    type: String,
    required: true,
  },
}, { timestamps: true }
);

const Version = mongoose.model("Version", versionSchema);

export default Version;
