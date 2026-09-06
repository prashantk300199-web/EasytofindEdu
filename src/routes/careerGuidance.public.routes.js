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
import CareerGuidanceQuestion from "../models/CareerGuidanceQuestions.js";
import CareerPathNode from "../models/CareerPathNode.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = Router();

/**
 * PUBLIC ROUTES - No authentication required
 * But rate limited for security
 */

/**
 * GET /api/v1/career-guidance/
 * Dashboard/testing page
 */
router.get("/", (req, res) => {
  res.redirect("/career-guidance-test.html");
});

/**
 * GET /api/v1/career-guidance/stats
 * Get statistics about the career guidance module
 */
router.get(
  "/stats",
  careerPublicLimiter,
  asyncHandler(async (req, res) => {
    const [totalQuestions, totalNodes, featuredNodes] = await Promise.all([
      CareerGuidanceQuestion.countDocuments({ isActive: true }),
      CareerPathNode.countDocuments({ status: "active" }),
      CareerPathNode.countDocuments({ isFeatured: true, status: "active" }),
    ]);

    const stats = {
      totalQuestions,
      totalCourses: totalNodes,
      featuredCourses: featuredNodes,
      questionsByCategory: {},
      nodesByType: {},
    };

    // Count by category
    const categories = await CareerGuidanceQuestion.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    categories.forEach((cat) => {
      stats.questionsByCategory[cat._id] = cat.count;
    });

    // Count by node type
    const nodeTypes = await CareerPathNode.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: "$nodeType", count: { $sum: 1 } } },
    ]);

    nodeTypes.forEach((type) => {
      stats.nodesByType[type._id] = type.count;
    });

    res.status(200).json(
      new ApiResponse(200, stats, "Statistics retrieved successfully")
    );
  })
);



/**
 * GET /api/v1/career-guidance/tree-viewer
 * Admin tree visualization page (no auth required for now)
 */
router.get("/tree-viewer", (req, res) => {
  res.redirect("/career-tree-viewer.html");
});

/**
 * GET /api/v1/career-guidance/tree
 * Get complete career tree structure as JSON
 */
router.get(
  "/tree",
  careerPublicLimiter,
  asyncHandler(async (req, res) => {
    const { qualification } = req.query;

    let filter = { status: "active", level: 1 };
    if (qualification) {
      filter.applicableQualifications = qualification;
    }

    const rootNodes = await CareerPathNode.find(filter)
      .select(
        "title slug nodeType description duration cost successMetrics difficultyLevel isFeatured level"
      )
      .lean();

    // Build tree recursively
    const buildTree = async (nodeId) => {
      const node = await CareerPathNode.findById(nodeId)
        .select(
          "title slug nodeType description duration cost successMetrics difficultyLevel isFeatured level nextNodeIds"
        )
        .lean();

      if (!node) return null;

      const children = await Promise.all(
        (node.nextNodeIds || []).map((childId) => buildTree(childId))
      );

      return {
        ...node,
        children: children.filter((c) => c !== null),
      };
    };

    const tree = await Promise.all(
      rootNodes.map((node) => buildTree(node._id))
    );

    res.status(200).json(new ApiResponse(200, tree, "Career tree retrieved"));
  })
);


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
 * GET /api/v1/career-guidance/paths/:qualification
 * Get all paths available for a specific qualification
 */
router.get(
  "/paths/:qualification",
  careerPublicLimiter,
  asyncHandler(async (req, res) => {
    const { qualification } = req.params;

    const paths = await CareerPathNode.find({
      status: "active",
      applicableQualifications: qualification,
    })
      .select("title slug nodeType description cost duration isFeatured")
      .sort({ isFeatured: -1, createdAt: -1 })
      .lean();

    if (paths.length === 0) {
      throw new ApiError(404, `No paths found for qualification: ${qualification}`);
    }

    res.status(200).json(
      new ApiResponse(200, paths, "Paths retrieved successfully")
    );
  })
);

/**
 * GET /api/v1/career-guidance/courses/by-type/:nodeType
 * Get courses by type (entrance_exam, course, specialization, etc)
 */
router.get(
  "/courses/by-type/:nodeType",
  careerPublicLimiter,
  asyncHandler(async (req, res) => {
    const { nodeType } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      CareerPathNode.find({
        status: "active",
        nodeType,
      })
        .select("title slug description cost duration successMetrics nodeType")
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .lean(),
      CareerPathNode.countDocuments({ status: "active", nodeType }),
    ]);

    if (courses.length === 0) {
      throw new ApiError(404, `No courses found for type: ${nodeType}`);
    }

    res.status(200).json(
      new ApiResponse(
        200,
        {
          courses,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
        "Courses retrieved successfully"
      )
    );
  })
);

/**
 * GET /api/v1/career-guidance/comparison/:nodeIds
 * Compare multiple courses side by side
 * nodeIds: comma-separated IDs
 */
