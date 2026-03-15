import { Router } from "express";
import {
  getQuestionnaire,
  getFeaturedCourses,
  searchCourses,
  getCourseDetails,
  submitAnswers,
} from "../controllers/careerGuidance.controller.js";
import { careerPublicLimiter, searchLimiter, questionSubmissionLimiter } from "../middlewares/careerRateLimiter.middleware.js";
import validate from "../middlewares/validate.js";
import { submitAnswersValidator, searchCoursesValidator } from "../validators/careerGuidanceValidator.js";

const router = Router();

/**
 * PUBLIC ROUTES - No authentication required
 * But rate limited for security
 */

/**
 * GET /api/v1/career-guidance/questions
 * Fetch all active questionnaire questions
 */
router.get(
  "/questions",
  careerPublicLimiter,
  getQuestionnaire
);

/**
 * GET /api/v1/career-guidance/featured-courses
 * Fetch featured courses for homepage/discovery
 */
router.get(
  "/featured-courses",
  careerPublicLimiter,
  getFeaturedCourses
);

/**
 * GET /api/v1/career-guidance/search
 * Search courses with filters
 * Query params: query, qualification, stream, nodeType, minCost, maxCost, minSuccessRate, maxSuccessRate, page, limit
 */
router.get(
  "/search",
  searchLimiter,
  validate(searchCoursesValidator, "query"),
  searchCourses
);

/**
 * GET /api/v1/career-guidance/course/:id
 * Get detailed information about a specific course
 * Can use either MongoDB ObjectId or slug
 */
router.get(
  "/course/:id",
  careerPublicLimiter,
  getCourseDetails
);

/**
 * POST /api/v1/career-guidance/submit-answers
 * Submit questionnaire answers
 * Can be done logged in or without login
 * If logged in: saves to profile and updates student's lastQualification
 */
router.post(
  "/submit-answers",
  questionSubmissionLimiter,
  validate(submitAnswersValidator),
  submitAnswers
);

export default router;