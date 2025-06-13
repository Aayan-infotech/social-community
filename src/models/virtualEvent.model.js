import mongoose from 'mongoose';

const virtualEventSchema = new mongoose.Schema({
    eventName: {
        type: String,
        required: true,
        unique: true,
    },
    eventDescription: {
        type: String,
        required: false,
    },
    eventLocation: {
        type: String,
        required: true,
    },
    eventStartDate: {
        type: Date,
        required: true,
    },
    eventEndDate: {
        type: Date,
        required: true,
    },
    eventImage: {
        type: String,
        required: false,
    },
    ticketPrice: {
        type: Number,
        required: true,
        default: 0,
    },
    userId:{
        type: String,
        required: true,
        ref:'User',
    }
}, {
    timestamps: true,
    versionKey: false,
});

const VirtualEvent = mongoose.model('VirtualEvent', virtualEventSchema);
export default VirtualEvent;