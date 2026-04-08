import express from 'express';
import {
  register,
  verifyOtp,
  login,
  resendOtp,
  logout,
  adminCreateOwner,
  getAllOwners,
  getOwnerById,
  updateOwner,
  deleteOwner
} from '../controllers/institute.auth.controller.js';
import { authenticateAdmin, authenticateInstituteOwner } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import ApiResponse from '../utils/ApiResponse.js';
import {
  registerValidator,
  loginValidator,
  verifyOtpValidator,
  resendOtpValidator,
  adminCreateInstituteOwnerValidator
} from '../validators/institute.auth.validator.js';

const router = express.Router();

// Public routes
router.post('/register', validate(registerValidator), register);
router.post('/verify-otp', validate(verifyOtpValidator), verifyOtp);
router.post('/login', validate(loginValidator), login);
router.post('/resend-otp', validate(resendOtpValidator), resendOtp);
router.post('/logout', logout);

// Admin-only routes
router.post('/admin/create', authenticateAdmin, validate(adminCreateInstituteOwnerValidator), adminCreateOwner);
router.get('/admin/owners', authenticateAdmin, getAllOwners);
router.get('/admin/owners/:id', authenticateAdmin, getOwnerById);
router.put('/admin/owners/:id', authenticateAdmin, updateOwner);
router.delete('/admin/owners/:id', authenticateAdmin, deleteOwner);

// Owner profile routes
router.get('/profile', authenticateInstituteOwner, (req, res) => {
  return res.status(200).json(new ApiResponse(200, "Profile fetched successfully", req.owner));
});

export default router;
