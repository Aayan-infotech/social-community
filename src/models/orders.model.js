import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    transferGroup: {
        type: String,
        required: true
    },
    orderId: {
        type: String,
        required: true
    },
    sellerId: {
        type: String,
        ref: "User",
        required: true
    },
    buyerId: {
        type: String,
        ref: "User",
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
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
        enum: ["pending","placed","shipped","completed", "cancelled"],
        default: "pending"
    },
    quantity: {
        type: Number,
        required: true
    },
    shippingAddressId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: "pending"
    },
    isTransferred: {
        type: Boolean,
        default: false
    },
    transferAmount: {
        type: Number,
        default: 0
    },
}, {
    timestamps: true,
    versionKey: false
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
