import express from 'express';
import {
  register,
  login,
  logout,
  adminCreateOwner,
  getAllOwners,
  getOwnerById,
  updateOwner,
  deleteOwner,
} from '../controllers/college.auth.controller.js';
import { authenticateAdmin, authenticateCollegeOwner } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import ApiResponse from '../utils/ApiResponse.js';
import {
  registerValidator,
  loginValidator,
  adminCreateCollegeOwnerValidator,
} from '../validators/college.auth.validator.js';

const router = express.Router();

// Public routes
router.post('/register', validate(registerValidator), register);
router.post('/login', validate(loginValidator), login);
router.post('/logout', logout);

// Admin-only routes
router.post('/admin/create', authenticateAdmin, validate(adminCreateCollegeOwnerValidator), adminCreateOwner);
router.get('/admin/owners', authenticateAdmin, getAllOwners);
router.get('/admin/owners/:id', authenticateAdmin, getOwnerById);
router.put('/admin/owners/:id', authenticateAdmin, updateOwner);
router.delete('/admin/owners/:id', authenticateAdmin, deleteOwner);

// Owner profile route
router.get('/profile', authenticateCollegeOwner, (req, res) => {
  return res.status(200).json(new ApiResponse(200, "Profile fetched successfully", req.owner));
});

export default router;