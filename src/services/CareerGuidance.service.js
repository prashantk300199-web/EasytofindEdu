import CareerPathNode from "../models/CareerPathNode.js";
import CareerGuidanceQuestion from "../models/CareerGuidanceQuestions.js";
import StudentCareerProfile from "../models/Students.js";
import ApiError from "../utils/ApiError.js";
import { DEFAULT_CONFIG, NODE_STATUS } from "../constants/careerGuidance.constants.js";
import slugify from "slugify";

const logger = {
  info: (msg, data = {}) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, data),
  error: (msg, error = {}) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, error),
  debug: (msg, data = {}) => process.env.NODE_ENV === 'development' && console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`, data),
};

// ============= QUESTIONS SERVICE =============

export const getAllActiveQuestions = async (category = null) => {
  try {
    const filter = { isActive: true };
    if (category) {
      filter.category = category;
    }

    const questions = await CareerGuidanceQuestion.find(filter)
      .sort({ displayOrder: 1 })
      .lean();

    logger.info("Fetched active questions", { count: questions.length, category });
    return questions;
  } catch (error) {
    logger.error("Error fetching questions", error);
    throw new ApiError(500, "Failed to fetch questions");
  }
};

export const getQuestionsByIds = async (questionIds) => {
  try {
    const questions = await CareerGuidanceQuestion.find({
      _id: { $in: questionIds },
      isActive: true,
    }).lean();

    return questions;
  } catch (error) {
    logger.error("Error fetching questions by IDs", error);
    throw new ApiError(500, "Failed to fetch questions");
  }
};

export const createQuestion = async (questionData, adminId) => {
  try {
    // Check if question number already exists
    const existingQuestion = await CareerGuidanceQuestion.findOne({
      questionNumber: questionData.questionNumber,
    });

    if (existingQuestion) {
      throw new ApiError(400, "Question number already exists");
    }

    const newQuestion = new CareerGuidanceQuestion({
      ...questionData,
      createdBy: adminId,
    });

    await newQuestion.save();
    logger.info("Question created", { questionId: newQuestion._id });
    return newQuestion;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error("Error creating question", error);
    throw new ApiError(500, "Failed to create question");
  }
};

export const updateQuestion = async (questionId, updateData, adminId) => {
  try {
    const question = await CareerGuidanceQuestion.findByIdAndUpdate(
      questionId,
      {
        ...updateData,
        lastModifiedBy: adminId,
      },
      { new: true, runValidators: true }
    );

    if (!question) {
      throw new ApiError(404, "Question not found");
    }

    logger.info("Question updated", { questionId });
    return question;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error("Error updating question", error);
    throw new ApiError(500, "Failed to update question");
  }
};

export const deleteQuestion = async (questionId) => {
  try {
    const question = await CareerGuidanceQuestion.findByIdAndDelete(questionId);

    if (!question) {
      throw new ApiError(404, "Question not found");
    }

    logger.info("Question deleted", { questionId });
    return { message: "Question deleted successfully" };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error("Error deleting question", error);
    throw new ApiError(500, "Failed to delete question");
  }
};

// ============= COURSE/NODE SERVICE =============

export const getFeaturedCourses = async () => {
  try {
    const featured = await CareerPathNode.find({
      isFeatured: true,
      status: NODE_STATUS.ACTIVE,
    })
      .select(
        "title slug description thumbnail cost duration nodeType successMetrics"
      )
      .limit(20)
      .lean();

    return featured;
  } catch (error) {
    logger.error("Error fetching featured courses", error);
    throw new ApiError(500, "Failed to fetch featured courses");
  }
};

export const searchCourses = async (filters = {}, page = 1, limit = 20) => {
  try {
    const query = {
      status: NODE_STATUS.ACTIVE,
    };

    // Text search
    if (filters.query) {
      query.$text = { $search: filters.query };
    }

    // Filters
    if (filters.qualification) {
      query.applicableQualifications = filters.qualification;
    }
    if (filters.stream) {
      query.applicableStreams = filters.stream;
    }
    if (filters.nodeType) {
      query.nodeType = filters.nodeType;
    }

    // Cost range
    if (filters.minCost || filters.maxCost) {
      query["cost.average"] = {};
      if (filters.minCost) query["cost.average"].$gte = filters.minCost;
      if (filters.maxCost) query["cost.average"].$lte = filters.maxCost;
    }

    // Success rate
    if (filters.minSuccessRate || filters.maxSuccessRate) {
      query["successMetrics.successRate"] = {};
      if (filters.minSuccessRate)
        query["successMetrics.successRate"].$gte = filters.minSuccessRate;
      if (filters.maxSuccessRate)
        query["successMetrics.successRate"].$lte = filters.maxSuccessRate;
    }

    const skip = (page - 1) * limit;

    const [courses, totalCount] = await Promise.all([
      CareerPathNode.find(query)
        .select(
          "title slug nodeType description thumbnail cost duration successMetrics popularityScore"
        )
        .skip(skip)
        .limit(limit)
        .sort({ popularityScore: -1, createdAt: -1 })
        .lean(),
      CareerPathNode.countDocuments(query),
    ]);

    logger.info("Courses searched", { count: courses.length, page, limit });

    return {
      courses,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  } catch (error) {
    logger.error("Error searching courses", error);
    throw new ApiError(500, "Failed to search courses");
  }
};

export const getCourseDetails = async (courseSlugOrId) => {
  try {
    const query = {
      status: NODE_STATUS.ACTIVE,
      $or: [
        { slug: courseSlugOrId },
        { _id: courseSlugOrId.match(/^[0-9a-fA-F]{24}$/) ? courseSlugOrId : null },
      ].filter(Boolean),
    };

    const course = await CareerPathNode.findOne(query)
      .populate("nextNodeIds", "title slug nodeType")
      .populate("prerequisiteNodeIds", "title slug nodeType")
      .lean();

    if (!course) {
      throw new ApiError(404, "Course not found");
    }

    // Increment view count
    await CareerPathNode.updateOne({ _id: course._id }, { $inc: { viewCount: 1 } });

    return course;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error("Error fetching course details", error);
    throw new ApiError(500, "Failed to fetch course details");
  }
};

export const createCareerNode = async (nodeData, adminId) => {
  try {
    // Generate slug
    const slug = slugify(nodeData.title, { lower: true, strict: true });

    // Check for duplicate title
    const existing = await CareerPathNode.findOne({ title: nodeData.title });
    if (existing) {
      throw new ApiError(400, "Course with this title already exists");
    }

    // Validate prerequisites and next nodes exist
    if (nodeData.prerequisiteNodeIds && nodeData.prerequisiteNodeIds.length > 0) {
      const prereqs = await CareerPathNode.countDocuments({
        _id: { $in: nodeData.prerequisiteNodeIds },
      });
      if (prereqs !== nodeData.prerequisiteNodeIds.length) {
        throw new ApiError(400, "One or more prerequisite nodes not found");
      }
    }

    const newNode = new CareerPathNode({
      ...nodeData,
      slug,
      createdBy: adminId,
    });

    await newNode.save();
    logger.info("Career node created", { nodeId: newNode._id, title: newNode.title });
    return newNode;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error("Error creating career node", error);
    throw new ApiError(500, "Failed to create career node");
  }
};

export const updateCareerNode = async (nodeId, updateData, adminId) => {
  try {
    const node = await CareerPathNode.findById(nodeId);
    if (!node) {
      throw new ApiError(404, "Career node not found");
    }

    // If title changed, update slug
    if (updateData.title && updateData.title !== node.title) {
      const existingWithTitle = await CareerPathNode.findOne({
        title: updateData.title,
        _id: { $ne: nodeId },
      });

      if (existingWithTitle) {
        throw new ApiError(400, "Another course with this title already exists");
      }

      updateData.slug = slugify(updateData.title, { lower: true, strict: true });
    }

    const updated = await CareerPathNode.findByIdAndUpdate(
      nodeId,
      {
        ...updateData,
        lastModifiedBy: adminId,
      },
      { new: true, runValidators: true }
    );

    logger.info("Career node updated", { nodeId });
    return updated;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error("Error updating career node", error);
    throw new ApiError(500, "Failed to update career node");
  }
};

export const deleteCareerNode = async (nodeId) => {
  try {
    // Check if node is referenced as prerequisite
    const referencedAsPrereq = await CareerPathNode.findOne({
      prerequisiteNodeIds: nodeId,
    });

    if (referencedAsPrereq) {
      throw new ApiError(
        400,
        "Cannot delete this node as it's a prerequisite for other courses"
      );
    }

    const deleted = await CareerPathNode.findByIdAndDelete(nodeId);
    if (!deleted) {
      throw new ApiError(404, "Career node not found");
    }

    logger.info("Career node deleted", { nodeId });
    return { message: "Career node deleted successfully" };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error("Error deleting career node", error);
    throw new ApiError(500, "Failed to delete career node");
  }
};

// ============= STUDENT PROFILE SERVICE =============

export const getOrCreateStudentProfile = async (studentId) => {
  try {
    let profile = await StudentCareerProfile.findOne({ studentId });

    if (!profile) {
      profile = new StudentCareerProfile({ studentId });
      await profile.save();
      logger.info("Student profile created", { studentId });
    }

    return profile;
  } catch (error) {
    logger.error("Error getting/creating student profile", error);
    throw new ApiError(500, "Failed to manage student profile");
  }
};

export const submitQuestionnaires = async (studentId, answers) => {
  try {
    let profile = await StudentCareerProfile.findOne({ studentId });

    if (!profile) {
      profile = new StudentCareerProfile({ studentId });
    }

    profile.answers = answers;
    profile.completedQuestionnaireAt = new Date();
    profile.isProfileComplete = true;
    profile.profileCompletionPercentage = calculateCompletionPercentage(answers);
    profile.lastActivityAt = new Date();

    await profile.save();
    logger.info("Questionnaire submitted", { studentId });
    return profile;
  } catch (error) {
    logger.error("Error submitting questionnaire", error);
    throw new ApiError(500, "Failed to submit questionnaire");
  }
};

export const saveCareerPath = async (studentId, nodeId, status, notes) => {
  try {
    let profile = await StudentCareerProfile.findOne({ studentId });

    if (!profile) {
      profile = new StudentCareerProfile({ studentId });
    }

    // Check if path already saved
    const existingIndex = profile.savedPaths.findIndex(
      (p) => p.nodeId.toString() === nodeId.toString()
    );

    if (existingIndex !== -1) {
      // Update existing
      profile.savedPaths[existingIndex].status = status || profile.savedPaths[existingIndex].status;
      profile.savedPaths[existingIndex].notes = notes || profile.savedPaths[existingIndex].notes;
      profile.savedPaths[existingIndex].savedAt = new Date();
    } else {
      // Add new
      profile.savedPaths.push({
        nodeId,
        status: status || "interested",
        notes,
        savedAt: new Date(),
      });
    }

    profile.totalPathsSaved = profile.savedPaths.length;
    profile.lastActivityAt = new Date();

    await profile.save();
    logger.info("Career path saved", { studentId, nodeId });
    return profile;
  } catch (error) {
    logger.error("Error saving career path", error);
    throw new ApiError(500, "Failed to save career path");
  }
};

export const getSavedPaths = async (studentId, page = 1, limit = 20) => {
  try {
    const profile = await StudentCareerProfile.findOne({ studentId });

    if (!profile) {
      return { paths: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }

    const skip = (page - 1) * limit;
    const totalPaths = profile.savedPaths.length;

    const paginatedPaths = profile.savedPaths.slice(skip, skip + limit);

    // Populate node details
    const populatedPaths = await Promise.all(
      paginatedPaths.map(async (p) => {
        const node = await CareerPathNode.findById(p.nodeId).select(
          "title slug description cost duration nodeType"
        );
        return {
          ...p.toObject(),
          node,
        };
      })
    );

    return {
      paths: populatedPaths,
      pagination: {
        page,
        limit,
        total: totalPaths,
        totalPages: Math.ceil(totalPaths / limit),
      },
    };
  } catch (error) {
    logger.error("Error getting saved paths", error);
    throw new ApiError(500, "Failed to fetch saved paths");
  }
};

export const getStudentProfile = async (studentId) => {
  try {
    const profile = await StudentCareerProfile.findOne({ studentId });

    if (!profile) {
      throw new ApiError(404, "Student profile not found");
    }

    return profile;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error("Error fetching student profile", error);
    throw new ApiError(500, "Failed to fetch student profile");
  }
};

// ============= HELPER FUNCTIONS =============

const calculateCompletionPercentage = (answers) => {
  const totalFields = Object.keys(answers).length;
  const filledFields = Object.values(answers).filter((v) => v !== null && v !== undefined && v !== "").length;
  return Math.round((filledFields / totalFields) * 100);
};

export default {
  getAllActiveQuestions,
  getQuestionsByIds,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getFeaturedCourses,
  searchCourses,
  getCourseDetails,
  createCareerNode,
  updateCareerNode,
  deleteCareerNode,
  getOrCreateStudentProfile,
  submitQuestionnaires,
  saveCareerPath,
  getSavedPaths,
  getStudentProfile,
};