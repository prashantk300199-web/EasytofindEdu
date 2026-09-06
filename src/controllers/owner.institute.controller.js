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
//  DASHBOARD
// ──────────────────────────────────────────────────────────
export const getDashboardStats = async (req, res) => {
  try {
    const stats = await svc.getOwnerDashboardStatsService(req.owner._id);
    return ok(res, 'Dashboard stats fetched successfully', stats);
  } catch (e) { return fail(res, e); }
};

// ──────────────────────────────────────────────────────────
//  INSTITUTES
// ──────────────────────────────────────────────────────────
export const getMyInstitutes = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = '-createdAt', ...filters } = req.query;
    const result = await svc.getMyInstitutesService(req.owner._id, filters, page, limit, sortBy);
    return ok(res, 'Institutes fetched successfully', result);
  } catch (e) { return fail(res, e); }
};

export const createInstitute = async (req, res) => {
  try {
    const institute = await svc.createInstituteService(req.body, req.owner._id, req.files);
    return ok(res, 'Institute created successfully', institute, 201);
  } catch (e) { return fail(res, e); }
};

export const getMyInstituteById = async (req, res) => {
  try {
    await svc.verifyInstituteOwnership(req.params.id, req.owner._id);
    const institute = await svc.getInstituteByIdService(req.params.id);
    return ok(res, 'Institute fetched successfully', institute);
  } catch (e) { return fail(res, e); }
};

export const updateMyInstitute = async (req, res) => {
  try {
    await svc.verifyInstituteOwnership(req.params.id, req.owner._id);
    const institute = await svc.updateInstituteService(req.params.id, req.body, req.owner._id, req.files);
    return ok(res, 'Institute updated successfully', institute);
  } catch (e) { return fail(res, e); }
};

export const deleteMyInstitute = async (req, res) => {
  try {
    await svc.deleteOwnerInstituteService(req.params.id, req.owner._id);
    return ok(res, 'Institute and all related data deleted successfully', null);
  } catch (e) { return fail(res, e); }
};

// ──────────────────────────────────────────────────────────
//  COURSES
// ──────────────────────────────────────────────────────────
export const getMyCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, institute } = req.query;
    const filters = institute ? { institute } : {};
    const result = await svc.getMyCoursesService(req.owner._id, page, limit, filters);
    return ok(res, 'Courses fetched successfully', result);
  } catch (e) { return fail(res, e); }
};

export const createCourse = async (req, res) => {
  try {
    const course = await svc.createOwnerCourseService(req.body, req.owner._id, req.files);
    return ok(res, 'Course created successfully', course, 201);
  } catch (e) { return fail(res, e); }
};

export const getCourseById = async (req, res) => {
  try {
    const course = await svc.getCourseByIdService(req.params.id);
    return ok(res, 'Course fetched successfully', course);
  } catch (e) { return fail(res, e); }
};

export const updateCourse = async (req, res) => {
  try {
    const course = await svc.updateOwnerCourseService(req.params.id, req.body, req.owner._id, req.files);
    return ok(res, 'Course updated successfully', course);
  } catch (e) { return fail(res, e); }
};

export const deleteCourse = async (req, res) => {
  try {
    await svc.deleteOwnerCourseService(req.params.id, req.owner._id);
    return ok(res, 'Course deleted successfully', null);
  } catch (e) { return fail(res, e); }
};

// ──────────────────────────────────────────────────────────
//  BATCHES
// ──────────────────────────────────────────────────────────
export const getMyBatches = async (req, res) => {
  try {
    const { page = 1, limit = 10, institute } = req.query;
    const filters = institute ? { institute } : {};
    const result = await svc.getMyBatchesService(req.owner._id, page, limit, filters);
    return ok(res, 'Batches fetched successfully', result);
  } catch (e) { return fail(res, e); }
};

export const createBatch = async (req, res) => {
  try {
    const batch = await svc.createOwnerBatchService(req.body, req.owner._id);
    return ok(res, 'Batch created successfully', batch, 201);
  } catch (e) { return fail(res, e); }
};

