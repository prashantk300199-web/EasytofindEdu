import collegeService from "../services/college.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import  ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

class AdminCollegeController {
  /**
   * Get all colleges
   * GET /api/v1/admin/careers/colleges?city=Mumbai&type=govt&page=1&limit=20
   */
  getAllColleges = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, city = "", state = "", type = "", search = "" } = req.query;

    const result = await collegeService.getAllColleges(
      { city, state, type, search },
      { page: parseInt(page), limit: parseInt(limit) }
    );

    return res.status(200).json(
      new ApiResponse(200, "Colleges retrieved successfully", result)
    );
  });

  /**
   * Get college by slug
   * GET /api/v1/admin/careers/colleges/:slug
   */
  getCollegeBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const college = await collegeService.getCollegeBySlug(slug);

    return res.status(200).json(
      new ApiResponse(200, "College retrieved successfully", college)
    );
  });

  /**
   * Get top colleges
   * GET /api/v1/admin/careers/colleges/top?limit=10
   */
  getTopColleges = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const colleges = await collegeService.getTopColleges(parseInt(limit));

    return res.status(200).json(
      new ApiResponse(200, "Top colleges retrieved successfully", colleges)
    );
  });

  /**
   * Create college
   * POST /api/v1/admin/careers/colleges
   */
  createCollege = asyncHandler(async (req, res) => {
    const {
      name,
      location,
      collegeType,
      description,
      contact,
      ...rest
    } = req.body;

    if (!name) {
      throw new ApiError(400, "College name is required");
    }

    if (!location || !location.city) {
      throw new ApiError(400, "Location with city is required");
    }

    if (!collegeType) {
      throw new ApiError(400, "College type is required");
    }

    const college = await collegeService.createCollege(
      {
        name,
        location,
        collegeType,
        description,
        contact,
        ...rest,
      },
      req.admin._id
    );

    return res.status(201).json(
      new ApiResponse(201, "College created successfully", college)
    );
  });

  /**
   * Update college
   * PUT /api/v1/admin/careers/colleges/:id
   */
  updateCollege = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const college = await collegeService.updateCollege(id, req.body, req.admin._id);

    return res.status(200).json(
      new ApiResponse(200, "College updated successfully", college)
    );
  });

  /**
   * Archive college
   * DELETE /api/v1/admin/careers/colleges/:id
   */
  archiveCollege = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const college = await collegeService.archiveCollege(id, req.admin._id);

    return res.status(200).json(
      new ApiResponse(200, "College archived successfully", college)
    );
  });

  /**
   * Add program to college
   * POST /api/v1/admin/careers/colleges/:collegeId/programs
   */
  addProgramToCollege = asyncHandler(async (req, res) => {
    const { collegeId } = req.params;
    const { programId, seats, cutoff } = req.body;

    if (!programId) {
      throw new ApiError(400, "programId is required");
    }

    const college = await collegeService.updateCollege(
      collegeId,
      {
        $push: {
          programs: {
            programId,
            seats,
            cutoff,
          },
        },
      },
      req.admin._id
    );

    return res.status(200).json(
      new ApiResponse(200, "Program added to college successfully", college)
    );
  });
}

export default new AdminCollegeController();