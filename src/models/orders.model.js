import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  sellerId: {
    type: String,
    ref: "User",
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "placed", "shipped", "completed", "cancelled"],
    default: "pending"
  },
  isTransferred: {
    type: Boolean,
    default: false
  },
  transferAmount: {
    type: Number,
    default: 0
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true
  },
  buyerId: {
    type: String,
    ref: "User",
    required: true
  },
  shippingAddressId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address",
    required: true
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: v => Array.isArray(v) && v.length > 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: "pending"
  },
  transferGroup: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  versionKey: false
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
