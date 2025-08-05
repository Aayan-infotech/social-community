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
    min: 1,
    default: 1,
  },
  product_quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  product_discount: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0,
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
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
},{
    timestamps: true,
    versionKey: false,
});

const Product = mongoose.model("Product", productSchema);
export default Product;
