import jwt from "jsonwebtoken";
import CollegeOwner from "../models/CollegeOwner.js";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";

const generateToken = (owner) => {
  return jwt.sign({ id: owner._id, role: "college_owner" }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
};

// Registration creates the owner as 'verified' immediately and returns a JWT.
// No OTP/email-verification step (per product requirement).
export const registerOwner = async (name, email, phone, password) => {
  const existingOwner = await CollegeOwner.findOne({ email });
  if (existingOwner) {
    throw new ApiError(409, "Email is already registered.");
  }
  const owner = await CollegeOwner.create({
    name, email, phone, password,
    status: "verified",
  });
  const token = generateToken(owner);
  return { token, owner };
};

export const loginOwner = async (email, password) => {
  const owner = await CollegeOwner.findOne({ email }).select("+password");
  if (!owner) {
    throw new ApiError(401, "Invalid email or password.");
  }
  if (owner.status === "blocked") {
    throw new ApiError(403, "Your account has been blocked. Please contact support.");
  }
  const isMatch = await owner.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password.");
  }
  const token = generateToken(owner);
  return { token, owner: owner.toJSON() };
};

export const adminCreateOwner = async (name, email, phone, password) => {
  const existingOwner = await CollegeOwner.findOne({ email });
  if (existingOwner) {
    throw new ApiError(409, "Email is already registered.");
  }
  const owner = await CollegeOwner.create({
    name, email, phone, password,
    status: "verified",
  });
  return owner;
};

export const getAllOwners = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const owners = await CollegeOwner.find()
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });
  const total = await CollegeOwner.countDocuments();
  return {
    data: owners,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getOwnerById = async (id) => {
  const owner = await CollegeOwner.findById(id);
  if (!owner) throw new ApiError(404, "Owner not found.");
  return owner;
};

export const updateOwner = async (id, updateData) => {
  const owner = await CollegeOwner.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!owner) throw new ApiError(404, "Owner not found.");
  return owner;
};

export const deleteOwner = async (id) => {
  const owner = await CollegeOwner.findByIdAndDelete(id);
  if (!owner) throw new ApiError(404, "Owner not found.");
  return owner;
};