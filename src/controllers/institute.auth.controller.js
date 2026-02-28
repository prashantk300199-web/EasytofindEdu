import * as instituteAuthService from '../services/institute.auth.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { COOKIE_OPTIONS } from '../constants/api.constants.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  const result = await instituteAuthService.registerOwner(name, email, phone, password);
  return res.status(201).json(new ApiResponse(201, result.message));
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const { token, owner } = await instituteAuthService.verifyOwnerOtp(email, otp);

  res.cookie("instituteOwnerToken", token, COOKIE_OPTIONS);

  return res.status(200).json(
    new ApiResponse(200, "Email verified successfully.", { token, owner })
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { token, owner } = await instituteAuthService.loginOwner(email, password);

  res.cookie("instituteOwnerToken", token, COOKIE_OPTIONS);

  return res.status(200).json(
    new ApiResponse(200, "Login successful.", { token, owner })
  );
});

export const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await instituteAuthService.resendOwnerOtp(email);
  return res.status(200).json(new ApiResponse(200, result.message));
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("instituteOwnerToken", COOKIE_OPTIONS);

  return res.status(200).json(
    new ApiResponse(200, "Logged out successfully.")
  );
});

// Admin-only controllers
export const adminCreateOwner = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  const owner = await instituteAuthService.adminCreateOwner(name, email, phone, password);
  return res.status(201).json(new ApiResponse(201, "Owner created successfully by admin", owner));
});

export const getAllOwners = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await instituteAuthService.getAllOwners(page, limit);
  return res.status(200).json(new ApiResponse(200, "Owners fetched successfully", result));
});

export const getOwnerById = asyncHandler(async (req, res) => {
  const owner = await instituteAuthService.getOwnerById(req.params.id);
  return res.status(200).json(new ApiResponse(200, "Owner fetched successfully", owner));
});

export const updateOwner = asyncHandler(async (req, res) => {
  const owner = await instituteAuthService.updateOwner(req.params.id, req.body);
  return res.status(200).json(new ApiResponse(200, "Owner updated successfully", owner));
});

export const deleteOwner = asyncHandler(async (req, res) => {
  const owner = await instituteAuthService.deleteOwner(req.params.id);
  return res.status(200).json(new ApiResponse(200, "Owner deleted successfully", owner));
});
