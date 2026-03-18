import SpecializationPath from "../models/SpecializationPath.js";
import CareerProgram from "../models/CareerProgram.js";
import CareerGuidanceAuditLog from "../models/CareerGuidanceAuditLog.js";
import  ApiResponse  from "../utils/ApiResponse.js";
import  ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import slugify from "../utils/slugify.js";

class AdminSpecializationController {
  /**
   * Get all specializations for a program
   * GET /api/v1/admin/careers/programs/:programId/specializations
   */
  getProgramSpecializations = asyncHandler(async (req, res) => {
    const { programId } = req.params;
    const { status = "published", page = 1, limit = 20 } = req.query;

    const query = { parentProgramId: programId };
    if (status !== "all") {
      query.status = status;
    }

    const specializations = await SpecializationPath.find(query)
      .populate("parentProgramId", "title slug")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await SpecializationPath.countDocuments(query);

    return res.status(200).json(
      new ApiResponse(200, "Program specializations retrieved", {
        data: specializations,
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
   * Create specialization path
   * POST /api/v1/admin/careers/specializations
   */
  createSpecialization = asyncHandler(async (req, res) => {
    const {
      title,
      parentProgramId,
      type,
      description,
      skillsGained,
      jobRoles,
      salaryBoost,
      difficultyLevel,
      industryDemand,
      ...rest
    } = req.body;

    // Validate required fields
    if (!title) throw new ApiError(400, "Specialization title is required");
    if (!parentProgramId) throw new ApiError(400, "Parent program is required");
    if (!type) throw new ApiError(400, "Specialization type is required");

    // Verify parent program exists
    const program = await CareerProgram.findById(parentProgramId);
    if (!program) throw new ApiError(404, "Parent program not found");

    // Check for duplicates
    const exists = await SpecializationPath.findOne({
      title,
      parentProgramId,
    });
    if (exists) {
      throw new ApiError(
        409,
        `Specialization "${title}" already exists for this program`
      );
    }

    const slug = slugify(title);

    const specialization = new SpecializationPath({
      title,
      slug,
      parentProgramId,
      type,
      description,
      skillsGained,
      jobRoles,
      salaryBoost,
      difficultyLevel,
      industryDemand,
      createdBy: req.admin._id,
      status: "draft",
      ...rest,
    });

    await specialization.save();

    // Log audit
    await CareerGuidanceAuditLog.create({
      adminId: req.admin._id,
      action: "CREATE_SPECIALIZATION",
      targetId: specialization._id,
      targetModel: "SpecializationPath",
      changes: { specialization: specialization.toObject() },
      timestamp: new Date(),
    });

    return res.status(201).json(
      new ApiResponse(201, "Specialization created successfully", specialization)
    );
  });

  /**
   * Update specialization
   * PUT /api/v1/admin/careers/specializations/:id
   */
  updateSpecialization = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const specialization = await SpecializationPath.findByIdAndUpdate(
      id,
      { ...req.body, updatedBy: req.admin._id },
      { new: true, runValidators: true }
    );

    if (!specialization) {
      throw new ApiError(404, "Specialization not found");
    }

    // Log audit
    await CareerGuidanceAuditLog.create({
      adminId: req.admin._id,
      action: "UPDATE_SPECIALIZATION",
      targetId: specialization._id,
      targetModel: "SpecializationPath",
      changes: req.body,
      timestamp: new Date(),
    });

    return res.status(200).json(
      new ApiResponse(200, "Specialization updated successfully", specialization)
    );
  });

  /**
   * Link specialization to program
   * POST /api/v1/admin/careers/programs/:programId/specializations/:specId
   */
  linkSpecializationToProgram = asyncHandler(async (req, res) => {
    const { programId, specId } = req.params;

    const program = await CareerProgram.findById(programId);
    if (!program) throw new ApiError(404, "Program not found");

    const spec = await SpecializationPath.findById(specId);
    if (!spec) throw new ApiError(404, "Specialization not found");

    // Update specialization's parent program
    spec.parentProgramId = programId;
    await spec.save();

    return res.status(200).json(
      new ApiResponse(200, "Specialization linked to program", spec)
    );
  });

  /**
   * Publish specialization
   * PATCH /api/v1/admin/careers/specializations/:id/publish
   */
  publishSpecialization = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const specialization = await SpecializationPath.findByIdAndUpdate(
      id,
      { status: "published", updatedBy: req.admin._id },
      { new: true }
    );

    if (!specialization) {
      throw new ApiError(404, "Specialization not found");
    }

    // Log audit
    await CareerGuidanceAuditLog.create({
      adminId: req.admin._id,
      action: "PUBLISH_SPECIALIZATION",
      targetId: specialization._id,
      targetModel: "SpecializationPath",
      changes: {},
      timestamp: new Date(),
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        "Specialization published successfully",
        specialization
      )
    );
  });

  /**
   * Archive specialization
   * DELETE /api/v1/admin/careers/specializations/:id
   */
  archiveSpecialization = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const specialization = await SpecializationPath.findByIdAndUpdate(
      id,
      { status: "archived", updatedBy: req.admin._id },
      { new: true }
    );

    if (!specialization) {
      throw new ApiError(404, "Specialization not found");
    }

    // Log audit
    await CareerGuidanceAuditLog.create({
      adminId: req.admin._id,
      action: "ARCHIVE_SPECIALIZATION",
      targetId: specialization._id,
      targetModel: "SpecializationPath",
      changes: {},
      timestamp: new Date(),
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        "Specialization archived successfully",
        specialization
      )
    );
  });

  /**
   * Get specialization tree
   * GET /api/v1/admin/careers/specializations/tree
   */
  getSpecializationTree = asyncHandler(async (req, res) => {
    const specializations = await SpecializationPath.find({
      status: "published",
    })
      .populate("parentProgramId", "title slug")
      .sort({ createdAt: -1 });

    // Group by program
    const tree = {};
    specializations.forEach(s => {
      const progTitle = s.parentProgramId?.title || "Unknown";
      if (!tree[progTitle]) {
        tree[progTitle] = [];
      }
      tree[progTitle].push({
        id: s._id,
        title: s.title,
        type: s.type,
        skills: s.skillsGained?.length || 0,
        credits: s.credits,
      });
    });

    return res.status(200).json(
      new ApiResponse(200, "Specialization tree retrieved", tree)
    );
  });
}

export default new AdminSpecializationController();