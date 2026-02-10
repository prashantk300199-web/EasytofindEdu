import jwt from "jsonwebtoken";
import env from "../config/env.js";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const authenticateOwner = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    throw new ApiError(401, "Access denied. No token provided.");
  }

  const decoded = jwt.verify(token, env.jwt.secret);

  if (decoded.role !== "owner") {
    throw new ApiError(403, "Access denied. Invalid role.");
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    throw new ApiError(401, "User not found.");
  }

  if (user.status === "blocked") {
    throw new ApiError(403, "Your account has been blocked.");
  }

  req.user = user;
  next();
});

export const authenticateAdmin = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.adminToken || req.headers.authorization?.split(" ")[1];

  if (!token) {
    throw new ApiError(401, "Access denied. No token provided.");
  }

  const decoded = jwt.verify(token, env.jwt.secret);

  if (!["admin", "superadmin"].includes(decoded.role)) {
    throw new ApiError(403, "Access denied. Invalid role.");
  }

  const admin = await Admin.findById(decoded.id);

  if (!admin) {
    throw new ApiError(401, "Admin not found.");
  }

  if (!admin.isActive) {
    throw new ApiError(403, "Your account has been deactivated.");
  }

  req.admin = admin;
  next();
});