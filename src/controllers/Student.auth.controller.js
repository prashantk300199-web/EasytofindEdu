import * as studentAuthService from "../services/Student.auth.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { COOKIE_OPTIONS } from "../constants/api.constants.js";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, gender, lastQualification } = req.body;
  const result = await studentAuthService.registerStudent(
    name, email, phone, password, gender, lastQualification
  );
  return res.status(201).json(new ApiResponse(201, result.message));
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const { token, student } = await studentAuthService.verifyStudentOtp(email, otp);

  res.cookie("studentToken", token, COOKIE_OPTIONS);

  return res.status(200).json(
    new ApiResponse(200, "Email verified successfully.", { token, student })
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { token, student } = await studentAuthService.loginStudent(email, password);

  res.cookie("studentToken", token, COOKIE_OPTIONS);

  return res.status(200).json(
    new ApiResponse(200, "Login successful.", { token, student })
  );
});

export const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await studentAuthService.resendStudentOtp(email);
  return res.status(200).json(new ApiResponse(200, result.message));
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("studentToken", COOKIE_OPTIONS);
  return res.status(200).json(new ApiResponse(200, "Logged out successfully."));
});

// ─── Profile ──────────────────────────────────────────────────────────────────

export const getProfile = asyncHandler(async (req, res) => {
  // req.student is set by authenticateStudent middleware
  const student = await studentAuthService.getStudentProfile(req.student._id);
  return res.status(200).json(new ApiResponse(200, "Profile fetched successfully.", student));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const student = await studentAuthService.updateStudentProfile(req.student._id, req.body);
  return res.status(200).json(new ApiResponse(200, "Profile updated successfully.", student));
});

export const updateProfilePhoto = asyncHandler(async (req, res) => {
  const student = await studentAuthService.updateStudentPhoto(req.student._id, req.file);
  return res.status(200).json(new ApiResponse(200, "Profile photo updated successfully.", student));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await studentAuthService.changeStudentPassword(
    req.student._id, currentPassword, newPassword
  );
  return res.status(200).json(new ApiResponse(200, result.message));
});

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminGetAllStudents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await studentAuthService.getAllStudents(page, limit);
  return res.status(200).json(new ApiResponse(200, "Students fetched successfully.", result));
});

export const adminGetStudentById = asyncHandler(async (req, res) => {
  const student = await studentAuthService.getStudentById(req.params.id);
  return res.status(200).json(new ApiResponse(200, "Student fetched successfully.", student));
});

export const adminDeleteStudent = asyncHandler(async (req, res) => {
  const student = await studentAuthService.deleteStudent(req.params.id);
  return res.status(200).json(new ApiResponse(200, "Student deleted successfully.", student));
});

export const adminBlockStudent = asyncHandler(async (req, res) => {
  const student = await studentAuthService.blockStudent(req.params.id);
  return res.status(200).json(new ApiResponse(200, "Student blocked successfully.", student));
});

export const adminUnblockStudent = asyncHandler(async (req, res) => {
  const student = await studentAuthService.unblockStudent(req.params.id);
  return res.status(200).json(new ApiResponse(200, "Student unblocked successfully.", student));
});