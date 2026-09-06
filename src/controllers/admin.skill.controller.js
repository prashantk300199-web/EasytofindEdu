import CareerSkill from "../models/CareerSkill.js";
import CareerProgram from "../models/CareerProgram.js";
import ApiResponse  from "../utils/ApiResponse.js";
import ApiError  from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import slugify from "../utils/slugify.js";

class AdminSkillController {
  /**
   * Get all skills
   * GET /api/v1/admin/careers/skills?category=technical&demand=high
   */
  getAllSkills = asyncHandler(async (req, res) => {
    const { category = "", demand = "", status = "active", page = 1, limit = 20 } = req.query;

    const query = {};
    if (category) query.category = category;
    if (demand) query.demandLevel = demand;
    if (status) query.status = status;

    const skills = await CareerSkill.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await CareerSkill.countDocuments(query);

    return res.status(200).json(
      new ApiResponse(200, "Skills retrieved successfully", {
        data: skills,
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
   * Create skill
   * POST /api/v1/admin/careers/skills
   */
  createSkill = asyncHandler(async (req, res) => {
    const { name, category, description, proficiencyLevels, demandLevel, ...rest } = req.body;

    if (!name) throw new ApiError(400, "Skill name is required");
    if (!category) throw new ApiError(400, "Skill category is required");

    const slug = slugify(name);

    const skill = new CareerSkill({
      name,
      slug,
      category,
      description,
      proficiencyLevels,
      demandLevel,
      createdBy: req.admin._id,
      ...rest,
    });

    await skill.save();

    return res.status(201).json(
      new ApiResponse(201, "Skill created successfully", skill)
    );
  });

  /**
   * Update skill
   * PUT /api/v1/admin/careers/skills/:id
   */
  updateSkill = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const skill = await CareerSkill.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    if (!skill) throw new ApiError(404, "Skill not found");

    return res.status(200).json(
      new ApiResponse(200, "Skill updated successfully", skill)
    );
  });

  /**
   * Link skill to program
   * POST /api/v1/admin/careers/programs/:programId/skills/:skillId
   */
  linkSkillToProgram = asyncHandler(async (req, res) => {
    const { programId, skillId } = req.params;
    const { courseId } = req.body;

    const skill = await CareerSkill.findById(skillId);
    if (!skill) throw new ApiError(404, "Skill not found");

    const program = await CareerProgram.findById(programId);
    if (!program) throw new ApiError(404, "Program not found");

    // Add to skill's programsTeachingThis
    const alreadyLinked = skill.programsTeachingThis.some(
      p => p.programId.toString() === programId
    );

    if (!alreadyLinked) {
      skill.programsTeachingThis.push({
        programId,
        courseId,
      });
      await skill.save();
    }

    return res.status(200).json(
      new ApiResponse(200, "Skill linked to program", skill)
    );
  });

  /**
   * Get skill tree
   * GET /api/v1/admin/careers/skills/tree
   */
  getSkillTree = asyncHandler(async (req, res) => {
    const skills = await CareerSkill.find({ status: "active" })
      .populate("relatedSkills.skillId", "name category")
      .populate("programsTeachingThis.programId", "title slug");

    // Build tree structure
    const tree = {
      technical: [],
      soft_skill: [],
      language: [],
      tool: [],
      framework: [],
      methodology: [],
      domain_knowledge: [],
    };

    skills.forEach(skill => {
      const entry = {
        id: skill._id,
        name: skill.name,
        demand: skill.demandLevel,
        programs: skill.programsTeachingThis.length,
        related: skill.relatedSkills.length,
      };

      if (tree[skill.category]) {
        tree[skill.category].push(entry);
      }
    });

    return res.status(200).json(
      new ApiResponse(200, "Skill tree retrieved", tree)
    );
  });

  /**
   * Publish skill
   * PATCH /api/v1/admin/careers/skills/:id/publish
   */
  publishSkill = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const skill = await CareerSkill.findByIdAndUpdate(
      id,
      { status: "active" },
      { new: true }
    );

    if (!skill) throw new ApiError(404, "Skill not found");

    return res.status(200).json(
      new ApiResponse(200, "Skill published successfully", skill)
    );
  });
}

export default new AdminSkillController();