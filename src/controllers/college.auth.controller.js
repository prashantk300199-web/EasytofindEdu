import * as collegeAuthService from '../services/college.auth.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import { COOKIE_OPTIONS } from '../constants/api.constants.js';

const COOKIE_NAME = 'collegeOwnerToken';

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  const { token, owner } = await collegeAuthService.registerOwner(name, email, phone, password);
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
  return res.status(201).json(
    new ApiResponse(201, "Registration successful. You can now start your college onboarding.", { token, owner }),
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { token, owner } = await collegeAuthService.loginOwner(email, password);
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
  return res.status(200).json(
    new ApiResponse(200, "Login successful.", { token, owner }),
  );
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
  return res.status(200).json(new ApiResponse(200, "Logged out successfully."));
});

// Admin-only controllers
export const adminCreateOwner = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  const owner = await collegeAuthService.adminCreateOwner(name, email, phone, password);
  return res.status(201).json(new ApiResponse(201, "College owner created successfully by admin", owner));
});

export const getAllOwners = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await collegeAuthService.getAllOwners(page, limit);
  return res.status(200).json(new ApiResponse(200, "Owners fetched successfully", result));
});

export const getOwnerById = asyncHandler(async (req, res) => {
  const owner = await collegeAuthService.getOwnerById(req.params.id);
  return res.status(200).json(new ApiResponse(200, "Owner fetched successfully", owner));
});

export const updateOwner = asyncHandler(async (req, res) => {
  const owner = await collegeAuthService.updateOwner(req.params.id, req.body);
  return res.status(200).json(new ApiResponse(200, "Owner updated successfully", owner));
});

export const deleteOwner = asyncHandler(async (req, res) => {
  const owner = await collegeAuthService.deleteOwner(req.params.id);
  return res.status(200).json(new ApiResponse(200, "Owner deleted successfully", owner));
});