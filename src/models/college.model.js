import mongoose from "mongoose";

const collegeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String },
    logo: { type: String },
    establishedYear: { type: Number },
    description: { type: String }
}, {
    timestamps: true,
    versionKey: false
});
const College = mongoose.model("College", collegeSchema);

export default College;