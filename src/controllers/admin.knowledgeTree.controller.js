import CareerProgram from "../models/CareerProgram.js";
import EntranceExam from "../models/EntranceExam.js";
import College from "../models/College.js";
import SpecializationPath from "../models/SpecializationPath.js";
import CareerSkill from "../models/CareerSkill.js";
import  ApiResponse  from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

class AdminKnowledgeTreeController {
  /**
   * Get complete knowledge tree (all programs with full hierarchy)
   * GET /api/v1/admin/careers/knowledge-tree
   */
  getCompleteKnowledgeTree = asyncHandler(async (req, res) => {
    const { includeArchived = false, limit = 1000 } = req.query;

    // Build query
    const query = { status: "published" };
    if (includeArchived === "true") {
      delete query.status;
    }

    // Fetch all programs with relationships
    const programs = await CareerProgram.find(query)
      .populate("entranceExams.examId", "name slug type")
      .populate("topColleges.collegeId", "name city state ranking")
      .populate("nextPrograms.programId", "title slug category")
      .populate("prerequisitePrograms.programId", "title slug category")
      .limit(parseInt(limit));

    // Build tree structure
    const tree = {
      total: programs.length,
      byCategory: {},
      byStream: {},
      byQualification: {},
      programs: programs.map(p => ({
        id: p._id,
        title: p.title,
        slug: p.slug,
        category: p.category,
        stream: p.requiredStream,
        qualification: p.requiredQualification,
        exams: p.entranceExams.map(e => ({
          examId: e.examId._id,
          name: e.examId.name,
          isMandatory: e.isMandatory,
        })),
        colleges: p.topColleges.map(c => ({
          collegeId: c.collegeId._id,
          name: c.collegeId.name,
          rank: c.rank,
        })),
        nextPrograms: p.nextPrograms.map(np => ({
          programId: np.programId._id,
          title: np.programId.title,
          relationship: np.relationship,
        })),
        prerequisites: p.prerequisitePrograms.map(pp => ({
          programId: pp.programId._id,
          title: pp.programId.title,
        })),
      })),
    };

    // Organize by category
    programs.forEach(p => {
      if (!tree.byCategory[p.category]) {
        tree.byCategory[p.category] = [];
      }
      tree.byCategory[p.category].push(p.title);
    });

    // Organize by stream
    programs.forEach(p => {
      if (!tree.byStream[p.requiredStream]) {
        tree.byStream[p.requiredStream] = [];
      }
      tree.byStream[p.requiredStream].push(p.title);
    });

    // Organize by qualification
    programs.forEach(p => {
      if (!tree.byQualification[p.requiredQualification]) {
        tree.byQualification[p.requiredQualification] = [];
      }
      tree.byQualification[p.requiredQualification].push(p.title);
    });

    return res.status(200).json(
      new ApiResponse(200, "Complete knowledge tree retrieved", tree)
    );
  });

  /**
   * Get knowledge tree for specific stream
   * GET /api/v1/admin/careers/knowledge-tree/stream/:stream
   */
  getKnowledgeTreeByStream = asyncHandler(async (req, res) => {
    const { stream } = req.params;
    const validStreams = ["pcm", "pcb", "commerce", "arts"];

    if (!validStreams.includes(stream)) {
      throw new ApiError(
        400,
        `Invalid stream. Must be: ${validStreams.join(", ")}`
      );
    }

    const programs = await CareerProgram.find({
      status: "published",
      $or: [{ requiredStream: stream }, { requiredStream: "any" }],
    })
      .populate("entranceExams.examId", "name type")
      .populate("topColleges.collegeId", "name city ranking");

    const tree = {
      stream,
      total: programs.length,
      byCategory: {},
      programs: programs.map(p => ({
        id: p._id,
        title: p.title,
        slug: p.slug,
        category: p.category,
        exams: p.entranceExams.length,
        colleges: p.topColleges.length,
        placement: p.placementRate,
        salary: `${p.salary.minLPA}-${p.salary.maxLPA} LPA`,
      })),
    };

    // Organize by category
    programs.forEach(p => {
      if (!tree.byCategory[p.category]) {
        tree.byCategory[p.category] = [];
      }
      tree.byCategory[p.category].push({
        title: p.title,
        slug: p.slug,
        placement: p.placementRate,
      });
    });

    return res.status(200).json(
      new ApiResponse(200, `Knowledge tree for ${stream} stream`, tree)
    );
  });

