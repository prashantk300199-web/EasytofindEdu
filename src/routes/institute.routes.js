import express from 'express';
import {
  createInstitute,
  getInstitutes,
  getInstituteById,
  updateInstitute,
  deleteInstitute,
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  createBatch,
  getBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
  createFeeStructure,
  getFeeStructures,
  getFeeStructureById,
  updateFeeStructure,
  deleteFeeStructure,
  createResult,
  getResults,
  getResultById,
  updateResult,
  deleteResult,
  getCities,
  getAreasByCity,
  getSubAreasByArea,
  enrollStudentInBatch
} from '../controllers/institute.controller.js';
import { authenticateAdmin, authenticateInstituteOwner } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import { upload, debugUpload } from '../middlewares/uploadInstiture.js';
import {
  createInstituteValidator,
  createCourseValidator,
  createBatchValidator,
  createFeeStructureValidator,
  createResultValidator
} from '../validators/institute.validator.js';
import Institute from '../models/Institute.js';
import ApiResponse from '../utils/ApiResponse.js';

const router = express.Router();

// ============================================================
// IMPORTANT: Static/specific routes MUST come before /:id
// otherwise Express matches "courses", "batches" etc. as :id
// ============================================================


// -----------------------------------------------------------
// LOCATION ROUTES (Public)
// GET /api/v1/institutes/cities
// GET /api/v1/institutes/areas/:cityId
// GET /api/v1/institutes/subareas/:areaId
// -----------------------------------------------------------
router.get('/cities', getCities);
router.get('/areas/:cityId', getAreasByCity);
router.get('/subareas/:areaId', getSubAreasByArea);


// -----------------------------------------------------------
// SEARCH (Public)
// GET /api/v1/institutes/search?city=X&area=Y&course=Z&mode=online&page=1&limit=10
// -----------------------------------------------------------
// router.get('/search', getInstitutes);


// -----------------------------------------------------------
// COURSE ROUTES  (must be before /:id)
// -----------------------------------------------------------

// Public
router.get('/courses', getCourses);
router.get('/courses/:id', getCourseById);

// Protected
router.post(
  '/courses',
  authenticateInstituteOwner,
  debugUpload,
  upload.single('image'),
  debugUpload,
  validate(createCourseValidator),
  createCourse
);
router.put(
  '/courses/:id',
  authenticateInstituteOwner,
  upload.single('image'),
  validate(createCourseValidator),
  updateCourse
);
router.delete('/courses/:id', authenticateInstituteOwner, deleteCourse);


// -----------------------------------------------------------
// BATCH ROUTES  (must be before /:id)
// -----------------------------------------------------------

// Public
router.get('/batches', getBatches);
router.get('/batches/:id', getBatchById);

// Protected
router.post('/batches', authenticateInstituteOwner, validate(createBatchValidator), createBatch);
router.put('/batches/:id', authenticateInstituteOwner, updateBatch);
router.delete('/batches/:id', authenticateInstituteOwner, deleteBatch);
router.post('/batches/:batchId/enroll', authenticateInstituteOwner, enrollStudentInBatch);


// -----------------------------------------------------------
// FEE STRUCTURE ROUTES  (must be before /:id)
// -----------------------------------------------------------

// Public
router.get('/fee-structures', getFeeStructures);
router.get('/fee-structures/:id', getFeeStructureById);

// Protected
router.post('/fee-structures', authenticateInstituteOwner, validate(createFeeStructureValidator), createFeeStructure);
router.put('/fee-structures/:id', authenticateInstituteOwner, updateFeeStructure);
router.delete('/fee-structures/:id', authenticateInstituteOwner, deleteFeeStructure);


// -----------------------------------------------------------
// RESULT ROUTES  (must be before /:id)
// -----------------------------------------------------------

// Public
router.get('/results', getResults);
router.get('/results/:id', getResultById);

// Protected
router.post(
  '/results',
  authenticateInstituteOwner,
  upload.fields([
    { name: 'rankersListImage', maxCount: 1 },
    { name: 'certificatesImage', maxCount: 1 }
  ]),
  validate(createResultValidator),
  createResult
);
router.put(
  '/results/:id',
  authenticateInstituteOwner,
  upload.fields([
    { name: 'rankersListImage', maxCount: 1 },
    { name: 'certificatesImage', maxCount: 1 }
  ]),
  updateResult
);
router.delete('/results/:id', authenticateInstituteOwner, deleteResult);


// -----------------------------------------------------------
// ADMIN ROUTES  (must be before /:id)
// -----------------------------------------------------------
router.put('/admin/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    const institute = await Institute.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );
    if (!institute) {
      return res.status(404).json(new ApiResponse(404, 'Institute not found'));
    }
    return res.status(200).json(new ApiResponse(200, 'Institute approved successfully', institute));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, 'Internal server error'));
  }
});



router.get('/', getInstitutes);

router.post(
  '/',
  authenticateInstituteOwner,
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
  authenticateInstituteOwner,
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]),
  updateInstitute
);
router.delete('/:id', authenticateInstituteOwner, deleteInstitute);


export default router;