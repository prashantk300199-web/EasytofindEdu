import { Router } from "express";
import { authenticateAdmin } from "../middlewares/auth.js";
import { adminModificationLimiter, bulkImportLimiter } from "../middlewares/careerRateLimiter.middleware.js";
import {
  adminListScholarships,
  adminGetScholarship,
  adminCreateScholarship,
  adminUpdateScholarship,
  adminDeleteScholarship,
  adminVerifyScholarship,
  adminSetStatus,
  adminToggleFeature,
  adminStats,
} from "../controllers/admin.scholarship.controller.js";

const router = Router();

router.use(authenticateAdmin);

/**
 * GET /api/v1/admin/career/scholarships/stats
 */
router.get("/scholarships/stats", adminStats);

/**
 * GET /api/v1/admin/career/scholarships
 */
router.get("/scholarships", adminListScholarships);

/**
 * GET /api/v1/admin/career/scholarships/:id
 */
router.get("/scholarships/:id", adminGetScholarship);

/**
 * POST /api/v1/admin/career/scholarships
 */
router.post("/scholarships", adminModificationLimiter, adminCreateScholarship);

/**
 * PUT /api/v1/admin/career/scholarships/:id
 */
router.put("/scholarships/:id", adminModificationLimiter, adminUpdateScholarship);

/**
 * DELETE /api/v1/admin/career/scholarships/:id
 */
router.delete("/scholarships/:id", adminModificationLimiter, adminDeleteScholarship);

/**
 * PATCH /api/v1/admin/career/scholarships/:id/verify
 */
router.patch("/scholarships/:id/verify", adminModificationLimiter, adminVerifyScholarship);

/**
 * PATCH /api/v1/admin/career/scholarships/:id/status
 */
router.patch("/scholarships/:id/status", adminModificationLimiter, adminSetStatus);

/**
 * PATCH /api/v1/admin/career/scholarships/:id/feature
 */
router.patch("/scholarships/:id/feature", adminModificationLimiter, adminToggleFeature);

export default router;
