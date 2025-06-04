import mongoose from 'mongoose';

const ChatGroupSchema = new mongoose.Schema({
    groupName:{
        type: String,
        required: true,
    },
    groupDescription: {
        type: String,
        required: true,
    },
    members: [{
        type: String,
        ref: "User",
        required: true,
    }],
    groupAdmins: [{
        type: String,
        ref: "User",
        required: true,
    }],
    groupImage: {
        type: String,
        default: "https://example.com/default-group-image.png", 
    },
}, {
    timestamps: true,
});

const ChatGroup = mongoose.model("ChatGroup", ChatGroupSchema);
export default ChatGroup;
