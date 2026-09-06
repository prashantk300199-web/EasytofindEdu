import express from 'express';
import { authenticateInstituteOwner } from '../middlewares/auth.js';
import { upload, debugUpload } from '../middlewares/uploadInstiture.js';
import validate from '../middlewares/validate.js';
import {
  createInstituteValidator,
  createCourseValidator,
  createBatchValidator,
  createFeeStructureValidator,
  createResultValidator
} from '../validators/institute.validator.js';
import {
  // Dashboard
  getDashboardStats,
  // Institutes
  getMyInstitutes,
  createInstitute,
  getMyInstituteById,
  updateMyInstitute,
  deleteMyInstitute,
  // Courses
  getMyCourses,
  createCourse,
  getCourseById,
  updateCourse,
  deleteCourse,
  // Batches
  getMyBatches,
  createBatch,
  getBatchById,
  updateBatch,
  deleteBatch,
  enrollStudent,
  // Fee Structures
  getMyFeeStructures,
  createFeeStructure,
  getFeeStructureById,
  updateFeeStructure,
  deleteFeeStructure,
  // Results
  getMyResults,
  createResult,
  getResultById,
  updateResult,
  deleteResult,
} from '../controllers/owner.institute.controller.js';

const router = express.Router();

// All routes in this file require institute owner authentication
router.use(authenticateInstituteOwner);

// ════════════════════════════════════════════════════════════
// DASHBOARD
// GET /api/v1/owner/institutes/dashboard
// ════════════════════════════════════════════════════════════
router.get('/dashboard', getDashboardStats);

// ════════════════════════════════════════════════════════════
// COURSES  (must come before /:id to avoid route conflicts)
// ════════════════════════════════════════════════════════════
router.get('/courses', getMyCourses);
router.post(
  '/courses',
  debugUpload,
  upload.single('image'),
  debugUpload,
  validate(createCourseValidator),
  createCourse
);
router.get('/courses/:id', getCourseById);
router.put('/courses/:id', upload.single('image'), updateCourse);
router.delete('/courses/:id', deleteCourse);

// ════════════════════════════════════════════════════════════
// BATCHES
// ════════════════════════════════════════════════════════════
router.get('/batches', getMyBatches);
router.post('/batches', validate(createBatchValidator), createBatch);
router.get('/batches/:id', getBatchById);
router.put('/batches/:id', updateBatch);
router.delete('/batches/:id', deleteBatch);
router.post('/batches/:batchId/enroll', enrollStudent);

// ════════════════════════════════════════════════════════════
// FEE STRUCTURES
// ════════════════════════════════════════════════════════════
router.get('/fee-structures', getMyFeeStructures);
router.post('/fee-structures', validate(createFeeStructureValidator), createFeeStructure);
router.get('/fee-structures/:id', getFeeStructureById);
router.put('/fee-structures/:id', updateFeeStructure);
router.delete('/fee-structures/:id', deleteFeeStructure);

// ════════════════════════════════════════════════════════════
// RESULTS
// ════════════════════════════════════════════════════════════
router.get('/results', getMyResults);
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
router.get('/', getMyInstitutes);
router.post(
  '/',
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]),
  validate(createInstituteValidator),
  createInstitute
);
router.get('/:id', getMyInstituteById);
router.put(
  '/:id',
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]),
  updateMyInstitute
);
router.delete('/:id', deleteMyInstitute);

export default router;
