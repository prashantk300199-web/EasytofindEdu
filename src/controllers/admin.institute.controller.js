import * as svc from '../services/institute.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';

// ──────────────────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────────────────
const ok = (res, msg, data, status = 200) =>
  res.status(status).json(new ApiResponse(status, msg, data));

const fail = (res, error) => {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json(new ApiResponse(error.statusCode, error.message));
  }
  console.error(error);
  return res.status(500).json(new ApiResponse(500, 'Internal server error'));
};

// ──────────────────────────────────────────────────────────
//  STATS / DASHBOARD
// ──────────────────────────────────────────────────────────
export const getInstituteStats = async (req, res) => {
  try {
    const stats = await svc.getInstituteStatsService();
    return ok(res, 'Institute stats fetched successfully', stats);
  } catch (e) { return fail(res, e); }
};

// ──────────────────────────────────────────────────────────
//  INSTITUTES  – full CRUD, no ownership restriction
// ──────────────────────────────────────────────────────────
export const getAllInstitutes = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = '-createdAt', ...filters } = req.query;
    const result = await svc.adminGetInstitutesService(filters, page, limit, sortBy);
    return ok(res, 'Institutes fetched successfully', result);
  } catch (e) { return fail(res, e); }
};

export const getInstituteById = async (req, res) => {
  try {
    const institute = await svc.getInstituteByIdService(req.params.id);
    return ok(res, 'Institute fetched successfully', institute);
  } catch (e) { return fail(res, e); }
};

export const createInstitute = async (req, res) => {
  try {
    // Admin creates institute; createdBy is set to admin's id for traceability
    const institute = await svc.createInstituteService(req.body, req.admin._id, req.files);
    return ok(res, 'Institute created successfully', institute, 201);
  } catch (e) { return fail(res, e); }
};

export const updateInstitute = async (req, res) => {
  try {
    const institute = await svc.updateInstituteService(req.params.id, req.body, req.admin._id, req.files);
    return ok(res, 'Institute updated successfully', institute);
  } catch (e) { return fail(res, e); }
};

export const deleteInstitute = async (req, res) => {
  try {
    await svc.adminDeleteInstituteService(req.params.id);
    return ok(res, 'Institute and all related data deleted successfully', null);
  } catch (e) { return fail(res, e); }
};

export const approveInstitute = async (req, res) => {
  try {
    const institute = await svc.approveInstituteService(req.params.id);
    return ok(res, 'Institute approved successfully', institute);
  } catch (e) { return fail(res, e); }
};

export const rejectInstitute = async (req, res) => {
  try {
    const { reason } = req.body;
    const institute = await svc.rejectInstituteService(req.params.id, reason);
    return ok(res, 'Institute rejected successfully', institute);
  } catch (e) { return fail(res, e); }
};

export const toggleInstituteActive = async (req, res) => {
  try {
    const institute = await svc.toggleInstituteActiveService(req.params.id);
    return ok(res, `Institute ${institute.isActive ? 'activated' : 'deactivated'} successfully`, institute);
  } catch (e) { return fail(res, e); }
};

// ──────────────────────────────────────────────────────────
//  COURSES
// ──────────────────────────────────────────────────────────
export const getAllCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await svc.getCoursesService(page, limit);
    return ok(res, 'Courses fetched successfully', result);
  } catch (e) { return fail(res, e); }
};

export const getCourseById = async (req, res) => {
  try {
    const course = await svc.getCourseByIdService(req.params.id);
    return ok(res, 'Course fetched successfully', course);
  } catch (e) { return fail(res, e); }
};

export const createCourse = async (req, res) => {
  try {
    const course = await svc.adminCreateCourseService(req.body, req.admin._id, req.files);
    return ok(res, 'Course created successfully', course, 201);
  } catch (e) { return fail(res, e); }
};

export const updateCourse = async (req, res) => {
  try {
    const course = await svc.updateCourseService(req.params.id, req.body, req.files);
    return ok(res, 'Course updated successfully', course);
  } catch (e) { return fail(res, e); }
};

