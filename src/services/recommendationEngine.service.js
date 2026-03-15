import CareerPathNode from "../models/CareerPathNode.js";
import StudentCareerProfile from "../models/Students.js";
import ApiError from "../utils/ApiError.js";
import { NODE_STATUS, SORTING_OPTIONS } from "../constants/careerGuidance.constants.js";

const logger = {
  info: (msg, data = {}) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, data),
  error: (msg, error = {}) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, error),
  debug: (msg, data = {}) => process.env.NODE_ENV === 'development' && console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`, data),
};

/**
 * Generate personalized recommendations based on student profile
 * Algorithm: Multi-parameter weighted scoring
 */
export const generateRecommendations = async (studentId, limit = 10) => {
  try {
    const profile = await StudentCareerProfile.findOne({ studentId });

    if (!profile || !profile.isProfileComplete) {
      throw new ApiError(400, "Complete questionnaire first");
    }

    const { answers } = profile;

    // Build query filter
    const query = buildFilterQuery(answers);

    // Fetch candidate nodes
    let candidates = await CareerPathNode.find(query)
      .select(
        "title slug nodeType description cost duration successMetrics popularityScore applicableQualifications applicableStreams applicableFinancialCategories applicableRegions applicableTimeframes"
      )
      .limit(limit * 3)
      .lean();

    // Score and rank candidates
    const scored = candidates.map((node) => ({
      ...node,
      matchScore: calculateMatchScore(node, answers),
      scoringDetails: getScoreBreakdown(node, answers),
    }));

    // Sort by match score
    scored.sort((a, b) => b.matchScore - a.matchScore);

    // Filter by minimum score and limit results
    const recommendations = scored
      .filter((r) => r.matchScore >= 40) // Minimum match threshold
      .slice(0, limit);

    if (recommendations.length === 0) {
      logger.warn("No matching recommendations found", { studentId });
      return [];
    }

    // Update profile with recommendations
    profile.recommendedNodes = recommendations.map((r) => ({
      nodeId: r._id,
      matchScore: r.matchScore,
      generatedAt: new Date(),
    }));
    profile.lastRecommendationGeneratedAt = new Date();
    profile.lastActivityAt = new Date();

    await profile.save();

    logger.info("Recommendations generated", {
      studentId,
      count: recommendations.length,
    });

    return recommendations;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error("Error generating recommendations", error);
    throw new ApiError(500, "Failed to generate recommendations");
  }
};

/**
 * Build MongoDB query filter based on student answers
 */
const buildFilterQuery = (answers) => {
  const query = { status: NODE_STATUS.ACTIVE };

  // Qualification match
  if (answers.qualification) {
    query.$or = [
      { applicableQualifications: answers.qualification },
      { applicableQualifications: { $exists: false } },
      { applicableQualifications: [] },
    ];
  }

  // Stream match
  if (answers.stream) {
    query.applicableStreams = { $in: [answers.stream] };
  }

  return query;
};

/**
 * Calculate match score (0-100)
 * Weighted factors:
 * - Qualification match: 25%
 * - Stream match: 20%
 * - Financial fit: 20%
 * - Location preference: 15%
 * - Timeframe fit: 10%
 * - Popularity: 10%
 */
const calculateMatchScore = (node, answers) => {
  let score = 0;
  const weights = {
    qualification: 0.25,
    stream: 0.2,
    financial: 0.2,
    location: 0.15,
    timeframe: 0.1,
    popularity: 0.1,
  };

  // Qualification match (25%)
  if (
    node.applicableQualifications &&
    node.applicableQualifications.includes(answers.qualification)
  ) {
    score += 100 * weights.qualification;
  } else if (
    !node.applicableQualifications ||
    node.applicableQualifications.length === 0
  ) {
    score += 50 * weights.qualification; // Partial credit if no restriction
  }

  // Stream match (20%)
  if (
    node.applicableStreams &&
    node.applicableStreams.includes(answers.stream)
  ) {
    score += 100 * weights.stream;
  } else if (!node.applicableStreams || node.applicableStreams.length === 0) {
    score += 50 * weights.stream;
  }

  // Financial fit (20%)
  if (
    node.applicableFinancialCategories &&
    node.applicableFinancialCategories.includes(answers.financialCapacity)
  ) {
    score += 100 * weights.financial;
  } else if (
    !node.applicableFinancialCategories ||
    node.applicableFinancialCategories.length === 0
  ) {
    score += 50 * weights.financial;
  }

  // Location preference (15%)
  if (
    answers.preferredCities &&
    answers.preferredCities.length > 0 &&
    node.applicableRegions
  ) {
    const regionMatch = node.applicableRegions.some((region) =>
      answers.preferredCities.includes(region)
    );
    score += regionMatch ? 100 * weights.location : 30 * weights.location;
  } else {
    score += 50 * weights.location;
  }

  // Timeframe fit (10%)
  if (
    node.applicableTimeframes &&
    node.applicableTimeframes.includes(answers.timeframe)
  ) {
    score += 100 * weights.timeframe;
  } else if (!node.applicableTimeframes || node.applicableTimeframes.length === 0) {
    score += 50 * weights.timeframe;
  }

  // Popularity boost (10%)
  if (node.popularityScore) {
    const popularityFactor = Math.min(node.popularityScore / 100, 1);
    score += popularityFactor * 100 * weights.popularity;
  }

  return Math.round(score);
};

/**
 * Get detailed score breakdown for transparency
 */
const getScoreBreakdown = (node, answers) => {
  return {
    qualificationMatch:
      node.applicableQualifications?.includes(answers.qualification) ? "yes" : "no",
    streamMatch: node.applicableStreams?.includes(answers.stream) ? "yes" : "no",
    financialFit:
      node.applicableFinancialCategories?.includes(answers.financialCapacity)
        ? "yes"
        : "no",
    regionMatch:
      node.applicableRegions?.some((r) => answers.preferredCities?.includes(r)) ? "yes" : "no",
    timeframeMatch:
      node.applicableTimeframes?.includes(answers.timeframe) ? "yes" : "no",
  };
};

/**
 * Get next possible paths after completing a course
 */
export const getNextPaths = async (nodeId) => {
  try {
    const currentNode = await CareerPathNode.findById(nodeId).lean();

    if (!currentNode) {
      throw new ApiError(404, "Node not found");
    }

    const nextPaths = await CareerPathNode.find({
      status: NODE_STATUS.ACTIVE,
      $or: [
        { _id: { $in: currentNode.nextNodeIds || [] } },
        { prerequisiteNodeIds: nodeId },
      ],
    })
      .select("title slug nodeType description duration cost")
      .lean();

    logger.info("Next paths retrieved", { nodeId, count: nextPaths.length });
    return nextPaths;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error("Error fetching next paths", error);
    throw new ApiError(500, "Failed to fetch next paths");
  }
};

/**
 * Get prerequisite paths (what needs to be done before this course)
 */
export const getPrerequisitePaths = async (nodeId) => {
  try {
    const currentNode = await CareerPathNode.findById(nodeId).lean();

    if (!currentNode) {
      throw new ApiError(404, "Node not found");
    }

    const prerequisites = await CareerPathNode.find({
      status: NODE_STATUS.ACTIVE,
      _id: { $in: currentNode.prerequisiteNodeIds || [] },
    })
      .select("title slug nodeType description duration cost")
      .lean();

    return prerequisites;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error("Error fetching prerequisite paths", error);
    throw new ApiError(500, "Failed to fetch prerequisite paths");
  }
};

/**
 * Get entire tree path from starting point to end
 */
export const getCompletePath = async (nodeId, visited = []) => {
  try {
    if (visited.includes(nodeId.toString())) {
      return []; // Prevent circular references
    }

    const node = await CareerPathNode.findById(nodeId)
      .select(
        "title slug nodeType description duration cost nextNodeIds prerequisiteNodeIds"
      )
      .lean();

    if (!node) {
      return [];
    }

    const nextNodes = await Promise.all(
      (node.nextNodeIds || []).map((nextId) =>
        getCompletePath(nextId, [...visited, nodeId.toString()])
      )
    );

    return {
      ...node,
      nextPaths: nextNodes.filter((n) => n && Object.keys(n).length > 0),
    };
  } catch (error) {
    logger.error("Error building complete path", error);
    throw new ApiError(500, "Failed to build path");
  }
};

export default {
  generateRecommendations,
  getNextPaths,
  getPrerequisitePaths,
  getCompletePath,
};