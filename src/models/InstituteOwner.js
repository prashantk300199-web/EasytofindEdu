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
}, { timestamps: true });

instituteOwnerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
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