export const deleteCourse = async (req, res) => {
  try {
    const course = await svc.deleteCourseService(req.params.id);
    return ok(res, 'Course deleted successfully', course);
  } catch (e) { return fail(res, e); }
};

// ──────────────────────────────────────────────────────────
//  BATCHES
// ──────────────────────────────────────────────────────────
export const getAllBatches = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await svc.getBatchesService(page, limit);
    return ok(res, 'Batches fetched successfully', result);
  } catch (e) { return fail(res, e); }
};

export const getBatchById = async (req, res) => {
  try {
    const batch = await svc.getBatchByIdService(req.params.id);
    return ok(res, 'Batch fetched successfully', batch);
  } catch (e) { return fail(res, e); }
};

export const createBatch = async (req, res) => {
  try {
    const batch = await svc.adminCreateBatchService(req.body);
    return ok(res, 'Batch created successfully', batch, 201);
  } catch (e) { return fail(res, e); }
};

export const updateBatch = async (req, res) => {
  try {
    const batch = await svc.updateBatchService(req.params.id, req.body);
    return ok(res, 'Batch updated successfully', batch);
  } catch (e) { return fail(res, e); }
};

export const deleteBatch = async (req, res) => {
  try {
    const batch = await svc.deleteBatchService(req.params.id);
    return ok(res, 'Batch deleted successfully', batch);
  } catch (e) { return fail(res, e); }
};

// ──────────────────────────────────────────────────────────
//  FEE STRUCTURES
// ──────────────────────────────────────────────────────────
export const getAllFeeStructures = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await svc.getFeeStructuresService(page, limit);
    return ok(res, 'Fee structures fetched successfully', result);
  } catch (e) { return fail(res, e); }
};

export const getFeeStructureById = async (req, res) => {
  try {
    const feeStructure = await svc.getFeeStructureByIdService(req.params.id);
    return ok(res, 'Fee structure fetched successfully', feeStructure);
  } catch (e) { return fail(res, e); }
};

export const createFeeStructure = async (req, res) => {
  try {
    const feeStructure = await svc.adminCreateFeeStructureService(req.body);
    return ok(res, 'Fee structure created successfully', feeStructure, 201);
  } catch (e) { return fail(res, e); }
};

export const updateFeeStructure = async (req, res) => {
  try {
    const feeStructure = await svc.updateFeeStructureService(req.params.id, req.body);
    return ok(res, 'Fee structure updated successfully', feeStructure);
  } catch (e) { return fail(res, e); }
};

export const deleteFeeStructure = async (req, res) => {
  try {
    const feeStructure = await svc.deleteFeeStructureService(req.params.id);
    return ok(res, 'Fee structure deleted successfully', feeStructure);
  } catch (e) { return fail(res, e); }
};

// ──────────────────────────────────────────────────────────
//  RESULTS
// ──────────────────────────────────────────────────────────
export const getAllResults = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await svc.getResultsService(page, limit);
    return ok(res, 'Results fetched successfully', result);
  } catch (e) { return fail(res, e); }
};

export const getResultById = async (req, res) => {
  try {
    const result = await svc.getResultByIdService(req.params.id);
    return ok(res, 'Result fetched successfully', result);
  } catch (e) { return fail(res, e); }
};

export const createResult = async (req, res) => {
  try {
    const result = await svc.adminCreateResultService(req.body, req.files);
    return ok(res, 'Result created successfully', result, 201);
  } catch (e) { return fail(res, e); }
};

export const updateResult = async (req, res) => {
  try {
    const result = await svc.updateResultService(req.params.id, req.body, req.files);
    return ok(res, 'Result updated successfully', result);
  } catch (e) { return fail(res, e); }
};

export const deleteResult = async (req, res) => {
  try {
    const result = await svc.deleteResultService(req.params.id);
    return ok(res, 'Result deleted successfully', result);
  } catch (e) { return fail(res, e); }
};
