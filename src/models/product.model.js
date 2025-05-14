import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  product_name: {
    type: String,
    required: true,
  },
  product_image: {
    type: [String],
    required: true,
  },
  product_price: {
    type: Number,
    required: true,
  },
  product_discount: {
    type: Number,
    required: true,
  },
  product_description: {
    type: String,
    required: false,
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MarketPlaceCategory",
    required: true,
  },
  subcategory_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MarketPlaceSubCategory",
    required: true,
  },
  userId: {
    type: String,
    ref: "User",
    required: true,
  },
},{
    timestamps: true,
    versionKey: false,
});

const Product = mongoose.model("Product", productSchema);
export default Product;
