import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
  {
    members: [
      {
        type: String,
        ref: "User",
        required: true,
      },
    ],
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    chatGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatGroup",
      required: function () {
        return this.isGroupChat;
      },
    },
    latestMessage: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Chat = mongoose.model("Chat", ChatSchema);
export default Chat;
