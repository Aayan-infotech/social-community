import mongoose from "mongoose";


const degreeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
}, {
    timestamps: true,
    versionKey: false
});
const Degree = mongoose.model("Degree", degreeSchema);

export default Degree;