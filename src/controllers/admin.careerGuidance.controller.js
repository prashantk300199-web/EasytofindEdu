import CareerGuidanceQuestion from "../models/CareerGuidanceQuestions.js";
import CareerPathNode from "../models/CareerPathNode.js";
import CareerGuidanceAuditLog from "../models/CareerGuidanceAuditLog.js";
import careerGuidanceService from "../services/CareerGuidance.service.js";
import careerTreeBuilder from "../services/careerTreeBuilder.service.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import slugify from "slugify";

const logger = {
  info: (msg, data = {}) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, data),
  error: (msg, error = {}) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, error),
};

// ============= AUDIT LOGGING HELPER =============

const logAction = async (action, resourceType, resourceId, changes, adminId, status = "success", errorMessage = null, req = null) => {
  try {
    await CareerGuidanceAuditLog.create({
      action,
      resourceType,
      resourceId,
      changes,
      adminId,
      status,
      errorMessage,
      ipAddress: req?.ip || "unknown",
      userAgent: req?.get("user-agent") || "unknown",
      performedAt: new Date(),
    });
  } catch (error) {
    logger.error("Error logging action", error);
  }
};

// ============= QUESTION MANAGEMENT =============

/**
 * POST /api/v1/admin/career/questions
 * Create a new question
 */
export const createQuestion = asyncHandler(async (req, res) => {
  // Only SuperAdmin can create questions
  if (req.admin.role !== "superadmin") {
    throw new ApiError(403, "Only SuperAdmin can create questions");
  }

  const questionData = req.body;

  const question = await careerGuidanceService.createQuestion(questionData, req.admin._id);

  await logAction(
    "CREATE_QUESTION",
    "QUESTION",
    question._id,
    { after: question },
    req.admin._id,
    "success",
    null,
    req
  );

  res.status(201).json(
    new ApiResponse(201, question, "Question created successfully")
  );
});

/**
 * GET /api/v1/admin/career/questions
 * Get all questions with pagination
 */
export const getAllQuestions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, category, isActive } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (isActive !== undefined) filter.isActive = isActive === "true";

  const skip = (page - 1) * limit;

  const [questions, total] = await Promise.all([
    CareerGuidanceQuestion.find(filter)
      .sort({ displayOrder: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    CareerGuidanceQuestion.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        questions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      "Questions retrieved successfully"
    )
  );
});

/**
 * GET /api/v1/admin/career/questions/:id
 * Get a specific question
 */
export const getQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const question = await CareerGuidanceQuestion.findById(id);
  if (!question) {
    throw new ApiError(404, "Question not found");
  }

  res.status(200).json(
    new ApiResponse(200, question, "Question retrieved successfully")
  );
});

/**
 * PUT /api/v1/admin/career/questions/:id
 * Update a question
 */
export const updateQuestion = asyncHandler(async (req, res) => {
  if (req.admin.role !== "superadmin") {
    throw new ApiError(403, "Only SuperAdmin can update questions");
  }

  const { id } = req.params;
  const updateData = req.body;

  const before = await CareerGuidanceQuestion.findById(id);
  if (!before) {
    throw new ApiError(404, "Question not found");
  }

  const question = await careerGuidanceService.updateQuestion(
    id,
    updateData,
    req.admin._id
  );

  await logAction(
    "UPDATE_QUESTION",
    "QUESTION",
    id,
    { before: before.toObject(), after: question.toObject() },
    req.admin._id,
    "success",
    null,
    req
  );

  res.status(200).json(
    new ApiResponse(200, question, "Question updated successfully")
  );
});

/**
 * DELETE /api/v1/admin/career/questions/:id
 * Delete a question
 */
export const deleteQuestion = asyncHandler(async (req, res) => {
  if (req.admin.role !== "superadmin") {
    throw new ApiError(403, "Only SuperAdmin can delete questions");
  }

  const { id } = req.params;

  const before = await CareerGuidanceQuestion.findById(id);
  if (!before) {
    throw new ApiError(404, "Question not found");
  }

  const result = await careerGuidanceService.deleteQuestion(id);

  await logAction(
    "DELETE_QUESTION",
    "QUESTION",
    id,
    { before: before.toObject(), after: null },
    req.admin._id,
    "success",
    null,
    req
  );

  res.status(200).json(new ApiResponse(200, result, result.message));
});

// ============= NODE/COURSE MANAGEMENT =============

/**
 * POST /api/v1/admin/career/nodes
 * Create a new career path node
 */
export const createNode = asyncHandler(async (req, res) => {
  if (req.admin.role !== "superadmin") {
    throw new ApiError(403, "Only SuperAdmin can create nodes");
  }

  const nodeData = req.body;
  const node = await careerGuidanceService.createCareerNode(nodeData, req.admin._id);

  await logAction(
    "CREATE_NODE",
    "NODE",
    node._id,
    { after: node },
    req.admin._id,
    "success",
    null,
    req
  );

  res.status(201).json(
    new ApiResponse(201, node, "Career node created successfully")
  );
});

