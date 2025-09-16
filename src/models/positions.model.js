import mongoose from "mongoose";

const positionsSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String }
}, {
    timestamps: true,
    versionKey: false
});
const Position = mongoose.model("Position", positionsSchema);

export default Position;