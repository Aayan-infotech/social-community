import mongoose from "mongoose";

const businessSchema = new mongoose.Schema({
    categoryId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "BusinessCategory",
        required: true,
    },
    businessName: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    latitude: {
        type: String,
        required: true,
    },
    longitude: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: false,
    },
    userId: {
        type: String,
        ref: "User",
        required: true,
    },
    businessImage: {
        type: [String],
        required: false,
    },
    status:{
        type: Boolean,
        default: false,
    }
},{ timestamps: true });
const Business = mongoose.model("Business", businessSchema);
export default Business;