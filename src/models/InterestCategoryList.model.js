import mongoose from "mongoose";

const interestCategoryListSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: ["social", "professional"]
    }
},{
    timestamps: true,
    versionKey: false
});

const InterestCategoryList = mongoose.model("InterestCategoryList", interestCategoryListSchema);

export default InterestCategoryList;
