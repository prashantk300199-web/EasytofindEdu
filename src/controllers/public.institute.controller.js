import * as svc from '../services/institute.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';

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
//  INSTITUTES  (approved + active only)
// ──────────────────────────────────────────────────────────
export const getPublicInstitutes = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = '-createdAt', ...filters } = req.query;
    const result = await svc.getPublicInstitutesService(filters, page, limit, sortBy);
    return ok(res, 'Institutes fetched successfully', result);
  } catch (e) { return fail(res, e); }
};

export const getPublicInstituteById = async (req, res) => {
  try {
    const institute = await svc.getPublicInstituteByIdService(req.params.id);
    return ok(res, 'Institute fetched successfully', institute);
  } catch (e) { return fail(res, e); }
};

// ──────────────────────────────────────────────────────────
//  INSTITUTE SUB-RESOURCES (batches, courses, fees, results)
// ──────────────────────────────────────────────────────────
export const getPublicBatchesByInstitute = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await svc.getPublicBatchesByInstituteService(req.params.id, page, limit);
    return ok(res, 'Batches fetched successfully', result);
  } catch (e) { return fail(res, e); }
};

export const getPublicFeeStructuresByInstitute = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await svc.getPublicFeeStructuresByInstituteService(req.params.id, page, limit);
    return ok(res, 'Fee structures fetched successfully', result);
  } catch (e) { return fail(res, e); }
};

export const getPublicResultsByInstitute = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await svc.getPublicResultsByInstituteService(req.params.id, page, limit);
    return ok(res, 'Results fetched successfully', result);
  } catch (e) { return fail(res, e); }
};

export const getPublicCoursesByInstitute = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await svc.getPublicCoursesByInstituteService(req.params.id, page, limit);
    return ok(res, 'Courses fetched successfully', result);
  } catch (e) { return fail(res, e); }
};

// ──────────────────────────────────────────────────────────
//  LOCATION LOOKUPS
// ──────────────────────────────────────────────────────────
export const getCities = async (req, res) => {
  try {
    const cities = await svc.getCitiesService();
    return ok(res, 'Cities fetched successfully', cities);
  } catch (e) { return fail(res, e); }
};

export const getAreasByCity = async (req, res) => {
  try {
    const areas = await svc.getAreasByCityService(req.params.cityId);
    return ok(res, 'Areas fetched successfully', areas);
  } catch (e) { return fail(res, e); }
};

export const getSubAreasByArea = async (req, res) => {
  try {
    const subAreas = await svc.getSubAreasByAreaService(req.params.areaId);
    return ok(res, 'Sub-areas fetched successfully', subAreas);
  } catch (e) { return fail(res, e); }
};