  /**
   * Get knowledge tree for specific category
   * GET /api/v1/admin/careers/knowledge-tree/category/:category
   */
  getKnowledgeTreeByCategory = asyncHandler(async (req, res) => {
    const { category } = req.params;

    const programs = await CareerProgram.find({
      status: "published",
      category,
    })
      .populate("entranceExams.examId", "name type")
      .populate("topColleges.collegeId", "name city")
      .populate("nextPrograms.programId", "title slug");

    const tree = {
      category,
      total: programs.length,
      byStream: {},
      programs: programs.map(p => ({
        id: p._id,
        title: p.title,
        slug: p.slug,
        stream: p.requiredStream,
        exams: p.entranceExams,
        colleges: p.topColleges.length,
        nextPrograms: p.nextPrograms.map(np => ({
          id: np.programId._id,
          title: np.programId.title,
          type: np.relationship,
        })),
      })),
    };

    // Organize by stream
    programs.forEach(p => {
      if (!tree.byStream[p.requiredStream]) {
        tree.byStream[p.requiredStream] = [];
      }
      tree.byStream[p.requiredStream].push(p.title);
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        `Knowledge tree for ${category} category`,
        tree
      )
    );
  });

  /**
   * Get program with all related nodes
   * GET /api/v1/admin/careers/programs/:programId/full-tree
   */
  getProgramFullTree = asyncHandler(async (req, res) => {
    const { programId } = req.params;

    const program = await CareerProgram.findById(programId)
      .populate({
        path: "entranceExams.examId",
        populate: { path: "linkedPrograms.programId" },
      })
      .populate({
        path: "topColleges.collegeId",
        populate: { path: "programs.programId" },
      })
      .populate("nextPrograms.programId")
      .populate("prerequisitePrograms.programId");

    if (!program) {
      throw new ApiError(404, "Program not found");
    }

    // Get specializations for this program
    const specializations = await SpecializationPath.find({
      parentProgramId: programId,
      status: "published",
    });

    // Get related skills
    const relatedSkills = await CareerSkill.find({
      programsTeachingThis: { $elemMatch: { programId } },
    });

    const fullTree = {
      program: {
        id: program._id,
        title: program.title,
        slug: program.slug,
        category: program.category,
        stream: program.requiredStream,
        salary: `${program.salary.minLPA}-${program.salary.maxLPA} LPA`,
        duration: `${program.duration.min}-${program.duration.max} ${program.duration.unit}`,
        placement: program.placementRate,
      },

      entranceExams: program.entranceExams.map(e => ({
        id: e.examId._id,
        name: e.examId.name,
        type: e.examId.type,
        mandatory: e.isMandatory,
        difficulty: e.examId.difficultyLevel,
        otherProgramsLinked: e.examId.linkedPrograms?.length || 0,
      })),

      topColleges: program.topColleges.map(c => ({
        id: c.collegeId._id,
        name: c.collegeId.name,
        city: c.collegeId.location?.city,
        type: c.collegeId.collegeType,
        rank: c.rank,
        placement: c.collegeId.placements?.placementRate,
        avgPackage: c.collegeId.placements?.averagePackage,
        otherProgramsOffered: c.collegeId.programs?.length || 0,
      })),

      nextPrograms: program.nextPrograms.map(np => ({
        id: np.programId._id,
        title: np.programId.title,
        slug: np.programId.slug,
        relationship: np.relationship,
        notes: np.notes,
      })),

      prerequisites: program.prerequisitePrograms.map(pp => ({
        id: pp.programId._id,
        title: pp.programId.title,
        slug: pp.programId.slug,
      })),

      specializations: specializations.map(s => ({
        id: s._id,
        title: s.title,
        type: s.type,
        credits: s.credits,
        skills: s.skillsGained?.length || 0,
      })),

      skills: relatedSkills.map(s => ({
        id: s._id,
        name: s.name,
        category: s.category,
        demand: s.demandLevel,
      })),

      stats: {
        totalExams: program.entranceExams.length,
        totalColleges: program.topColleges.length,
        totalNextPrograms: program.nextPrograms.length,
        totalPrerequisites: program.prerequisitePrograms.length,
        totalSpecializations: specializations.length,
        totalSkills: relatedSkills.length,
      },
    };

    return res.status(200).json(
      new ApiResponse(200, "Program full tree retrieved", fullTree)
    );
  });

