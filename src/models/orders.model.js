import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
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
    enum: ["pending", "placed", "shipped", "delivered", "cancelled"],
    default: "pending"
  },
  // trackingId: {
  //   type: String,
  //   default: null
  // },
  // carrierPartner: {
  //   type: String,
  //   default: null
  // },
  // cancellationRemark: {
  //   type: String,
  //   default: null
  // },
  // isTransferred: {
  //   type: Boolean,
  //   default: false
  // },
  // transferAmount: {
  //   type: Number,
  //   default: 0
  // },
  // placeOrderDate: {
  //   type: Date,
  //   default: null
  // },
  // shippingDate: {
  //   type: Date,
  //   default: null
  // },
  // deliveryDate: {
  //   type: Date,
  //   default: null
  // },
  // cancellationDate: {
  //   type: Date,
  //   default: null
  // }
}, {
  _id: false,
  timestamps: true
});

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
  sellerId: {
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
  status: {
    type: String,
    enum: ["pending", "placed", "shipped", "delivered", "cancelled"],
    default: "pending"
  },
  paymentIntentId: {
    type: String,
    required: true
  },
  transferGroup: {
    type: String,
    required: true
  },
  trackingId: {
    type: String,
    default: null
  },
  carrierPartner: {
    type: String,
    default: null
  },
  cancellationRemark: {
    type: String,
    default: null
  },
  isTransferred: {
    type: Boolean,
    default: false
  },
  transferAmount: {
    type: Number,
    default: 0
  },
  placeOrderDate: {
    type: Date,
    default: null
  },
  shippingDate: {
    type: Date,
    default: null
  },
  deliveryDate: {
    type: Date,
    default: null
  },
  cancellationDate: {
    type: Date,
    default: null
  }

}, {
  timestamps: true,
  versionKey: false
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
