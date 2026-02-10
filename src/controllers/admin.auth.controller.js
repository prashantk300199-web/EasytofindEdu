import jwt from "jsonwebtoken";
import env from "../config/env.js";
import Admin from "../models/Admin.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const generateAdminToken = (admin) => {
  return jwt.sign({ id: admin._id, role: admin.role }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
};

export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email }).select("+password");

  if (!admin) {
    throw new ApiError(401, "Invalid email or password.");
  }

  if (!admin.isActive) {
    throw new ApiError(403, "Your account has been deactivated.");
  }

  const isMatch = await admin.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const token = generateAdminToken(admin);

  res.cookie("adminToken", token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json(
    new ApiResponse(200, "Admin login successful.", { token, admin: admin.toJSON() })
  );
});

export const adminLogout = asyncHandler(async (req, res) => {
  res.clearCookie("adminToken", {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "strict",
  });

  res.status(200).json(
    new ApiResponse(200, "Admin logged out successfully.")
  );
});

export const getAdminProfile = asyncHandler(async (req, res) => {
  res.status(200).json(
    new ApiResponse(200, "Admin profile fetched.", req.admin)
  );
});