export const getBatchById = async (req, res) => {
  try {
    const batch = await svc.getBatchByIdService(req.params.id);
    return ok(res, 'Batch fetched successfully', batch);
  } catch (e) { return fail(res, e); }
};

export const updateBatch = async (req, res) => {
  try {
    const batch = await svc.updateOwnerBatchService(req.params.id, req.body, req.owner._id);
    return ok(res, 'Batch updated successfully', batch);
  } catch (e) { return fail(res, e); }
};

export const deleteBatch = async (req, res) => {
  try {
    await svc.deleteOwnerBatchService(req.params.id, req.owner._id);
    return ok(res, 'Batch deleted successfully', null);
  } catch (e) { return fail(res, e); }
};

export const enrollStudent = async (req, res) => {
  try {
    // Verify the batch belongs to this owner
    await svc.verifyResourceOwnership(
      (await import('../models/Batch.js')).default,
      req.params.batchId,
      req.owner._id
    );
    const batch = await svc.enrollStudentInBatchService(req.params.batchId);
    return ok(res, 'Student enrolled successfully', batch);
  } catch (e) { return fail(res, e); }
};

// ──────────────────────────────────────────────────────────
//  FEE STRUCTURES
// ──────────────────────────────────────────────────────────
export const getMyFeeStructures = async (req, res) => {
  try {
    const { page = 1, limit = 10, institute } = req.query;
    const filters = institute ? { institute } : {};
    const result = await svc.getMyFeeStructuresService(req.owner._id, page, limit, filters);
    return ok(res, 'Fee structures fetched successfully', result);
  } catch (e) { return fail(res, e); }
};

export const createFeeStructure = async (req, res) => {
  try {
    const feeStructure = await svc.createOwnerFeeStructureService(req.body, req.owner._id);
    return ok(res, 'Fee structure created successfully', feeStructure, 201);
  } catch (e) { return fail(res, e); }
};

export const getFeeStructureById = async (req, res) => {
  try {
    const feeStructure = await svc.getFeeStructureByIdService(req.params.id);
    return ok(res, 'Fee structure fetched successfully', feeStructure);
  } catch (e) { return fail(res, e); }
};

export const updateFeeStructure = async (req, res) => {
  try {
    const feeStructure = await svc.updateOwnerFeeStructureService(req.params.id, req.body, req.owner._id);
    return ok(res, 'Fee structure updated successfully', feeStructure);
  } catch (e) { return fail(res, e); }
};

export const deleteFeeStructure = async (req, res) => {
  try {
    await svc.deleteOwnerFeeStructureService(req.params.id, req.owner._id);
    return ok(res, 'Fee structure deleted successfully', null);
  } catch (e) { return fail(res, e); }
};

// ──────────────────────────────────────────────────────────
//  RESULTS
// ──────────────────────────────────────────────────────────
export const getMyResults = async (req, res) => {
  try {
    const { page = 1, limit = 10, institute } = req.query;
    const filters = institute ? { institute } : {};
    const result = await svc.getMyResultsService(req.owner._id, page, limit, filters);
    return ok(res, 'Results fetched successfully', result);
  } catch (e) { return fail(res, e); }
};

export const createResult = async (req, res) => {
  try {
    const result = await svc.createOwnerResultService(req.body, req.owner._id, req.files);
    return ok(res, 'Result created successfully', result, 201);
  } catch (e) { return fail(res, e); }
};

export const getResultById = async (req, res) => {
  try {
    const result = await svc.getResultByIdService(req.params.id);
    return ok(res, 'Result fetched successfully', result);
  } catch (e) { return fail(res, e); }
};

export const updateResult = async (req, res) => {
  try {
    const result = await svc.updateOwnerResultService(req.params.id, req.body, req.owner._id, req.files);
    return ok(res, 'Result updated successfully', result);
  } catch (e) { return fail(res, e); }
};

export const deleteResult = async (req, res) => {
  try {
    await svc.deleteOwnerResultService(req.params.id, req.owner._id);
    return ok(res, 'Result deleted successfully', null);
  } catch (e) { return fail(res, e); }
};
