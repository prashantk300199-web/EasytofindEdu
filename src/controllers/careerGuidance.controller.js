import careerGuidanceService from "../services/CareerGuidance.service.js";
import recommendationEngine from "../services/recommendationEngine.service.js";
import careerTreeBuilder from "../services/careerTreeBuilder.service.js";
import Student from "../models/Students.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const logger = {
  info: (msg, data = {}) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, data),
  error: (msg, error = {}) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, error),
};

// ============= PUBLIC CONTROLLERS =============

/**
 * GET /api/v1/career-guidance/questions
 * Fetch all active questionnaire questions
 */
export const getQuestionnaire = asyncHandler(async (req, res) => {
  const { category } = req.query;

  const questions = await careerGuidanceService.getAllActiveQuestions(category);

  res.status(200).json(
    new ApiResponse(200, questions, "Questions retrieved successfully")
  );
});

/**
 * GET /api/v1/career-guidance/featured-courses
 * Fetch featured courses for homepage
 */
export const getFeaturedCourses = asyncHandler(async (req, res) => {
  const courses = await careerGuidanceService.getFeaturedCourses();

  res.status(200).json(
    new ApiResponse(200, courses, "Featured courses retrieved successfully")
  );
});

/**
 * GET /api/v1/career-guidance/search
 * Search courses with filters
 */
export const searchCourses = asyncHandler(async (req, res) => {
  const {
    query,
    qualification,
    stream,
    nodeType,
    minCost,
    maxCost,
    minSuccessRate,
    maxSuccessRate,
    page = 1,
    limit = 20,
  } = req.query;

  const filters = {
    query,
    qualification,
    stream,
    nodeType,
    minCost: minCost ? parseInt(minCost) : null,
    maxCost: maxCost ? parseInt(maxCost) : null,
    minSuccessRate: minSuccessRate ? parseInt(minSuccessRate) : null,
    maxSuccessRate: maxSuccessRate ? parseInt(maxSuccessRate) : null,
  };

  const result = await careerGuidanceService.searchCourses(
    filters,
    parseInt(page),
    parseInt(limit)
  );

  res.status(200).json(
    new ApiResponse(200, result, "Courses searched successfully")
  );
});

/**
 * GET /api/v1/career-guidance/course/:id
 * Get detailed information about a specific course
 */
export const getCourseDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const course = await careerGuidanceService.getCourseDetails(id);

  res.status(200).json(
    new ApiResponse(200, course, "Course details retrieved successfully")
  );
});

/**
 * POST /api/v1/career-guidance/submit-answers
 * Submit questionnaire answers (logged in or not)
 */
export const submitAnswers = asyncHandler(async (req, res) => {
  const { answers } = req.body;
  const isLoggedIn = !!req.user;

  let result = { message: "Answers received" };

  // If logged in, save to profile and update lastQualification
  if (isLoggedIn) {
    const profile = await careerGuidanceService.submitQuestionnaires(
      req.user._id,
      answers
    );

    // Update student's lastQualification
    if (answers.qualification) {
      await Student.findByIdAndUpdate(req.user._id, {
        lastQualification: answers.qualification,
      });
    }

    result = profile;
  }

  res.status(200).json(
    new ApiResponse(200, result, "Answers submitted successfully")
  );
});

// ============= PROTECTED STUDENT CONTROLLERS =============

/**
 * GET /api/v1/career-guidance/recommendations
 * Get personalized recommendations based on questionnaire
 */
export const getRecommendations = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const recommendations = await recommendationEngine.generateRecommendations(
    req.user._id,
    parseInt(limit)
  );

  res.status(200).json(
    new ApiResponse(200, recommendations, "Recommendations generated successfully")
  );
});

/**
 * GET /api/v1/career-guidance/path/:nodeId/next
 * Get next possible paths after this course
 */
export const getNextPaths = asyncHandler(async (req, res) => {
  const { nodeId } = req.params;

  const nextPaths = await recommendationEngine.getNextPaths(nodeId);

  res.status(200).json(
    new ApiResponse(200, nextPaths, "Next paths retrieved successfully")
  );
});

/**
 * GET /api/v1/career-guidance/path/:nodeId/prerequisites
 * Get prerequisite paths for this course
 */
export const getPrerequisites = asyncHandler(async (req, res) => {
  const { nodeId } = req.params;

  const prerequisites = await recommendationEngine.getPrerequisitePaths(nodeId);

  res.status(200).json(
    new ApiResponse(200, prerequisites, "Prerequisites retrieved successfully")
  );
});

/**
 * POST /api/v1/career-guidance/save-path
 * Save a career path to student's profile
 */
export const savePath = asyncHandler(async (req, res) => {
  const { nodeId, status, notes } = req.body;

  const profile = await careerGuidanceService.saveCareerPath(
    req.user._id,
    nodeId,
    status,
    notes
  );

  res.status(200).json(
    new ApiResponse(200, profile, "Career path saved successfully")
  );
});

/**
 * GET /api/v1/career-guidance/my-paths
 * Get student's saved career paths
 */
export const getSavedPaths = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const result = await careerGuidanceService.getSavedPaths(
    req.user._id,
    parseInt(page),
    parseInt(limit)
  );

  res.status(200).json(
    new ApiResponse(200, result, "Saved paths retrieved successfully")
  );
});

/**
 * GET /api/v1/career-guidance/my-profile
 * Get student's career guidance profile
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await careerGuidanceService.getStudentProfile(req.user._id);

  res.status(200).json(
    new ApiResponse(200, profile, "Profile retrieved successfully")
  );
});

export default {
  getQuestionnaire,
  getFeaturedCourses,
  searchCourses,
  getCourseDetails,
  submitAnswers,
  getRecommendations,
  getNextPaths,
  getPrerequisites,
  savePath,
  getSavedPaths,
  getMyProfile,
};