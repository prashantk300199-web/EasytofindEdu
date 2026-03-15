import { Router } from "express";
import { authenticateAdmin } from "../middlewares/auth.js";
import {
  createQuestion,
  getAllQuestions,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  createNode,
  getAllNodes,
  getNode,
  updateNode,
  deleteNode,
  getCareerTree,
  validateTree,
  getNodesByLevel,
  featureNode,
  unfeatureNode,
  bulkImport,
  getAnalytics,
  getAuditLogs,
} from "../controllers/admin.careerGuidance.controller.js";
import { adminModificationLimiter, bulkImportLimiter } from "../middlewares/careerRateLimiter.middleware.js";
import validate from "../middlewares/validate.js";
import { createQuestionValidator, updateQuestionValidator } from "../validators/careerGuidanceValidator.js";
import { createCareerNodeValidator, updateCareerNodeValidator } from "../validators/careerNode.validator.js";

const router = Router();

/**
 * All admin routes require authentication
 * Only SuperAdmin can perform modifications
 */

// ============= QUESTION MANAGEMENT =============

/**
 * POST /api/v1/admin/career/questions
 * Create a new questionnaire question (SuperAdmin only)
 */
router.post(
  "/questions",
  authenticateAdmin,
  adminModificationLimiter,
  validate(createQuestionValidator),
  createQuestion
);

/**
 * GET /api/v1/admin/career/questions
 * Get all questions with pagination
 * Query: page, limit, category, isActive
 */
router.get(
  "/questions",
  authenticateAdmin,
  getAllQuestions
);

/**
 * GET /api/v1/admin/career/questions/:id
 * Get specific question details
 */
router.get(
  "/questions/:id",
  authenticateAdmin,
  getQuestion
);

/**
 * PUT /api/v1/admin/career/questions/:id
 * Update a question (SuperAdmin only)
 */
router.put(
  "/questions/:id",
  authenticateAdmin,
  adminModificationLimiter,
  validate(updateQuestionValidator),
  updateQuestion
);

/**
 * DELETE /api/v1/admin/career/questions/:id
 * Delete a question (SuperAdmin only)
 */
router.delete(
  "/questions/:id",
  authenticateAdmin,
  adminModificationLimiter,
  deleteQuestion
);

// ============= NODE/COURSE MANAGEMENT =============

/**
 * POST /api/v1/admin/career/nodes
 * Create a new career path node (SuperAdmin only)
 */
router.post(
  "/nodes",
  authenticateAdmin,
  adminModificationLimiter,
  validate(createCareerNodeValidator),
  createNode
);

/**
 * GET /api/v1/admin/career/nodes
 * Get all nodes with pagination
 * Query: page, limit, nodeType, status, isFeatured, search
 */
router.get(
  "/nodes",
  authenticateAdmin,
  getAllNodes
);

/**
 * GET /api/v1/admin/career/nodes/:id
 * Get specific node details with populated references
 */
router.get(
  "/nodes/:id",
  authenticateAdmin,
  getNode
);

/**
 * PUT /api/v1/admin/career/nodes/:id
 * Update a node (SuperAdmin only)
 */
router.put(
  "/nodes/:id",
  authenticateAdmin,
  adminModificationLimiter,
  validate(updateCareerNodeValidator),
  updateNode
);

/**
 * DELETE /api/v1/admin/career/nodes/:id
 * Delete a node (SuperAdmin only)
 */
router.delete(
  "/nodes/:id",
  authenticateAdmin,
  adminModificationLimiter,
  deleteNode
);

// ============= TREE MANAGEMENT =============

/**
 * GET /api/v1/admin/career/tree
 * Get complete career tree structure
 * Query: qualification (optional, to filter by starting qualification)
 */
router.get(
  "/tree",
  authenticateAdmin,
  getCareerTree
);

/**
 * GET /api/v1/admin/career/tree/validate
 * Validate tree structure for circular dependencies
 */
router.get(
  "/tree/validate",
  authenticateAdmin,
  validateTree
);

/**
 * GET /api/v1/admin/career/tree/levels
 * Get nodes grouped by hierarchy level
 * Query: level (required)
 */
router.get(
  "/tree/levels",
  authenticateAdmin,
  getNodesByLevel
);

// ============= FEATURED COURSES =============

/**
 * PUT /api/v1/admin/career/nodes/:id/feature
 * Mark a course as featured on homepage (SuperAdmin only)
 */
router.put(
  "/nodes/:id/feature",
  authenticateAdmin,
  adminModificationLimiter,
  featureNode
);

/**
 * PUT /api/v1/admin/career/nodes/:id/unfeature
 * Remove featured status (SuperAdmin only)
 */
router.put(
  "/nodes/:id/unfeature",
  authenticateAdmin,
  adminModificationLimiter,
  unfeatureNode
);

// ============= BULK OPERATIONS =============

/**
 * POST /api/v1/admin/career/bulk-import
 * Bulk import questions and nodes (SuperAdmin only)
 * Limited to 5 times per day
 */
router.post(
  "/bulk-import",
  authenticateAdmin,
  bulkImportLimiter,
  bulkImport
);

// ============= ANALYTICS =============

/**
 * GET /api/v1/admin/career/analytics
 * Get career guidance analytics and statistics
 * Query: startDate, endDate (optional)
 */
router.get(
  "/analytics",
  authenticateAdmin,
  getAnalytics
);

/**
 * GET /api/v1/admin/career/audit-logs
 * Get audit logs of all admin actions
 * Query: page, limit, action, resourceType, adminId
 */
router.get(
  "/audit-logs",
  authenticateAdmin,
  getAuditLogs
);

export default router;