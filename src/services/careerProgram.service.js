import CareerProgram from "../models/CareerProgram.js";
import EntranceExam from "../models/EntranceExam.js";
import College from "../models/College.js";
import CareerGuidanceAuditLog from "../models/CareerGuidanceAuditLog.js";
import slugify from "../utils/slugify.js";
import  ApiError  from "../utils/ApiError.js";

class CareerProgramService {
  /**
   * Get all programs with filters & pagination
   * Used by: Both user and admin (status filter is optional)
   * 
   * @param {Object} filters - { search, tags, category, stream, status, sortBy }
   * @param {Object} pagination - { page, limit }
   * @returns {Object} - { data: [], pagination: {} }
   */
  async getAllPrograms(filters = {}, pagination = {}) {
    try {
      const {
        page = 1,
        limit = 12,
        search = "",
        tags = [],
        category = "",
        stream = "",
        status, // ← NO DEFAULT - caller decides
        sortBy = "-createdAt",
      } = { ...filters, ...pagination };

      // Build query
      const query = {};

      // ============= STATUS FILTER =============
      // If status not specified, default to published
      if (status === undefined) {
        query.status = "published";
      } else if (status === "all") {
        // Show all statuses - don't filter
        // Query stays empty for status
      } else if (status) {
        // Specific status (draft, published, archived)
        query.status = status;
      }

      // ============= SEARCH FILTER =============
      if (search && search.trim()) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { overview: { $regex: search, $options: "i" } },
        ];
      }

      // ============= TAGS FILTER =============
      if (tags && tags.length > 0) {
        const tagsArray = Array.isArray(tags) ? tags : [tags];
        query.tags = { $in: tagsArray };
      }

      // ============= CATEGORY FILTER =============
      if (category) {
        query.category = category;
      }

      // ============= STREAM FILTER =============
      if (stream) {
        query.requiredStream = { $in: [stream, "any"] };
      }

      const skip = (page - 1) * limit;

