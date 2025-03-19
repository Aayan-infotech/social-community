import mongoose from 'mongoose';

const friendListSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      unique: true,
      index: true,
    },
    friends: {
      type: [String],
      ref: 'User',
      default: [],
      required: false,
    },
    friend_request: {
      type: [String],
      ref: 'User',
      default: [],
      required: false,
    }
  },
  {
    timestamps: true,
  }
);

const Friend_List = mongoose.model('Friend_List', friendListSchema);

export default Friend_List;
