import entranceExamService from "../services/entranceExam.service.js";
import  ApiResponse  from "../utils/ApiResponse.js";
import  ApiError  from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

class AdminEntranceExamController {
  /**
   * Get all exams
   * GET /api/v1/admin/careers/exams?type=engineering&page=1&limit=20
   */
  getAllExams = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, type = "", search = "" } = req.query;

    const result = await entranceExamService.getAllExams(
      { type, search },
      { page: parseInt(page), limit: parseInt(limit) }
    );

    return res.status(200).json(
      new ApiResponse(200, "Exams retrieved successfully", result)
    );
  });

  /**
   * Get exam by slug
   * GET /api/v1/admin/careers/exams/:slug
   */
  getExamBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const exam = await entranceExamService.getExamBySlug(slug);

    return res.status(200).json(
      new ApiResponse(200, "Exam retrieved successfully", exam)
    );
  });

  /**
   * Create exam
   * POST /api/v1/admin/careers/exams
   */
  createExam = asyncHandler(async (req, res) => {
    const { name, type, description, difficultyLevel, ...rest } = req.body;

    if (!name) {
      throw new ApiError(400, "Exam name is required");
    }

    if (!type) {
      throw new ApiError(400, "Exam type is required");
    }

    const exam = await entranceExamService.createExam(
      {
        name,
        type,
        description,
        difficultyLevel,
        ...rest,
      },
      req.admin._id
    );

    return res.status(201).json(
      new ApiResponse(201, "Exam created successfully", exam)
    );
  });

  /**
   * Update exam
   * PUT /api/v1/admin/careers/exams/:id
   */
  updateExam = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const exam = await entranceExamService.updateExam(id, req.body, req.admin._id);

    return res.status(200).json(
      new ApiResponse(200, "Exam updated successfully", exam)
    );
  });

  /**
   * Publish exam
   * PATCH /api/v1/admin/careers/exams/:id/publish
   */
  publishExam = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const exam = await entranceExamService.updateExam(
      id,
      { status: "published" },
      req.admin._id
    );

    return res.status(200).json(
      new ApiResponse(200, "Exam published successfully", exam)
    );
  });

  /**
   * Archive exam
   * DELETE /api/v1/admin/careers/exams/:id
   */
  archiveExam = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const exam = await entranceExamService.archiveExam(id, req.admin._id);

    return res.status(200).json(
      new ApiResponse(200, "Exam archived successfully", exam)
    );
  });
}

export default new AdminEntranceExamController();