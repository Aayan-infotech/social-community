import mongoose from "mongoose";

const companiesSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String },
    logo: { type: String },
    establishedYear: { type: Number },
    description: { type: String }
}, {
    timestamps: true,
    versionKey: false
});
const Company = mongoose.model("Company", companiesSchema);

export default Company;
