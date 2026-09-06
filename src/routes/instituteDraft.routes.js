import express from 'express';
import {
  getDraft,
  saveDraft,
  uploadDraftFile,
  submitDraft,
  deleteDraft,
  getDraftStatus
} from '../controllers/instituteDraft.controller.js';
import { authenticateInstituteOwner } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateInstituteOwner);

// Get draft for logged-in owner
router.get('/draft', getDraft);

// Get draft status (for dashboard)
router.get('/draft/status', getDraftStatus);

// Save draft (manual or auto-save)
router.post('/draft/save', saveDraft);

// Upload file for draft
router.post('/draft/upload', upload.single('file'), uploadDraftFile);

// Submit draft for verification
router.post('/draft/submit', submitDraft);

// Delete draft
router.delete('/draft', deleteDraft);

export default router;
