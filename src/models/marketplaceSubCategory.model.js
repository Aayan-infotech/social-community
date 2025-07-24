import mongoose from "mongoose";

const marketplaceSubCategorySchema = new mongoose.Schema({
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MarketPlaceCategory",
    required: true,
  },
  subcategory_name: {
    type: String,
    required: true,
  },
  subcategory_image: {
    type: String,
    required: true,
  },
});

const MarketPlaceSubCategory = mongoose.model(
  "MarketPlaceSubCategory",
  marketplaceSubCategorySchema
);
export default MarketPlaceSubCategory;
