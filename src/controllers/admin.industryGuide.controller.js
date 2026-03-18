import IndustryGuide from "../models/IndustryGuide.js";
import CareerProgram from "../models/CareerProgram.js";
import  ApiResponse  from "../utils/ApiResponse.js";
import  ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import slugify from "../utils/slugify.js";

class AdminIndustryGuideController {
  /**
   * Get all industry guides
   * GET /api/v1/admin/careers/industry-guides
   */
  getAllIndustryGuides = asyncHandler(async (req, res) => {
    const { industry = "", status = "published", page = 1, limit = 20 } = req.query;

    const query = {};
    if (industry) query.industry = industry;
    if (status !== "all") query.status = status;

    const guides = await IndustryGuide.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await IndustryGuide.countDocuments(query);

    return res.status(200).json(
      new ApiResponse(200, "Industry guides retrieved successfully", {
        data: guides,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      })
    );
  });

  /**
   * Create industry guide
   * POST /api/v1/admin/careers/industry-guides
   */
  createIndustryGuide = asyncHandler(async (req, res) => {
    const { title, industry, description, marketSize, marketGrowthRate, ...rest } = req.body;

    if (!title) throw new ApiError(400, "Industry guide title is required");
    if (!industry) throw new ApiError(400, "Industry is required");

    // Check for duplicates
    const exists = await IndustryGuide.findOne({ industry });
    if (exists) {
      throw new ApiError(409, `Guide for ${industry} already exists`);
    }

    const slug = slugify(title);

    const guide = new IndustryGuide({
      title,
      slug,
      industry,
      description,
      marketSize,
      marketGrowthRate,
      createdBy: req.admin._id,
      ...rest,
    });

    await guide.save();

    return res.status(201).json(
      new ApiResponse(201, "Industry guide created successfully", guide)
    );
  });

  /**
   * Update industry guide
   * PUT /api/v1/admin/careers/industry-guides/:id
   */
  updateIndustryGuide = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const guide = await IndustryGuide.findByIdAndUpdate(
      id,
      { ...req.body, updatedBy: req.admin._id },
      { new: true, runValidators: true }
    );

    if (!guide) throw new ApiError(404, "Industry guide not found");

    return res.status(200).json(
      new ApiResponse(200, "Industry guide updated successfully", guide)
    );
  });

  /**
   * Link program to industry
   * POST /api/v1/admin/careers/programs/:programId/industry/:industryId
   */
  linkProgramToIndustry = asyncHandler(async (req, res) => {
    const { programId, industryId } = req.params;

    const guide = await IndustryGuide.findById(industryId);
    if (!guide) throw new ApiError(404, "Industry guide not found");

    const program = await CareerProgram.findById(programId);
    if (!program) throw new ApiError(404, "Program not found");

    // Add to guide's linkedPrograms
    const alreadyLinked = guide.linkedPrograms?.some(
      p => p.programId.toString() === programId
    );

    if (!alreadyLinked) {
      if (!guide.linkedPrograms) guide.linkedPrograms = [];
      guide.linkedPrograms.push({ programId });
      await guide.save();
    }

    return res.status(200).json(
      new ApiResponse(200, "Program linked to industry", guide)
    );
  });

  /**
   * Get industry overview
   * GET /api/v1/admin/careers/industry-guides/:id/overview
   */
  getIndustryOverview = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const guide = await IndustryGuide.findById(id)
      .populate("linkedPrograms.programId", "title slug category");

    if (!guide) throw new ApiError(404, "Industry guide not found");

    const overview = {
      industry: guide.industry,
      title: guide.title,
      description: guide.description,
      marketSize: guide.marketSize,
      marketGrowthRate: guide.marketGrowthRate,
      marketForecast: guide.marketForecast,
      keySectors: guide.keySectors,
      linkedPrograms: guide.linkedPrograms,
      topRoles: guide.topCareerRoles,
      requiredSkills: guide.requiredSkills,
      futureOutlook: guide.futureOutlook,
    };

    return res.status(200).json(
      new ApiResponse(200, "Industry overview retrieved", overview)
    );
  });

  /**
   * Publish industry guide
   * PATCH /api/v1/admin/careers/industry-guides/:id/publish
   */
  publishIndustryGuide = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const guide = await IndustryGuide.findByIdAndUpdate(
      id,
      { status: "published", updatedBy: req.admin._id },
      { new: true }
    );

    if (!guide) throw new ApiError(404, "Industry guide not found");

    return res.status(200).json(
      new ApiResponse(200, "Industry guide published successfully", guide)
    );
  });
}

export default new AdminIndustryGuideController();