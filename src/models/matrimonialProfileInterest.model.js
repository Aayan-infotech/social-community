import mongoose from "mongoose";

const interestInProfileSchema = new mongoose.Schema({
    senderId: {
        type: String,
        required: true,
    },
    receiverId: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
    },
},
    {
        timestamps: true,
    });

const InterestInProfileModel = mongoose.model("InterestInProfile", interestInProfileSchema);

export default InterestInProfileModel;
