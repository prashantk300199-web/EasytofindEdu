import express from 'express';
import {
  getDraft,
  saveDraft,
  uploadDraftFile,
  submitDraft,
  deleteDraft,
  getDraftStatus,
} from '../controllers/collegeDraft.controller.js';
import { authenticateCollegeOwner } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

router.use(authenticateCollegeOwner);

router.get('/draft', getDraft);
router.get('/draft/status', getDraftStatus);
router.post('/draft/save', saveDraft);
router.post('/draft/upload', upload.single('file'), uploadDraftFile);
router.post('/draft/submit', submitDraft);
router.delete('/draft', deleteDraft);

export default router;