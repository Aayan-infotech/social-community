import mongoose from "mongoose";

const ticketBookingSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        ref: 'User',
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'VirtualEvent',
    },
    ticketCount: {
        type: Number,
        required: true,
        default: 1,
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    bookingStatus: {
        type: String,
        required: true,
        enum: ['booked', 'cancelled'],
        default: 'booked',
    },
    bookingDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    bookingTime:{
        type: String,
        required: true,
    },
    ticketId: {
        type: String,
        required: true,
        unique: true,
    },
    paymentStatus: {
        type: String,
        required: true,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending',
    },
}, {
    timestamps: true,
    versionKey: false,
});

const TicketBooking = mongoose.model('TicketBooking', ticketBookingSchema);
export default TicketBooking;