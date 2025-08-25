import mongoose from "mongoose";

const userInterestSchema = new mongoose.Schema({
    userId: {
        type: String,
        ref: "User",
        required: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InterestCategoryList",
        required: true
    },
    interestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InterestList",
        required: true
    }
}, { timestamps: true, versionKey: false });

const UserInterest = mongoose.model("UserInterest", userInterestSchema);

export default UserInterest;
