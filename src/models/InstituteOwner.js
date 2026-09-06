import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { INSTITUTE_OWNER_STATUS } from "../constants/enums.js";

const instituteOwnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: false,  // Not required for Google sign-ups
    trim: true,
    maxlength: 15,
    default: '',
  },
  password: {
    type: String,
    required: function() {
      // Password not required for Google OAuth users
      return this.authProvider !== 'google';
    },
    validate: {
      validator: function(v) {
        // Skip validation for Google OAuth users or empty passwords
        if (this.authProvider === 'google' || !v) return true;
        return v.length >= 6;
      },
      message: 'Password must be at least 6 characters long'
    },
    select: false,
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true,
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },
  profilePhoto: {
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
  },
  status: {
    type: String,
    enum: Object.values(INSTITUTE_OWNER_STATUS),
    default: INSTITUTE_OWNER_STATUS.PENDING,
  },
  address: {
    line1: { type: String, default: "" },
    line2: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
    country: { type: String, default: "India" },
  },
  bio: {
    type: String,
    default: "",
    maxlength: 500,
  },
  dateOfBirth: {
    type: Date,
  },
  gender: {
    type: String,
    enum: ["male", "female", "other", ""],
    default: "",
  },
  aadhaarNumber: {
    type: String,
    default: "",
  },
  panNumber: {
    type: String,
    default: "",
  },
  businessName: {
    type: String,
    default: "",
  },
  totalInstitutes: {
    type: Number,
    default: 0,
  },
  wallet: {
    coins: {
      type: Number,
      default: 0,
    },
    transactions: [{
      type: {
        type: String,
        enum: ['credit', 'debit'],
      },
      amount: Number,
      description: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  referredBy: {
    type: String,
    default: '',
  },
  referralRewardsGiven: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

instituteOwnerSchema.pre("save", async function (next) {
  // Skip password hashing for Google OAuth users
  if (!this.password || !this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

instituteOwnerSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

instituteOwnerSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const InstituteOwner = mongoose.model("InstituteOwner", instituteOwnerSchema);

export default InstituteOwner;