/**
 * GET /api/v1/admin/career/nodes
 * Get all nodes with pagination
 */
export const getAllNodes = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, nodeType, status, isFeatured, search } = req.query;

  const filter = {};
  if (nodeType) filter.nodeType = nodeType;
  if (status) filter.status = status;
  if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [nodes, total] = await Promise.all([
    CareerPathNode.find(filter)
      .select(
        "title slug nodeType status level cost duration successMetrics isFeatured createdAt"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    CareerPathNode.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        nodes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      "Nodes retrieved successfully"
    )
  );
});

/**
 * GET /api/v1/admin/career/nodes/:id
 * Get a specific node
 */
export const getNode = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const node = await CareerPathNode.findById(id)
    .populate("prerequisiteNodeIds", "title slug")
    .populate("nextNodeIds", "title slug")
    .populate("createdBy", "name email")
    .populate("lastModifiedBy", "name email");

  if (!node) {
    throw new ApiError(404, "Node not found");
  }

  res.status(200).json(
    new ApiResponse(200, node, "Node retrieved successfully")
  );
});

/**
 * PUT /api/v1/admin/career/nodes/:id
 * Update a node
 */
export const updateNode = asyncHandler(async (req, res) => {
  if (req.admin.role !== "superadmin") {
    throw new ApiError(403, "Only SuperAdmin can update nodes");
  }

  const { id } = req.params;
  const updateData = req.body;

  const before = await CareerPathNode.findById(id);
  if (!before) {
    throw new ApiError(404, "Node not found");
  }

  const node = await careerGuidanceService.updateCareerNode(
    id,
    updateData,
    req.admin._id
  );

  await logAction(
    "UPDATE_NODE",
    "NODE",
    id,
    { before: before.toObject(), after: node.toObject() },
    req.admin._id,
    "success",
    null,
    req
  );

  res.status(200).json(
    new ApiResponse(200, node, "Node updated successfully")
  );
});

/**
 * DELETE /api/v1/admin/career/nodes/:id
 * Delete a node
 */
export const deleteNode = asyncHandler(async (req, res) => {
  if (req.admin.role !== "superadmin") {
    throw new ApiError(403, "Only SuperAdmin can delete nodes");
  }

  const { id } = req.params;

  const before = await CareerPathNode.findById(id);
  if (!before) {
    throw new ApiError(404, "Node not found");
  }

  const result = await careerGuidanceService.deleteCareerNode(id);

  await logAction(
    "DELETE_NODE",
    "NODE",
    id,
    { before: before.toObject(), after: null },
    req.admin._id,
    "success",
    null,
    req
  );

  res.status(200).json(new ApiResponse(200, result, result.message));
});

// ============= TREE MANAGEMENT =============

/**
 * GET /api/v1/admin/career/tree
 * Get complete career tree structure
 */
export const getCareerTree = asyncHandler(async (req, res) => {
  const { qualification } = req.query;

  const tree = await careerTreeBuilder.buildCareerTree(qualification);

  res.status(200).json(
    new ApiResponse(200, tree, "Career tree retrieved successfully")
  );
});

/**
 * GET /api/v1/admin/career/tree/validate
 * Validate tree structure for circular dependencies
 */
export const validateTree = asyncHandler(async (req, res) => {
  const validation = await careerTreeBuilder.validateTreeStructure();

  res.status(200).json(
    new ApiResponse(
      validation.isValid ? 200 : 206,
      validation,
      validation.isValid
        ? "Tree structure is valid"
        : "Tree validation completed with errors"
    )
  );
});

/**
 * GET /api/v1/admin/career/tree/levels
 * Get nodes by hierarchy level
 */
export const getNodesByLevel = asyncHandler(async (req, res) => {
  const { level } = req.query;

  if (!level) {
    throw new ApiError(400, "Level parameter is required");
  }

  const nodes = await careerTreeBuilder.getNodesByLevel(parseInt(level));

  res.status(200).json(
    new ApiResponse(200, nodes, `Nodes at level ${level} retrieved successfully`)
  );
});

// ============= FEATURED COURSES MANAGEMENT =============

/**
 * PUT /api/v1/admin/career/nodes/:id/feature
 * Feature a course (make it appear on homepage)
 */
export const featureNode = asyncHandler(async (req, res) => {
  if (req.admin.role !== "superadmin") {
    throw new ApiError(403, "Only SuperAdmin can feature nodes");
  }

  const { id } = req.params;

  const before = await CareerPathNode.findById(id);
  if (!before) {
    throw new ApiError(404, "Node not found");
  }

  const node = await CareerPathNode.findByIdAndUpdate(
    id,
    { isFeatured: true, lastModifiedBy: req.admin._id },
    { new: true }
  );

  await logAction(
    "FEATURE_NODE",
    "NODE",
    id,
    { before: { isFeatured: before.isFeatured }, after: { isFeatured: true } },
    req.admin._id,
    "success",
    null,
    req
  );

  res.status(200).json(new ApiResponse(200, node, "Node featured successfully"));
});

