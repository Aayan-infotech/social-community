import mongoose from "mongoose";

const InterestListSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },
    type:{
        type:String,
        required: true,
        enum:["social","professional"]
    }
},{
    timestamps: true,
    versionKey: false
});


const InterestList = mongoose.model("InterestList", InterestListSchema);
export default InterestList;
