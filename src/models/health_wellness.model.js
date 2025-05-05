import mongoose from "mongoose";

const healthWellnessSchema = new mongoose.Schema({
    userId:{
        type:"String",
        required:true,
        ref:"User"
    },
    title:{
        type:"String",
        required:true,
    },
    description:{
        type:"String",
        required:true,
    },
    location:{
        type:"String",
        required:false,
        default:null,
    },
    resourceImage:{
        type:"String",
        default:null,
    },
},{
    timestamps:true
});

const HealthWellnessModel = mongoose.model("HealthWellness", healthWellnessSchema);
export default HealthWellnessModel;