      // ============= FETCH DATA =============
      const [data, total] = await Promise.all([
        CareerProgram.find(query)
          .populate("entranceExams.examId", "name slug type difficultyLevel")
          .populate("topColleges.collegeId", "name city state collegeType ranking")
          .skip(skip)
          .limit(limit)
          .sort(sortBy),
        CareerProgram.countDocuments(query),
      ]);

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new ApiError(500, `Error fetching programs: ${error.message}`);
    }
  }

  /**
   * Get published programs only (for public users)
   */
  async getPublishedPrograms(filters = {}, pagination = {}) {
    try {
      return this.getAllPrograms(
        { ...filters, status: "published" },
        pagination
      );
    } catch (error) {
      throw new ApiError(500, `Error fetching published programs: ${error.message}`);
    }
  }

  /**
   * Get programs with any status (for admin)
   * Default to published if not specified
   */
  async getAllProgramsForAdmin(filters = {}, pagination = {}) {
    try {
      const { status = "published", ...rest } = filters;
      return this.getAllPrograms(
        { ...rest, status },
        pagination
      );
    } catch (error) {
      throw new ApiError(500, `Error fetching programs for admin: ${error.message}`);
    }
  }

  /**
   * Get program by slug (detailed view)
   * Used by: User detailed program page
   */
  async getProgramBySlug(slug) {
    try {
      const program = await CareerProgram.findOne({ slug, status: "published" })
        .populate("entranceExams.examId")
        .populate("topColleges.collegeId")
        .populate("nextPrograms.programId", "title slug category")
        .populate("prerequisitePrograms.programId", "title slug category");

      if (!program) {
        throw new ApiError(404, "Program not found");
      }

      // Increment view count
      program.viewCount = (program.viewCount || 0) + 1;
      await program.save();

      return program;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Error fetching program: ${error.message}`);
    }
  }

  /**
   * Get featured programs
   * Used by: Homepage carousel
   */
  async getFeaturedPrograms(limit = 6) {
    try {
      const programs = await CareerProgram.find({
        status: "published",
        isFeatured: true,
      })
        .sort({ displayOrder: 1, createdAt: -1 })
        .limit(limit)
        .select("title slug category durationLabel salaryLabel tags isFeatured");

      return programs;
    } catch (error) {
      throw new ApiError(500, `Error fetching featured programs: ${error.message}`);
    }
  }

  /**
   * Get programs by stream
   * Used by: Stream-specific pages
   */
  async getProgramsByStream(stream, limit = 20) {
    try {
      const programs = await CareerProgram.find({
        status: "published",
        $or: [{ requiredStream: stream }, { requiredStream: "any" }],
      })
        .limit(limit)
        .select("title slug category durationLabel salaryLabel tags");

      return programs;
    } catch (error) {
      throw new ApiError(500, `Error fetching programs by stream: ${error.message}`);
    }
  }

  /**
   * Get related programs (recommendations)
   * Used by: Similar programs carousel
   */
  async getRelatedPrograms(programId, limit = 5) {
    try {
      const program = await CareerProgram.findById(programId);

      if (!program) {
        throw new ApiError(404, "Program not found");
      }

      const related = await CareerProgram.find({
        status: "published",
        category: program.category,
        _id: { $ne: programId },
      })
        .limit(limit)
        .select("title slug category salaryLabel jobRoles");

      return related;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Error fetching related programs: ${error.message}`);
    }
  }

  /**
   * Get facets for filtering UI
   * Used by: Career explorer filter dropdowns
   */
  async getFacets() {
    try {
      const facets = await CareerProgram.aggregate([
        { $match: { status: "published" } },
        {
          $facet: {
            tags: [
              { $unwind: "$tags" },
              { $group: { _id: "$tags", count: { $sum: 1 } } },
              { $sort: { count: -1 } },
            ],
            categories: [
              { $group: { _id: "$category", count: { $sum: 1 } } },
              { $sort: { _id: 1 } },
            ],
            streams: [
              { $group: { _id: "$requiredStream", count: { $sum: 1 } } },
              { $sort: { _id: 1 } },
            ],
          },
        },
      ]);

      return facets[0] || { tags: [], categories: [], streams: [] };
    } catch (error) {
      throw new ApiError(500, `Error fetching facets: ${error.message}`);
    }
  }

  /**
   * Create program (admin)
   */
  async createProgram(data, adminId) {
    try {
      const slug = slugify(data.title);

      // Check if program already exists
      const exists = await CareerProgram.findOne({ slug });
      if (exists) {
        throw new ApiError(409, `Program "${data.title}" already exists`);
      }

      const program = new CareerProgram({
        ...data,
        slug,
        createdBy: adminId,
      });

      await program.save();

      // Log audit
      await this.logAudit(adminId, "CREATE_PROGRAM", program._id, { program: program.toObject() });

      return program;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(400, `Error creating program: ${error.message}`);
    }
  }

  /**
   * Update program (admin)
   */
  async updateProgram(id, data, adminId) {
    try {
      const program = await CareerProgram.findById(id);

      if (!program) {
        throw new ApiError(404, "Program not found");
      }

      // If title changed, update slug
      if (data.title && data.title !== program.title) {
        data.slug = slugify(data.title);
      }

      const oldData = program.toObject();

      Object.assign(program, data);
      program.updatedBy = adminId;

      await program.save();

      // Log audit
      await this.logAudit(adminId, "UPDATE_PROGRAM", program._id, {
        before: oldData,
        after: program.toObject(),
      });

      return program;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(400, `Error updating program: ${error.message}`);
    }
  }

  /**
   * Publish program (admin)
   */
  async publishProgram(id, adminId) {
    try {
      // Validate program has all required fields
      const program = await CareerProgram.findById(id);

      if (!program) {
        throw new ApiError(404, "Program not found");
      }

      // Check missing fields
      const missing = [];
      if (!program.title) missing.push("title");
      if (!program.category) missing.push("category");
      if (!program.duration.min || !program.duration.max) missing.push("duration");
      if (!program.fees.min || !program.fees.max) missing.push("fees");
      if (!program.salary.minLPA || !program.salary.maxLPA) missing.push("salary");

      if (missing.length > 0) {
        throw new ApiError(400, `Cannot publish. Missing fields: ${missing.join(", ")}`);
      }

      program.status = "published";
      program.publishedAt = new Date();
      program.updatedBy = adminId;

      await program.save();

      // Log audit
      await this.logAudit(adminId, "PUBLISH_PROGRAM", program._id, {});

      return program;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(400, `Error publishing program: ${error.message}`);
    }
  }

  /**
   * Archive/Delete program (admin)
   */
  async archiveProgram(id, adminId) {
    try {
      const program = await CareerProgram.findByIdAndUpdate(
        id,
        {
          status: "archived",
          updatedBy: adminId,
        },
        { new: true }
      );

      if (!program) {
        throw new ApiError(404, "Program not found");
      }

      // Log audit
      await this.logAudit(adminId, "ARCHIVE_PROGRAM", program._id, {});

      return program;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(400, `Error archiving program: ${error.message}`);
    }
  }

  /**
   * Add exam to program (admin)
   */
  async addExamToProgram(programId, examId, isMandatory = false, adminId) {
    try {
      // Verify exam exists
      const exam = await EntranceExam.findById(examId);
      if (!exam) {
        throw new ApiError(404, "Exam not found");
      }

      // Check if exam already linked
      const program = await CareerProgram.findById(programId);
      if (!program) {
        throw new ApiError(404, "Program not found");
      }

      const alreadyLinked = program.entranceExams.some(
        (e) => e.examId.toString() === examId
      );

      if (alreadyLinked) {
        throw new ApiError(409, "Exam already linked to this program");
      }

      // Add exam
      program.entranceExams.push({
        examId,
        isMandatory,
      });

      await program.save();

      // Log audit
      await this.logAudit(adminId, "ADD_EXAM_TO_PROGRAM", programId, {
        examId,
        isMandatory,
      });

      return program.populate("entranceExams.examId");
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(400, `Error linking exam: ${error.message}`);
    }
  }

  /**
   * Add college to program (admin)
   */
  async addCollegeToProgram(programId, collegeId, rank, adminId) {
    try {
      // Verify college exists
      const college = await College.findById(collegeId);
      if (!college) {
        throw new ApiError(404, "College not found");
      }

      // Check if college already linked
      const program = await CareerProgram.findById(programId);
      if (!program) {
        throw new ApiError(404, "Program not found");
      }

      const alreadyLinked = program.topColleges.some(
        (c) => c.collegeId.toString() === collegeId
      );

      if (alreadyLinked) {
        throw new ApiError(409, "College already linked to this program");
      }

      // Add college
      program.topColleges.push({
        collegeId,
        rank,
      });

      await program.save();

      // Log audit
      await this.logAudit(adminId, "ADD_COLLEGE_TO_PROGRAM", programId, {
        collegeId,
        rank,
      });

      return program.populate("topColleges.collegeId");
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(400, `Error linking college: ${error.message}`);
    }
  }

  /**
   * Bulk import programs (admin)
   */
  async bulkImportPrograms(programs, adminId) {
    try {
      const results = [];
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < programs.length; i++) {
        try {
          const item = programs[i];
          const slug = slugify(item.title);

          // Check for duplicates
          const exists = await CareerProgram.findOne({ slug });
          if (exists) {
            results.push({
              row: i + 1,
              status: "error",
              error: `Program "${item.title}" already exists`,
              title: item.title,
            });
            failCount++;
            continue;
          }

          const program = new CareerProgram({
            ...item,
            slug,
            createdBy: adminId,
            status: "draft", // Always draft until reviewed
          });

          await program.save();
          results.push({
            row: i + 1,
            status: "success",
            id: program._id,
            title: item.title,
          });
          successCount++;
        } catch (err) {
          results.push({
            row: i + 1,
            status: "error",
            error: err.message,
            title: programs[i]?.title || "Unknown",
          });
          failCount++;
        }
      }

      // Log audit
      await this.logAudit(adminId, "BULK_IMPORT_PROGRAMS", null, {
        totalRows: programs.length,
        successCount,
        failCount,
      });

      return {
        total: programs.length,
        successful: successCount,
        failed: failCount,
        details: results,
      };
    } catch (error) {
      throw new ApiError(400, `Error in bulk import: ${error.message}`);
    }
  }

  /**
   * Log audit trail
   */
  async logAudit(adminId, action, targetId, changes) {
    try {
      await CareerGuidanceAuditLog.create({
        adminId,
        action,
        targetId,
        targetModel: "CareerProgram",
        changes,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error logging audit:", error);
      // Don't throw - audit failure shouldn't break the main action
    }
  }
}

export default new CareerProgramService();