router.get(
  "/comparison/:nodeIds",
  careerPublicLimiter,
  asyncHandler(async (req, res) => {
    const { nodeIds } = req.params;

    if (!nodeIds) {
      throw new ApiError(400, "Please provide node IDs (comma-separated)");
    }

    const ids = nodeIds.split(",").filter((id) => id.match(/^[0-9a-fA-F]{24}$/));

    if (ids.length === 0) {
      throw new ApiError(400, "No valid node IDs provided");
    }

    if (ids.length > 5) {
      throw new ApiError(400, "Maximum 5 courses can be compared");
    }

    const courses = await CareerPathNode.find({
      _id: { $in: ids },
      status: "active",
    })
      .select(
        "title slug nodeType description duration cost successMetrics careerOutcomes difficultyLevel"
      )
      .lean();

    if (courses.length === 0) {
      throw new ApiError(404, "No courses found");
    }

    res.status(200).json(
      new ApiResponse(200, courses, "Courses retrieved for comparison")
    );
  })
);

/**
 * GET /api/v1/career-guidance/top-courses
 * Get top/trending courses by popularity
 */
router.get(
  "/top-courses",
  careerPublicLimiter,
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const topCourses = await CareerPathNode.find({
      status: "active",
    })
      .select(
        "title slug description cost duration successMetrics viewCount clickCount saveCount popularityScore"
      )
      .sort({
        popularityScore: -1,
        saveCount: -1,
        viewCount: -1,
      })
      .limit(parseInt(limit))
      .lean();

    res.status(200).json(
      new ApiResponse(200, topCourses, "Top courses retrieved successfully")
    );
  })
);

/**
 * GET /api/v1/career-guidance/high-success-rate
 * Get courses with highest success rates
 */
router.get(
  "/high-success-rate",
  careerPublicLimiter,
  asyncHandler(async (req, res) => {
    const { limit = 10, minRate = 70 } = req.query;

    const courses = await CareerPathNode.find({
      status: "active",
      "successMetrics.successRate": { $gte: parseInt(minRate) },
    })
      .select(
        "title slug nodeType description successMetrics cost duration"
      )
      .sort({ "successMetrics.successRate": -1 })
      .limit(parseInt(limit))
      .lean();

    res.status(200).json(
      new ApiResponse(200, courses, "High success rate courses retrieved")
    );
  })
);

/**
 * GET /api/v1/career-guidance/affordable-courses
 * Get most affordable courses
 */
router.get(
  "/affordable-courses",
  careerPublicLimiter,
  asyncHandler(async (req, res) => {
    const { limit = 10, maxCost = 500000 } = req.query;

    const courses = await CareerPathNode.find({
      status: "active",
      "cost.average": { $lte: parseInt(maxCost) },
    })
      .select(
        "title slug nodeType description cost duration successMetrics"
      )
      .sort({ "cost.average": 1 })
      .limit(parseInt(limit))
      .lean();

    res.status(200).json(
      new ApiResponse(200, courses, "Affordable courses retrieved successfully")
    );
  })
);

/**
 * GET /api/v1/career-guidance/quick-courses
 * Get shortest duration courses
 */
router.get(
  "/quick-courses",
  careerPublicLimiter,
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const courses = await CareerPathNode.find({
      status: "active",
      "duration.unit": "months",
    })
      .select(
        "title slug nodeType description duration cost successMetrics"
      )
      .sort({ "duration.value": 1 })
      .limit(parseInt(limit))
      .lean();

    res.status(200).json(
      new ApiResponse(200, courses, "Quick courses retrieved successfully")
    );
  })
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

/**
 * GET /api/v1/career-guidance/help
 * Help page with examples
 */
router.get("/help", careerPublicLimiter, (req, res) => {
  const help = {
    overview: "Career Guidance API - Public Endpoints Documentation",
    baseUrl: "http://localhost:5000/api/v1/career-guidance",
    rateLimiting: {
      general: "100 requests per 15 minutes per IP",
      search: "50 requests per 5 minutes per IP",
      submission: "10 requests per hour per user/IP",
    },
    endpoints: [
      {
        method: "GET",
        path: "/",
        description: "Career guidance testing dashboard (HTML)",
      },
      {
        method: "GET",
        path: "/stats",
        description: "Get overall statistics",
      },
      {
        method: "GET",
        path: "/questions",
        description: "Get all questionnaire questions",
      },
      {
        method: "GET",
        path: "/featured-courses",
        description: "Get featured courses",
      },
      {
        method: "GET",
        path: "/search?qualification=class_12th&stream=pcm",
        description: "Search courses with filters",
      },
      {
        method: "GET",
        path: "/course/:id",
        description: "Get specific course details",
      },
      {
        method: "GET",
        path: "/paths/:qualification",
        description: "Get paths for qualification",
      },
      {
        method: "GET",
        path: "/courses/by-type/:nodeType",
        description: "Get courses by type",
      },
      {
        method: "GET",
        path: "/comparison/:nodeIds",
        description: "Compare multiple courses",
      },
      {
        method: "GET",
        path: "/top-courses",
        description: "Get trending courses",
      },
      {
        method: "GET",
        path: "/high-success-rate?minRate=70",
        description: "Get courses with high success rates",
      },
      {
        method: "GET",
        path: "/affordable-courses?maxCost=500000",
        description: "Get affordable courses",
      },
      {
        method: "GET",
        path: "/quick-courses",
        description: "Get shortest duration courses",
      },
      {
        method: "POST",
        path: "/submit-answers",
        description: "Submit questionnaire answers",
      },
      {
        method: "GET",
        path: "/help",
        description: "This help page",
      },
    ],
  };

  res.status(200).json(
    new ApiResponse(200, help, "Help documentation retrieved successfully")
  );
});

export default router;