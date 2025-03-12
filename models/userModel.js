import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    mobile: {
      type: String,
      unique: true,
      sparse: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    state: {
      type: String,
      required: false,
      default: null,
    },
    city: {
      type: String,
      required: false,
      default: null,
    },
    gender: {
      type: String,
      required: false,
      enum: ['male', 'female', 'other'],
      default: null,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      default: null,
    },
    refreshToken: {
      type: String,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpire: {
      type: Date,
      default: null,
    },
    referralCode: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },
    referredBy: {
      type: String,
      ref: 'User',
      default: null,
      required: false,
      immutable: true,
    },
    referrals: {
      type: [String],
      ref: 'User',
      default: [],
      required: false,
    },
    bio:{
      type:String,
      required: false,
    }
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

export default User;
