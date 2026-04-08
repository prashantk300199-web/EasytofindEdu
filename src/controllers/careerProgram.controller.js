import careerProgramService from "../services/careerProgram.service.js";
import ApiResponse  from "../utils/ApiResponse.js";
import  ApiError  from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

class CareerProgramController {
  /**
   * Get all programs (user-facing)
   * GET /api/v1/careers/programs?page=1&limit=12&tags=after_12th&stream=pcm
   * 
   * ALWAYS returns PUBLISHED programs only
   */
  getAllPrograms = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 12,
      search = "",
      tags = [],
      category = "",
      stream = "",
      sortBy = "-createdAt",
    } = req.query;

    // Parse tags if it's a comma-separated string
    const parsedTags = typeof tags === "string" ? (tags ? tags.split(",") : []) : tags || [];

    // ✅ Call service with status: "published" explicitly
    // This ensures we ALWAYS get published programs
    const result = await careerProgramService.getPublishedPrograms(
      { search, tags: parsedTags, category, stream, sortBy },
      { page: parseInt(page), limit: parseInt(limit) }
    );

    // Get facets for filter UI
    const facets = await careerProgramService.getFacets();

    return res.status(200).json(
      new ApiResponse(200, "Programs retrieved successfully", {
        ...result,
        facets,
      })
    );
  });

  /**
   * Get program details by slug
   * GET /api/v1/careers/programs/:slug
   */
  getProgramBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const program = await careerProgramService.getProgramBySlug(slug);

    return res.status(200).json(
      new ApiResponse(200, "Program retrieved successfully", program)
    );
  });

  /**
   * Get featured programs
   * GET /api/v1/careers/programs/featured?limit=6
   */
  getFeaturedPrograms = asyncHandler(async (req, res) => {
    const { limit = 6 } = req.query;

    const programs = await careerProgramService.getFeaturedPrograms(parseInt(limit));

    return res.status(200).json(
      new ApiResponse(200, "Featured programs retrieved successfully", programs)
    );
  });

  /**
   * Get programs by stream
   * GET /api/v1/careers/programs/stream/:stream
   */
  getProgramsByStream = asyncHandler(async (req, res) => {
    const { stream } = req.params;
    const { limit = 20 } = req.query;

    const validStreams = ["pcm", "pcb", "commerce", "arts"];
    if (!validStreams.includes(stream)) {
      throw new ApiError(
        400,
        `Invalid stream. Must be one of: ${validStreams.join(", ")}`
      );
    }

    const programs = await careerProgramService.getProgramsByStream(
      stream,
      parseInt(limit)
    );

    return res.status(200).json(
      new ApiResponse(200, "Programs retrieved successfully", programs)
    );
  });

  /**
   * Get related programs
   * GET /api/v1/careers/programs/:programId/related
   */
  getRelatedPrograms = asyncHandler(async (req, res) => {
    const { programId } = req.params;
    const { limit = 5 } = req.query;

    const programs = await careerProgramService.getRelatedPrograms(
      programId,
      parseInt(limit)
    );

    return res.status(200).json(
      new ApiResponse(200, "Related programs retrieved successfully", programs)
    );
  });
}

export default new CareerProgramController();