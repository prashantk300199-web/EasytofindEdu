import express from 'express';
import { authenticateAdmin } from '../middlewares/auth.js';
import { upload } from '../middlewares/uploadInstiture.js';
import validate from '../middlewares/validate.js';
import {
  createInstituteValidator,
  createCourseValidator,
  createBatchValidator,
  createFeeStructureValidator,
  createResultValidator
} from '../validators/institute.validator.js';
import {
  // Stats
  getInstituteStats,
  // Institutes
  getAllInstitutes,
  getInstituteById,
  createInstitute,
  updateInstitute,
  deleteInstitute,
  approveInstitute,
  rejectInstitute,
  toggleInstituteActive,
  // Courses
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  // Batches
  getAllBatches,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch,
  // Fee Structures
  getAllFeeStructures,
  getFeeStructureById,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  // Results
  getAllResults,
  getResultById,
  createResult,
  updateResult,
  deleteResult,
} from '../controllers/admin.institute.controller.js';

const router = express.Router();

// All routes in this file require admin authentication
router.use(authenticateAdmin);

// ════════════════════════════════════════════════════════════
// STATS / DASHBOARD
// GET /api/v1/admin/institutes/stats
// ════════════════════════════════════════════════════════════
router.get('/stats', getInstituteStats);

// ════════════════════════════════════════════════════════════
// COURSES  (must come before /:id)
// ════════════════════════════════════════════════════════════
router.get('/courses', getAllCourses);
router.post('/courses', upload.single('image'), validate(createCourseValidator), createCourse);
router.get('/courses/:id', getCourseById);
router.put('/courses/:id', upload.single('image'), updateCourse);
router.delete('/courses/:id', deleteCourse);

// ════════════════════════════════════════════════════════════
// BATCHES
// ════════════════════════════════════════════════════════════
router.get('/batches', getAllBatches);
router.post('/batches', validate(createBatchValidator), createBatch);
router.get('/batches/:id', getBatchById);
router.put('/batches/:id', updateBatch);
router.delete('/batches/:id', deleteBatch);

// ════════════════════════════════════════════════════════════
// FEE STRUCTURES
// ════════════════════════════════════════════════════════════
router.get('/fee-structures', getAllFeeStructures);
router.post('/fee-structures', validate(createFeeStructureValidator), createFeeStructure);
router.get('/fee-structures/:id', getFeeStructureById);
router.put('/fee-structures/:id', updateFeeStructure);
router.delete('/fee-structures/:id', deleteFeeStructure);

// ════════════════════════════════════════════════════════════
// RESULTS
// ════════════════════════════════════════════════════════════
router.get('/results', getAllResults);
router.post(
  '/results',
  upload.fields([
    { name: 'rankersListImage', maxCount: 1 },
    { name: 'certificatesImage', maxCount: 1 }
  ]),
  validate(createResultValidator),
  createResult
);
router.get('/results/:id', getResultById);
router.put(
  '/results/:id',
  upload.fields([
    { name: 'rankersListImage', maxCount: 1 },
    { name: 'certificatesImage', maxCount: 1 }
  ]),
  updateResult
);
router.delete('/results/:id', deleteResult);

// ════════════════════════════════════════════════════════════
// INSTITUTES  (/:id routes must come AFTER named sub-routes)
// ════════════════════════════════════════════════════════════
router.get('/', getAllInstitutes);
router.post(
  '/',
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]),
  validate(createInstituteValidator),
  createInstitute
);
router.get('/:id', getInstituteById);
router.put(
  '/:id',
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]),
  updateInstitute
);
router.delete('/:id', deleteInstitute);

// ════════════════════════════════════════════════════════════
// MODERATION ACTIONS
// ════════════════════════════════════════════════════════════
router.patch('/:id/approve', approveInstitute);
router.patch('/:id/reject', rejectInstitute);
router.patch('/:id/toggle-active', toggleInstituteActive);

export default router;
