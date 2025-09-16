import mongoose from "mongoose";

const communitySchema = new mongoose.Schema({
    religion: { type: String, required: true},
    name: { type: String, required: true}
}, {
    timestamps: true,
    versionKey: false
});

const Community = mongoose.model("Community", communitySchema);

export default Community;
