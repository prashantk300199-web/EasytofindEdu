import express from 'express';
import { authenticateAdmin } from '../middlewares/auth.js';
import {
  getInstituteApplications,
  getInstituteApplicationById,
  approveApplication,
  requestChanges,
  rejectApplication,
  suspendApplication,
  getVerificationHistory,
  getApplicationStats
} from '../controllers/admin.instituteApplication.controller.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// Statistics
router.get('/stats', getApplicationStats);

// Application management
router.get('/', getInstituteApplications);
router.get('/:id', getInstituteApplicationById);
router.get('/:id/history', getVerificationHistory);

// Verification actions
router.patch('/:id/approve', approveApplication);
router.patch('/:id/request-changes', requestChanges);
router.patch('/:id/reject', rejectApplication);
router.patch('/:id/suspend', suspendApplication);

export default router;
