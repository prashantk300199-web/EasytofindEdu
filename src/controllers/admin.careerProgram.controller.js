import careerProgramService from "../services/careerProgram.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
// ✅ FIXED: Imported the model at the top using ES Module syntax
import CareerProgram from "../models/CareerProgram.js";

class AdminCareerProgramController {
  /**
   * Get all programs (admin view - includes drafts/archived)
   * GET /api/v1/admin/careers/programs?status=draft&page=1&limit=20nnn
   * * Supports status: "published" | "draft" | "archived" | "all"
   */
  getAllPrograms = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status = "published", search = "" } = req.query;

    // ✅ Call service with admin method
    // Passes status directly - no double filtering!
    const result = await careerProgramService.getAllProgramsForAdmin(
      { status, search },
      { page: parseInt(page), limit: parseInt(limit) }
    );

    return res.status(200).json(
      new ApiResponse(200, "Programs retrieved successfully", result)
    );
  });

  /**
   * Create program
   * POST /api/v1/admin/careers/programs
   */
  createProgram = asyncHandler(async (req, res) => {
    const {
      title,
      category,
      tags,
      requiredStream,
      requiredQualification,
      duration,
      fees,
      salary,
      jobRoles,
      description,
      overview,
      ...rest
    } = req.body;

    // Creation without server-side validation as requested
    const program = await careerProgramService.createProgram(
      { ...req.body },
      req.admin._id
    );

    return res.status(201).json(
      new ApiResponse(201, "Program created successfully", program)
    );
  });

  /**
   * Update program
   * PUT /api/v1/admin/careers/programs/:id
   */
  updateProgram = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const program = await careerProgramService.updateProgram(
      id,
      req.body,
      req.admin._id
    );

    return res.status(200).json(
      new ApiResponse(200, "Program updated successfully", program)
    );
  });

  /**
   * Publish program
   * PATCH /api/v1/admin/careers/programs/:id/publish
   */
  publishProgram = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const program = await careerProgramService.publishProgram(id, req.admin._id);

    return res.status(200).json(
      new ApiResponse(200, "Program published successfully", program)
    );
  });

  /**
   * Archive/Delete program
   * DELETE /api/v1/admin/careers/programs/:id
   */
  archiveProgram = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const program = await careerProgramService.archiveProgram(id, req.admin._id);

    return res.status(200).json(
      new ApiResponse(200, "Program archived successfully", program)
    );
  });

  /**
   * Add exam to program
   * POST /api/v1/admin/careers/programs/:programId/exams
   */
  addExamToProgram = asyncHandler(async (req, res) => {
    const { programId } = req.params;
    const { examId, isMandatory = false } = req.body;

    if (!examId) {
      throw new ApiError(400, "examId is required");
    }

    const program = await careerProgramService.addExamToProgram(
      programId,
      examId,
      isMandatory,
      req.admin._id
    );

    return res.status(200).json(
      new ApiResponse(200, "Exam linked to program successfully", program)
    );
  });

  /**
   * Remove exam from program
   * DELETE /api/v1/admin/careers/programs/:programId/exams/:examId
   */
  removeExamFromProgram = asyncHandler(async (req, res) => {
    const { programId, examId } = req.params;

    const program = await careerProgramService.updateProgram(
      programId,
      {
        $pull: { entranceExams: { examId } },
      },
      req.admin._id
    );

    return res.status(200).json(
      new ApiResponse(200, "Exam removed from program successfully", program)
    );
  });

  /**
   * Add college to program
   * POST /api/v1/admin/careers/programs/:programId/colleges
   */
  addCollegeToProgram = asyncHandler(async (req, res) => {
    const { programId } = req.params;
    const { collegeId, rank } = req.body;

    if (!collegeId) {
      throw new ApiError(400, "collegeId is required");
    }

    const program = await careerProgramService.addCollegeToProgram(
      programId,
      collegeId,
      rank,
      req.admin._id
    );

    return res.status(200).json(
      new ApiResponse(200, "College linked to program successfully", program)
    );
  });

  /**
   * Remove college from program
   * DELETE /api/v1/admin/careers/programs/:programId/colleges/:collegeId
   */
  removeCollegeFromProgram = asyncHandler(async (req, res) => {
    const { programId, collegeId } = req.params;

    const program = await careerProgramService.updateProgram(
      programId,
      {
        $pull: { topColleges: { collegeId } },
      },
      req.admin._id
    );

    return res.status(200).json(
      new ApiResponse(200, "College removed from program successfully", program)
    );
  });

  /**
   * Bulk import programs
   * POST /api/v1/admin/careers/programs/bulk/import
   * Body: { programs: [{...}, {...}] }
   */
  bulkImportPrograms = asyncHandler(async (req, res) => {
    const { programs } = req.body;

    if (!Array.isArray(programs)) {
      throw new ApiError(400, "programs must be an array");
    }

    if (programs.length === 0) {
      throw new ApiError(400, "programs array cannot be empty");
    }

    if (programs.length > 1000) {
      throw new ApiError(400, "Cannot import more than 1000 programs at once");
    }

    const result = await careerProgramService.bulkImportPrograms(
      programs,
      req.admin._id
    );

    return res.status(200).json(
      new ApiResponse(200, "Bulk import completed", result)
    );
  });

  /**
   * Get program stats (for admin dashboard)
   * GET /api/v1/admin/careers/programs/stats
   */
  getProgramStats = asyncHandler(async (req, res) => {
    // ✅ FIXED: Removed the require statement from here.

    const stats = await CareerProgram.aggregate([
      {
        $facet: {
          totalCount: [{ $count: "count" }],
          byStatus: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ],
          byCategory: [
            {
              $group: {
                _id: "$category",
                count: { $sum: 1 },
              },
            },
          ],
          featured: [
            { $match: { isFeatured: true } },
            { $count: "count" },
          ],
          byStream: [
            {
              $group: {
                _id: "$requiredStream",
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    return res.status(200).json(
      new ApiResponse(200, "Program stats retrieved successfully", stats[0])
    );
  });
}

export default new AdminCareerProgramController();