import mongoose from "mongoose";

const businessCategorySchema = new mongoose.Schema({
  category_name: {
    type: String,
    required: true,
  },
  category_image: {
    type: String,
    required: false,
  },
  userId: {
    type: String,
    ref: "User",
    required: true,
  },
});

const BusinessCategory = mongoose.model(
  "BusinessCategory",
  businessCategorySchema
);

export default BusinessCategory;
