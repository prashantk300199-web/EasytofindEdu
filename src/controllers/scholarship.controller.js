import {
  searchScholarships,
  getScholarshipById,
  getFeaturedScholarships,
  getOpenAndClosingSoon,
  getRecommendedForStudent,
  getScholarshipFacets,
  trackApplicationClick,
} from "../services/scholarship.service.js";
import { careerPublicLimiter, searchLimiter } from "../middlewares/careerRateLimiter.middleware.js";
import { authenticateStudentOptional } from "../middlewares/authenticateStudentsOptional.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * GET /api/v1/career-guidance/scholarships
 * Public list + search + filters + pagination.
 * Query: query, category, scholarshipType, educationLevel, stream, eligibleCategory, state, gender, status, deadlineFrom, deadlineTo, sortBy, page, limit
 */
export const listScholarships = asyncHandler(async (req, res) => {
  const result = await searchScholarships(req.query);
  res.status(200).json(new ApiResponse(200, result, "Scholarships retrieved successfully"));
});

/**
 * GET /api/v1/career-guidance/scholarships/featured
 * Featured scholarships for landing rail.
 */
export const getFeatured = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 6;
  const items = await getFeaturedScholarships(limit);
  res.status(200).json(new ApiResponse(200, { items }, "Featured scholarships retrieved"));
});

/**
 * GET /api/v1/career-guidance/scholarships/closing-soon
 * Active + closing soon scholarships.
 */
export const getClosingSoon = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 12;
  const items = await getOpenAndClosingSoon(limit);
  res.status(200).json(new ApiResponse(200, { items }, "Open & closing-soon scholarships retrieved"));
});

/**
 * GET /api/v1/career-guidance/scholarships/facets
 * Aggregated counts for the filter UI.
 */
export const getFacets = asyncHandler(async (req, res) => {
  const facets = await getScholarshipFacets();
  res.status(200).json(new ApiResponse(200, facets, "Scholarship facets retrieved"));
});

/**
 * GET /api/v1/career-guidance/scholarships/recommended
 * Personalized recommendations for the logged-in student.
 * Falls back to featured if the profile is empty.
 */
export const getRecommended = asyncHandler(async (req, res) => {
  const studentId = req.student && req.student._id;
  if (!studentId) {
    const items = await getFeaturedScholarships(parseInt(req.query.limit) || 6);
    return res.status(200).json(
      new ApiResponse(200, { items, profileComplete: false }, "Showing featured scholarships (login for personalized)")
    );
  }
  const limit = parseInt(req.query.limit) || 8;
  const items = await getRecommendedForStudent(studentId, limit);
  res.status(200).json(
    new ApiResponse(200, { items, profileComplete: true }, "Recommended scholarships retrieved")
  );
});

/**
 * GET /api/v1/career-guidance/scholarships/:id
 * Single scholarship detail by id or slug.
 */
export const getScholarship = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Scholarship identifier required");
  const item = await getScholarshipById(id);
  res.status(200).json(new ApiResponse(200, item, "Scholarship retrieved"));
});

/**
 * POST /api/v1/career-guidance/scholarships/:id/click
 * Track an outbound click on the official application link.
 */
export const trackClick = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Scholarship id required");
  await trackApplicationClick(id);
  res.status(200).json(new ApiResponse(200, { ok: true }, "Click tracked"));
});
