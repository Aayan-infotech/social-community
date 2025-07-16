import mongoose from "mongoose";

const eventLoginUserSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "VirtualEvent",
        required: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
    },
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    }
}, {
    timestamps: true,
    versionKey: false,
});

const EventLoginUser = mongoose.model("EventLoginUser", eventLoginUserSchema);

export default EventLoginUser;