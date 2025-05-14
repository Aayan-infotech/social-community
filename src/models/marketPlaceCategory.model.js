import mongoose from "mongoose";

const marketPlaceCategorySchema = new mongoose.Schema({
  category_name: {
    type: String,
    required: true,
  },
  category_image: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    ref: "User",
    required: true,
  },
});
const MarketPlaceCategory = mongoose.model(
  "MarketPlaceCategory",
  marketPlaceCategorySchema
);
export default MarketPlaceCategory;
