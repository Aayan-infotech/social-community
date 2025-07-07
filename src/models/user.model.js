import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

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
    country: {
      type: String,
      required: false,
      default: null,
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
      enum: ["male", "female", "other"],
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
      ref: "User",
      default: null,
      required: false,
      immutable: true,
    },
    referrals: {
      type: [String],
      ref: "User",
      default: [],
      required: false,
    },
    bio: {
      type: String,
      required: false,
    },
    profile_image: {
      type: String,
      default: null,
    },
    device_token: {
      type: [String],
      default: [],
    },
    latitude: {
      type: String,
      default: null,
    },
    longitude: {
      type: String,
      default: null,
    },
    language: {
      type: String,
      default: "en",
    },
    previous_passwords: {
      type: [String],
      required: true,
      default: [],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
    isMobileVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
    aboutMe: {
      type: String,
      default: null,
    },
    matrimonialAboutMe: {
      type: String,
      default: null,
    },
    maritalStatus: {
      type: String,
      enum: ["single", "married", "divorced", "widowed"],
      default: null,
    },
    dob: {
      type: Date,
      default: null,
    },
    address: {
      type: String,
      default: null,
    },
    nativePlace: {
      type: String,
      default: null,
    },
    birthPlace: {
      type: String,
      default: null,
    },
    height: {
      type: String,
      default: null,
    },
    weight: {
      type: String,
      default: null,
    },
    complexion: {
      type: String,
      default: null,
    },
    religion: {
      type: String,
      default: null,
    },
    caste: {
      type: String,
      default: null,
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
    role: {
      type: [String],
      enum: ["user", "admin" ,"event_manager","vendor"],
      default: ["user"],
    },
    professional_image: {
      type: String,
      default: null,
    },
    stripeAccountId: {
      type: String,
      default: null,
    },
    isKYCVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (this.previous_passwords.length >= 5) {
    this.previous_passwords.shift();
  }
  this.previous_passwords.push(this.password);
  next();
});

userSchema.methods.isPreviousPassword = async function (password) {
  for (const hashedPassword of this.previous_passwords) {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    if (isMatch) {
      return true;
    }
  }
  return false;
};

// check if the password is correct using bcrypt

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullname: this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

// handle the previous_password_change event

export const User = mongoose.model("User", userSchema);
