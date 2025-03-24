import mongoose from 'mongoose';

const friendsSchema = new mongoose.Schema(
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
    friend_requests: {
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

export const FriendsModel = mongoose.model('Friends', friendsSchema);


