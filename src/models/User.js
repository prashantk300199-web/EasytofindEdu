import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { USER_STATUS } from "../constants/enums.js";

const userSchema = new mongoose.Schema({
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
    required: true,
    trim: true,
    maxlength: 15,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false,
  },
  profilePhoto: {
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
  },
  status: {
    type: String,
    enum: Object.values(USER_STATUS),
    default: USER_STATUS.PENDING,
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
  totalHostels: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model("User", userSchema);

export default User;