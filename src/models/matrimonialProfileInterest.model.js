import mongoose from "mongoose";

const interestInProfileSchema = new mongoose.Schema({
    userId:{
        type: String,
        required: true,
        ref: 'User'
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MatrimonialProfile',
        required: true,
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MatrimonialProfile',
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