  /**
   * Get program hierarchy (prerequisites → current → next programs)
   * GET /api/v1/admin/careers/programs/:programId/hierarchy
   */
  getProgramHierarchy = asyncHandler(async (req, res) => {
    const { programId } = req.params;

    const program = await CareerProgram.findById(programId)
      .populate("prerequisitePrograms.programId", "title slug category")
      .populate("nextPrograms.programId", "title slug category relationship");

    if (!program) {
      throw new ApiError(404, "Program not found");
    }

    const hierarchy = {
      prerequisites: program.prerequisitePrograms.map(pp => ({
        id: pp.programId._id,
        title: pp.programId.title,
        slug: pp.programId.slug,
        category: pp.programId.category,
        position: "before",
      })),

      current: {
        id: program._id,
        title: program.title,
        slug: program.slug,
        category: program.category,
        level: 0,
      },

      nextPrograms: program.nextPrograms.map((np, idx) => ({
        id: np.programId._id,
        title: np.programId.title,
        slug: np.programId.slug,
        category: np.programId.category,
        relationship: np.relationship,
        level: idx + 1,
      })),

      hierarchyVisualization: {
        chain: [
          ...program.prerequisitePrograms.map(pp => pp.programId.title),
          `→ ${program.title} (CURRENT)`,
          ...program.nextPrograms.map(np => `→ ${np.programId.title} (${np.relationship})`),
        ].join(" "),
      },
    };

    return res.status(200).json(
      new ApiResponse(200, "Program hierarchy retrieved", hierarchy)
    );
  });

