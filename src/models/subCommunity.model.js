import mongoose from "mongoose";

const subCommunitySchema = new mongoose.Schema({
    community: { type: mongoose.Schema.Types.ObjectId, ref: "Community", required: true },
    name: { type: String, required: true}
}, {
    timestamps: true,
    versionKey: false   
});

const SubCommunity = mongoose.model("SubCommunity", subCommunitySchema);

export default SubCommunity;
