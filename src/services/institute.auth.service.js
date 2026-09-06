import jwt from "jsonwebtoken";
import InstituteOwner from "../models/InstituteOwner.js";
import { generateOtp, verifyOtp } from "../services/otp.service.js";
import { sendOtpEmail } from "../services/email.service.js";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";

const generateToken = (owner) => {
  return jwt.sign({ id: owner._id, role: "institute_owner" }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
};

export const registerOwner = async (name, email, phone, password) => {
  const existingOwner = await InstituteOwner.findOne({ email });
  
  if (existingOwner && existingOwner.status !== "pending") {
    throw new ApiError(409, "Email is already registered.");
  }

  if (existingOwner && existingOwner.status === "pending") {
    existingOwner.name = name;
    existingOwner.phone = phone;
    existingOwner.password = password;
    await existingOwner.save();
  } else {
    await InstituteOwner.create({ name, email, phone, password });
  }

  const otp = await generateOtp(email);
  await sendOtpEmail(email, otp);

  return { message: "Registration successful. OTP sent to your email." };
};

export const verifyOwnerOtp = async (email, otpCode) => {
  const isValid = await verifyOtp(email, otpCode);
  if (!isValid) {
    throw new ApiError(400, "Invalid or expired OTP.");
  }

  const owner = await InstituteOwner.findOne({ email });
  if (!owner) {
    throw new ApiError(404, "Owner not found.");
  }

  owner.status = "verified";
  await owner.save();

  const token = generateToken(owner);
  return { token, owner };
};

export const loginOwner = async (email, password) => {
  const owner = await InstituteOwner.findOne({ email }).select("+password");
  if (!owner) {
    throw new ApiError(401, "Invalid email or password.");
  }

  if (owner.status === "pending") {
    throw new ApiError(403, "Please verify your email first.");
  }

  if (owner.status === "blocked") {
    throw new ApiError(403, "Your account has been blocked.");
  }

  const isMatch = await owner.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const token = generateToken(owner);
  return { token, owner: owner.toJSON() };
};

export const resendOwnerOtp = async (email) => {
  const owner = await InstituteOwner.findOne({ email });
  if (!owner) {
    throw new ApiError(404, "Owner not found with this email.");
  }

  if (owner.status === "verified") {
    throw new ApiError(400, "Email is already verified.");
  }

  const otp = await generateOtp(email);
  await sendOtpEmail(email, otp);

  return { message: "OTP resent to your email." };
};

export const adminCreateOwner = async (name, email, phone, password) => {
  const existingOwner = await InstituteOwner.findOne({ email });
  if (existingOwner) {
    throw new ApiError(409, "Email is already registered.");
  }

  const owner = await InstituteOwner.create({
    name,
    email,
    phone,
    password,
    status: "verified" // Skip OTP verification for admin-created owners
  });

  return owner;
};

export const getAllOwners = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const owners = await InstituteOwner.find()
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });
  
  const total = await InstituteOwner.countDocuments();
  
  return {
    data: owners,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export const getOwnerById = async (id) => {
  const owner = await InstituteOwner.findById(id);
  if (!owner) {
    throw new ApiError(404, "Owner not found.");
  }
  return owner;
};

export const updateOwner = async (id, updateData) => {
  const owner = await InstituteOwner.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );
  
  if (!owner) {
    throw new ApiError(404, "Owner not found.");
  }
  
  return owner;
};

export const deleteOwner = async (id) => {
  const owner = await InstituteOwner.findByIdAndDelete(id);
  if (!owner) {
    throw new ApiError(404, "Owner not found.");
  }
  return owner;
};
