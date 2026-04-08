import express from 'express';
import {
  getPublicInstitutes,
  getPublicInstituteById,
  getPublicBatchesByInstitute,
  getPublicFeeStructuresByInstitute,
  getPublicResultsByInstitute,
  getPublicCoursesByInstitute,
  getCities,
  getAreasByCity,
  getSubAreasByArea,
} from '../controllers/public.institute.controller.js';

const router = express.Router();

// ════════════════════════════════════════════════════════════
// PUBLIC INSTITUTE ROUTES — No authentication required
// Prefix: /api/v1/institutes
//
// Only approved + active institutes are exposed here.
// For owner dashboard → /api/v1/owner/institutes
// For admin management → /api/v1/admin/institutes
// ════════════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────────
// LOCATION LOOKUPS
// ──────────────────────────────────────────────────────────
router.get('/cities', getCities);
router.get('/areas/:cityId', getAreasByCity);
router.get('/subareas/:areaId', getSubAreasByArea);

// ──────────────────────────────────────────────────────────
// INSTITUTE SEARCH & DETAIL
// GET /api/v1/institutes?city=X&area=Y&course=Z&mode=online&page=1&limit=10
// ──────────────────────────────────────────────────────────
router.get('/', getPublicInstitutes);
router.get('/:id', getPublicInstituteById);

// ──────────────────────────────────────────────────────────
// INSTITUTE SUB-RESOURCES  (must be after /:id)
// ──────────────────────────────────────────────────────────
router.get('/:id/batches', getPublicBatchesByInstitute);
router.get('/:id/courses', getPublicCoursesByInstitute);
router.get('/:id/fee-structures', getPublicFeeStructuresByInstitute);
router.get('/:id/results', getPublicResultsByInstitute);

export default router;
