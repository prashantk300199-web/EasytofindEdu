import express from "express";
import {
  register,
  verifyOtp,
  login,
  resendOtp,
  logout,
  getProfile,
  updateProfile,
  updateProfilePhoto,
  changePassword,
  adminGetAllStudents,
  adminGetStudentById,
  adminDeleteStudent,
  adminBlockStudent,
} from "../controllers/Student.auth.controller.js";
import { authenticateStudent } from "../middlewares/AuthenticateStudents.js";
// Add authenticateAdmin from your existing auth middleware
import { authenticateAdmin } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import { upload } from "../middlewares/uploadInstiture.js"; // reuse existing upload middleware
import {
  registerValidator,
  loginValidator,
  verifyOtpValidator,
  resendOtpValidator,
  updateProfileValidator,
  changePasswordValidator,
} from "../validators/student.auth.validator.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────────────────────

// POST /api/v1/student/auth/register
router.post("/register", validate(registerValidator), register);

// POST /api/v1/student/auth/verify-otp
router.post("/verify-otp", validate(verifyOtpValidator), verifyOtp);

// POST /api/v1/student/auth/login
router.post("/login", validate(loginValidator), login);

// POST /api/v1/student/auth/resend-otp
router.post("/resend-otp", validate(resendOtpValidator), resendOtp);

// POST /api/v1/student/auth/logout
router.post("/logout", logout);


// ─────────────────────────────────────────────────────────────
// PROTECTED — Student must be logged in
// ─────────────────────────────────────────────────────────────

// GET  /api/v1/student/auth/profile
router.get("/profile", authenticateStudent, getProfile);

// PUT  /api/v1/student/auth/profile
// Updates: name, phone, gender, lastQualification, bio, address, academicDetails, preferredSubjects, dateOfBirth
router.put(
  "/profile",
  authenticateStudent,
  validate(updateProfileValidator),
  updateProfile
);

// PUT  /api/v1/student/auth/profile/photo
// Multipart form: field name "profilePhoto"
router.put(
  "/profile/photo",
  authenticateStudent,
  upload.single("profilePhoto"),
  updateProfilePhoto
);

// PUT  /api/v1/student/auth/change-password
router.put(
  "/change-password",
  authenticateStudent,
  validate(changePasswordValidator),
  changePassword
);


// ─────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────────────────────

// GET    /api/v1/student/auth/admin/students
router.get("/admin/students", authenticateAdmin, adminGetAllStudents);

// GET    /api/v1/student/auth/admin/students/:id
router.get("/admin/students/:id", authenticateAdmin, adminGetStudentById);

// DELETE /api/v1/student/auth/admin/students/:id
router.delete("/admin/students/:id", authenticateAdmin, adminDeleteStudent);

// PUT    /api/v1/student/auth/admin/students/:id/block
router.put("/admin/students/:id/block", authenticateAdmin, adminBlockStudent);


export default router;