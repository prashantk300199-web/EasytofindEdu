import { Router } from "express";
import { authenticateStudent } from "../middlewares/AuthenticateStudents.js";
import {
  getRecommendations,
  getNextPaths,
  getPrerequisites,
  savePath,
  getSavedPaths,
  getMyProfile,
} from "../controllers/careerGuidance.controller.js";
import validate from "../middlewares/validate.js";
import { savePathValidator } from "../validators/careerGuidanceValidator.js";

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

export default router;