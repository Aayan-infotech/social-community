import mongoose from "mongoose";

const hobbySchema = new mongoose.Schema({
    userId: {
        type: String,
        ref: "User",
        required: true,
    },
    profileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MatrimonialProfile",
        required: true,
    },
    hobbiesIds: [{ type: String, required: true }],
}, { timestamps: true, versionKey: false });

const Hobby = mongoose.model("Hobby", hobbySchema);
export default Hobby;