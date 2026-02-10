import jwt from "jsonwebtoken";
import env from "../config/env.js";
import User from "../models/User.js";
import { generateOtp, verifyOtp } from "../services/otp.service.js";
import { sendOtpEmail } from "../services/email.service.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { USER_STATUS } from "../constants/enums.js";

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: "owner" }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser && existingUser.status !== USER_STATUS.PENDING) {
    throw new ApiError(409, "Email is already registered.");
  }

  if (existingUser && existingUser.status === USER_STATUS.PENDING) {
    existingUser.name = name;
    existingUser.phone = phone;
    existingUser.password = password;
    await existingUser.save();
  } else {
    await User.create({ name, email, phone, password });
  }

  const otp = await generateOtp(email);
  await sendOtpEmail(email, otp);

  res.status(201).json(
    new ApiResponse(201, "Registration successful. OTP sent to your email.")
  );
});

export const verifyOtpController = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const isValid = await verifyOtp(email, otp);
  if (!isValid) {
    throw new ApiError(400, "Invalid or expired OTP.");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  user.status = USER_STATUS.VERIFIED;
  await user.save();

  const token = generateToken(user);

  res.cookie("token", token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json(
    new ApiResponse(200, "Email verified successfully.", { token, user })
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  if (user.status === USER_STATUS.PENDING) {
    throw new ApiError(403, "Please verify your email first.");
  }

  if (user.status === USER_STATUS.BLOCKED) {
    throw new ApiError(403, "Your account has been blocked.");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const token = generateToken(user);

  res.cookie("token", token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json(
    new ApiResponse(200, "Login successful.", { token, user: user.toJSON() })
  );
});

export const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found with this email.");
  }

  if (user.status === USER_STATUS.VERIFIED) {
    throw new ApiError(400, "Email is already verified.");
  }

  const otp = await generateOtp(email);
  await sendOtpEmail(email, otp);

  res.status(200).json(
    new ApiResponse(200, "OTP resent to your email.")
  );
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "strict",
  });

  res.status(200).json(
    new ApiResponse(200, "Logged out successfully.")
  );
});