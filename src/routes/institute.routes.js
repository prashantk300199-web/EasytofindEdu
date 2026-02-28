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
import { authenticateOwner, authenticateAdmin, authenticateInstituteOwner  } from '../middlewares/auth.js';
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

console.log('🔧 Setting up public routes');

router.get('/cities', (req, res, next) => {
  console.log('📍 /institutes/cities endpoint HIT!');
  console.log('📍 Request headers:', req.headers);
  console.log('📍 Request params:', req.params);
  console.log('📍 Request query:', req.query);
  return getCities(req, res, next);
});

router.get('/areas/:cityId', (req, res, next) => {
  console.log('📍 /institutes/areas/:cityId endpoint HIT!');
  console.log('📍 City ID:', req.params.cityId);
  return getAreasByCity(req, res, next);
});

router.get('/subareas/:areaId', (req, res, next) => {
  console.log('📍 /institutes/subareas/:areaId endpoint HIT!');
  console.log('📍 Area ID:', req.params.areaId);
  return getSubAreasByArea(req, res, next);
});

router.get('/search', (req, res, next) => {
  console.log('📍 /institutes/search endpoint HIT!');
  console.log('📍 Search query:', req.query);
  return getInstitutes(req, res, next);
});

console.log('✅ Public routes setup completed');



router.route('/institutes')
  .post(
    authenticateInstituteOwner,
    upload.fields([
      { name: 'logo', maxCount: 1 },
      { name: 'coverImage', maxCount: 1 }
    ]),
    validate(createInstituteValidator), 
    createInstitute
  )
  .get(getInstitutes);  
router.route('/institutes/:id')
  .get(getInstituteById)
  .put(
    authenticateInstituteOwner, 
    upload.fields([
      { name: 'logo', maxCount: 1 },
      { name: 'coverImage', maxCount: 1 }
    ]),
    updateInstitute
  )
  .delete(authenticateInstituteOwner, deleteInstitute);

router.route('/courses')
  .post(
    authenticateInstituteOwner,
    debugUpload, 
    upload.single('image'), 
    debugUpload, 
    (req, res, next) => {
      console.log('📍 AFTER MULTER MIDDLEWARE');
      console.log('📍 req.files after multer:', req.files);
      console.log('📍 req.body after multer:', req.body);
      next();
    },
    validate(createCourseValidator), 
    createCourse
  )
  .get(getCourses);


router.route('/courses/:id')
  .get(getCourseById)
  .put(
    authenticateInstituteOwner, 
    upload.single('image'),
    validate(createCourseValidator), 
    updateCourse
  )
  .delete(authenticateInstituteOwner, deleteCourse);

// Batch Routes
router.route('/batches')
  .post(authenticateInstituteOwner, validate(createBatchValidator), createBatch)
  .get(getBatches);

router.route('/batches/:id')
  .get(getBatchById)
  .put(authenticateInstituteOwner, updateBatch)
  .delete(authenticateInstituteOwner, deleteBatch);

router.post('/batches/:batchId/enroll', authenticateInstituteOwner, enrollStudentInBatch);

// Fee Structure Routes
router.route('/fee-structures')
  .post(authenticateInstituteOwner, validate(createFeeStructureValidator), createFeeStructure)
  .get(getFeeStructures);

router.route('/fee-structures/:id')
  .get(getFeeStructureById)
  .put(authenticateInstituteOwner, updateFeeStructure)
  .delete(authenticateInstituteOwner, deleteFeeStructure);

/// Result Routes - Simplified
router.route('/results')
  .post(
    authenticateInstituteOwner, 
    upload.fields([
      { name: 'rankersListImage', maxCount: 1 },
      { name: 'certificatesImage', maxCount: 1 }
    ]),
    validate(createResultValidator), 
    createResult
  )
  .get(getResults);

router.route('/results/:id')
  .get(getResultById)
  .put(
    authenticateInstituteOwner, 
    upload.fields([
      { name: 'rankersListImage', maxCount: 1 },
      { name: 'certificatesImage', maxCount: 1 }
    ]),
    updateResult
  )
  .delete(authenticateInstituteOwner, deleteResult);


// Admin Routes
router.put('/institutes/:id/approve', authenticateAdmin, async (req, res) => {
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

export default router;