/**
 * PUT /api/v1/admin/career/nodes/:id/unfeature
 * Remove featured status from a course
 */
export const unfeatureNode = asyncHandler(async (req, res) => {
  if (req.admin.role !== "superadmin") {
    throw new ApiError(403, "Only SuperAdmin can unfeature nodes");
  }

  const { id } = req.params;

  const before = await CareerPathNode.findById(id);
  if (!before) {
    throw new ApiError(404, "Node not found");
  }

  const node = await CareerPathNode.findByIdAndUpdate(
    id,
    { isFeatured: false, lastModifiedBy: req.admin._id },
    { new: true }
  );

  await logAction(
    "UNFEATURE_NODE",
    "NODE",
    id,
    { before: { isFeatured: before.isFeatured }, after: { isFeatured: false } },
    req.admin._id,
    "success",
    null,
    req
  );

  res.status(200).json(new ApiResponse(200, node, "Node unfeatured successfully"));
});

// ============= BULK OPERATIONS =============

/**
 * POST /api/v1/admin/career/bulk-import
 * Bulk import career data
 */
export const bulkImport = asyncHandler(async (req, res) => {
  if (req.admin.role !== "superadmin") {
    throw new ApiError(403, "Only SuperAdmin can bulk import data");
  }

  const { questions, nodes } = req.body;

  if (!questions && !nodes) {
    throw new ApiError(400, "No data to import");
  }

  const results = { questionsCreated: 0, nodesCreated: 0, errors: [] };

  // Import questions
  if (Array.isArray(questions)) {
    for (const question of questions) {
      try {
        await careerGuidanceService.createQuestion(question, req.admin._id);
        results.questionsCreated++;
      } catch (error) {
        results.errors.push({
          type: "question",
          data: question,
          error: error.message,
        });
      }
    }
  }

  // Import nodes
  if (Array.isArray(nodes)) {
    for (const node of nodes) {
      try {
        await careerGuidanceService.createCareerNode(node, req.admin._id);
        results.nodesCreated++;
      } catch (error) {
        results.errors.push({
          type: "node",
          data: node,
          error: error.message,
        });
      }
    }
  }

  await logAction(
    "BULK_IMPORT",
    "BULK_IMPORT",
    null,
    results,
    req.admin._id,
    results.errors.length === 0 ? "success" : "partial",
    results.errors.length > 0
      ? `${results.errors.length} errors occurred`
      : null,
    req
  );

  res.status(200).json(
    new ApiResponse(
      200,
      results,
      `Bulk import completed: ${results.questionsCreated} questions, ${results.nodesCreated} nodes created`
    )
  );
});

// ============= ANALYTICS =============

/**
 * GET /api/v1/admin/career/analytics
 * Get career guidance analytics
 */
export const getAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const filter = {};
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const [
    totalQuestions,
    totalNodes,
    featuredNodes,
    auditLogs,
    topSearches,
    nodeAnalytics,
  ] = await Promise.all([
    CareerGuidanceQuestion.countDocuments(),
    CareerPathNode.countDocuments(),
    CareerPathNode.countDocuments({ isFeatured: true }),
    CareerGuidanceAuditLog.countDocuments(filter),
    CareerPathNode.find()
      .sort({ viewCount: -1 })
      .select("title viewCount clickCount saveCount")
      .limit(10)
      .lean(),
    CareerPathNode.find()
      .select("title nodeType viewCount clickCount saveCount popularityScore")
      .lean(),
  ]);

  const analytics = {
    questions: {
      total: totalQuestions,
    },
    nodes: {
      total: totalNodes,
      featured: featuredNodes,
    },
    activity: {
      auditLogs,
    },
    popularity: {
      topViewed: topSearches,
      totalInteractions: nodeAnalytics.reduce(
        (sum, node) => sum + (node.viewCount + node.clickCount + node.saveCount),
        0
      ),
    },
  };

  res.status(200).json(
    new ApiResponse(200, analytics, "Analytics retrieved successfully")
  );
});

/**
 * GET /api/v1/admin/career/audit-logs
 * Get audit logs with pagination
 */
export const getAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, action, resourceType, adminId } = req.query;

  const filter = {};
  if (action) filter.action = action;
  if (resourceType) filter.resourceType = resourceType;
  if (adminId) filter.adminId = adminId;

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    CareerGuidanceAuditLog.find(filter)
      .populate("adminId", "name email")
      .sort({ performedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    CareerGuidanceAuditLog.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      "Audit logs retrieved successfully"
    )
  );
});

export default {
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
};