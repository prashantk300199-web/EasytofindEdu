import express from 'express';
import { authenticateAdmin } from '../middlewares/auth.js';
import {
  getCollegeApplications,
  getCollegeApplicationById,
  approveApplication,
  requestChanges,
  rejectApplication,
  suspendApplication,
  getVerificationHistory,
  getApplicationStats,
} from '../controllers/admin.collegeApplication.controller.js';

const router = express.Router();

router.use(authenticateAdmin);

router.get('/stats', getApplicationStats);
router.get('/', getCollegeApplications);
router.get('/:id', getCollegeApplicationById);
router.get('/:id/history', getVerificationHistory);

router.patch('/:id/approve', approveApplication);
router.patch('/:id/request-changes', requestChanges);
router.patch('/:id/reject', rejectApplication);
router.patch('/:id/suspend', suspendApplication);

export default router;