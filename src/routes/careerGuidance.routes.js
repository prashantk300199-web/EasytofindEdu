import { Router } from "express";
import {
  getRecommendations,
  getNextPaths,
  getPrerequisites,
  savePath,
  getSavedPaths,
  getMyProfile,
  getNodes,
  getNodeDetail,
  getRoadmap,
  getCareerAreas,
  iDontKnow,
} from "../controllers/careerGuidance.controller.js";
import validate from "../middlewares/validate.js";
import { savePathValidator } from "../validators/careerGuidanceValidator.js";
import { authenticateStudent } from "../middlewares/AuthenticateStudents.js";

const router = Router();

/**
 * PROTECTED ROUTES - Student must be logged in
 */

/**
 * GET /api/v1/career-guidance/recommendations
 * Get personalized recommendations based on submitted questionnaire
 * Query: limit (optional, default 10)
 */
router.get(
  "/recommendations",
  authenticateStudent,
  getRecommendations
);

/**
 * GET /api/v1/career-guidance/path/:nodeId/next
 * Get next possible paths after completing this course
 */
router.get(
  "/path/:nodeId/next",
  authenticateStudent,
  getNextPaths
);

/**
 * GET /api/v1/career-guidance/path/:nodeId/prerequisites
 * Get prerequisite paths/courses needed before this one
 */
router.get(
  "/path/:nodeId/prerequisites",
  authenticateStudent,
  getPrerequisites
);

/**
 * POST /api/v1/career-guidance/save-path
 * Save a career path to student's saved list
 */
router.post(
  "/save-path",
  authenticateStudent,
  validate(savePathValidator),
  savePath
);

/**
 * GET /api/v1/career-guidance/my-paths
 * Get all saved career paths for current student
 * Query: page, limit (optional)
 */
router.get(
  "/my-paths",
  authenticateStudent,
  getSavedPaths
);

/**
 * GET /api/v1/career-guidance/my-profile
 * Get current student's career guidance profile
 */
router.get(
  "/my-profile",
  authenticateStudent,
  getMyProfile
);

/**
 * GET /api/v1/career-guidance/roadmap/:nodeId
 * Get personalized roadmap to target career
 * Auth enables student-specific saved-path status in the response
 */
router.get(
  "/roadmap/:nodeId",
  authenticateStudent,
  getRoadmap
);

/**
 * PUBLIC ROUTES - No authentication required
 */

/**
 * GET /api/v1/career-guidance/nodes
 * Browse career nodes with filters
 * Query: query, qualification, stream, nodeType, difficulty, minCost, maxCost, sortBy, page, limit
 */
router.get(
  "/nodes",
  getNodes
);

/**
 * GET /api/v1/career-guidance/nodes/:nodeId
 * Get single career node detail
 */
router.get(
  "/nodes/:nodeId",
  getNodeDetail
);

/**
 * GET /api/v1/career-guidance/career-areas
 * List career area categories
 */
router.get(
  "/career-areas",
  getCareerAreas
);

/**
 * POST /api/v1/career-guidance/i-dont-know
 * Conversational career discovery (no auth required)
 */
router.post(
  "/i-dont-know",
  iDontKnow
);

export default router;