  /**
   * Export knowledge tree as JSON
   * GET /api/v1/admin/careers/knowledge-tree/export/json
   */
  exportKnowledgeTreeJSON = asyncHandler(async (req, res) => {
    const programs = await CareerProgram.find({ status: "published" })
      .populate("entranceExams.examId")
      .populate("topColleges.collegeId")
      .populate("nextPrograms.programId")
      .populate("prerequisitePrograms.programId");

    const jsonData = {
      exportDate: new Date().toISOString(),
      totalPrograms: programs.length,
      programs: programs.map(p => ({
        id: p._id,
        title: p.title,
        slug: p.slug,
        category: p.category,
        stream: p.requiredStream,
        duration: p.duration,
        fees: p.fees,
        salary: p.salary,
        exams: p.entranceExams.map(e => ({
          id: e.examId._id,
          name: e.examId.name,
          mandatory: e.isMandatory,
        })),
        colleges: p.topColleges.map(c => ({
          id: c.collegeId._id,
          name: c.collegeId.name,
          rank: c.rank,
        })),
        nextPrograms: p.nextPrograms.map(np => ({
          id: np.programId._id,
          title: np.programId.title,
          relationship: np.relationship,
        })),
      })),
    };

    // Set headers for download
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=knowledge-tree.json"
    );

    return res.status(200).send(JSON.stringify(jsonData, null, 2));
  });

  /**
   * Get knowledge base statistics
   * GET /api/v1/admin/careers/analytics/overview
   */
  getKnowledgeBaseStatistics = asyncHandler(async (req, res) => {
    const stats = await CareerProgram.aggregate([
      {
        $facet: {
          totalPrograms: [{ $count: "count" }],
          byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
          byCategory: [
            { $group: { _id: "$category", count: { $sum: 1 } } },
          ],
          byStream: [{ $group: { _id: "$requiredStream", count: { $sum: 1 } } }],
          avgPlacement: [{ $group: { _id: null, avg: { $avg: "$placementRate" } } }],
          featured: [
            { $match: { isFeatured: true } },
            { $count: "count" },
          ],
        },
      },
    ]);

    const exams = await EntranceExam.countDocuments();
    const colleges = await College.countDocuments();
    const specializations = await SpecializationPath.countDocuments();
    const skills = await CareerSkill.countDocuments();

    const overview = {
      programs: stats[0].totalPrograms[0]?.count || 0,
      exams,
      colleges,
      specializations,
      skills,
      byStatus: stats[0].byStatus,
      byCategory: stats[0].byCategory,
      byStream: stats[0].byStream,
      avgPlacementRate: Math.round(stats[0].avgPlacement[0]?.avg || 0),
      featured: stats[0].featured[0]?.count || 0,
    };

    return res.status(200).json(
      new ApiResponse(200, "Knowledge base statistics", overview)
    );
  });

  /**
   * Get tree visualization data
   * GET /api/v1/admin/careers/tree-viz/programs
   */
  getTreeVisualizationData = asyncHandler(async (req, res) => {
    const programs = await CareerProgram.find({ status: "published" })
      .populate("nextPrograms.programId", "title slug")
      .populate("prerequisitePrograms.programId", "title slug");

    // Build nodes and edges for tree visualization
    const nodes = [];
    const edges = [];
    const visited = new Set();

    programs.forEach(p => {
      if (!visited.has(p._id.toString())) {
        nodes.push({
          id: p._id,
          label: p.title,
          category: p.category,
          stream: p.requiredStream,
        });
        visited.add(p._id.toString());
      }

      // Add edges for next programs
      p.nextPrograms.forEach(np => {
        edges.push({
          from: p._id,
          to: np.programId._id,
          label: np.relationship,
        });
      });
    });

    const viz = {
      nodes,
      edges,
      stats: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
      },
    };

    return res.status(200).json(
      new ApiResponse(200, "Tree visualization data", viz)
    );
  });

  /**
   * Validate tree consistency
   * POST /api/v1/admin/careers/validate/consistency
   */
  validateTreeConsistency = asyncHandler(async (req, res) => {
    const issues = [];

    // Check for orphaned programs (no exams, colleges, or connections)
    const orphaned = await CareerProgram.find({
      $and: [
        { entranceExams: { $size: 0 } },
        { topColleges: { $size: 0 } },
        { nextPrograms: { $size: 0 } },
        { prerequisitePrograms: { $size: 0 } },
      ],
    }).select("_id title");

    if (orphaned.length > 0) {
      issues.push({
        type: "orphaned_programs",
        count: orphaned.length,
        details: orphaned.map(p => ({ id: p._id, title: p.title })),
      });
    }

    // Check for broken references
    const programs = await CareerProgram.find().populate([
      "entranceExams.examId",
      "topColleges.collegeId",
      "nextPrograms.programId",
    ]);

    programs.forEach(p => {
      // Check for null exam references
      const nullExams = p.entranceExams.filter(e => !e.examId);
      if (nullExams.length > 0) {
        issues.push({
          type: "broken_exam_reference",
          programId: p._id,
          programTitle: p.title,
          count: nullExams.length,
        });
      }

      // Check for null college references
      const nullColleges = p.topColleges.filter(c => !c.collegeId);
      if (nullColleges.length > 0) {
        issues.push({
          type: "broken_college_reference",
          programId: p._id,
          programTitle: p.title,
          count: nullColleges.length,
        });
      }
    });

    const validation = {
      isConsistent: issues.length === 0,
      totalIssues: issues.length,
      issues,
      timestamp: new Date().toISOString(),
    };

    return res.status(200).json(
      new ApiResponse(200, "Tree consistency validation", validation)
    );
  });
}

export default new AdminKnowledgeTreeController();