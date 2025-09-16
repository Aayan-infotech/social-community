import mongoose from "mongoose";

const InterestCategoryListSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: ["social", "professional",'matrimonial']
    }
},{
    timestamps: true,
    versionKey: false
});

const InterestCategoryList = mongoose.model("InterestCategoryList", InterestCategoryListSchema);

export default InterestCategoryList;
