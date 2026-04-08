import EntranceExam from "../models/EntranceExam.js";
import CareerGuidanceAuditLog from "../models/CareerGuidanceAuditLog.js";
import slugify from "../utils/slugify.js";
import ApiError from "../utils/ApiError.js";

class EntranceExamService {
  /**
   * Get all exams with filters
   */
  async getAllExams(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10, type = "", search = "" } = {
        ...filters,
        ...pagination,
      };

      const query = { status: "published" };

      if (type) {
        query.type = type;
      }

      if (search && search.trim()) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        EntranceExam.find(query)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        EntranceExam.countDocuments(query),
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
      throw new ApiError(500, `Error fetching exams: ${error.message}`);
    }
  }

  /**
   * Get exam by slug
   */
  async getExamBySlug(slug) {
    try {
      const exam = await EntranceExam.findOne({ slug, status: "published" }).populate(
        "linkedPrograms.programId",
        "title slug category"
      );

      if (!exam) {
        throw new ApiError(404, "Exam not found");
      }

      exam.viewCount = (exam.viewCount || 0) + 1;
      await exam.save();

      return exam;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Error fetching exam: ${error.message}`);
    }
  }

  /**
   * Create exam (admin)
   */
  async createExam(data, adminId) {
    try {
      const slug = slugify(data.name);

      const exists = await EntranceExam.findOne({ slug });
      if (exists) {
        throw new ApiError(409, `Exam "${data.name}" already exists`);
      }

      const exam = new EntranceExam({
        ...data,
        slug,
        createdBy: adminId,
      });

      await exam.save();

      await this.logAudit(adminId, "CREATE_EXAM", exam._id, { exam: exam.toObject() });

      return exam;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(400, `Error creating exam: ${error.message}`);
    }
  }

  /**
   * Update exam (admin)
   */
  async updateExam(id, data, adminId) {
    try {
      const exam = await EntranceExam.findById(id);

      if (!exam) {
        throw new ApiError(404, "Exam not found");
      }

      if (data.name && data.name !== exam.name) {
        data.slug = slugify(data.name);
      }

      const oldData = exam.toObject();

      Object.assign(exam, data);
      exam.updatedBy = adminId;

      await exam.save();

      await this.logAudit(adminId, "UPDATE_EXAM", exam._id, {
        before: oldData,
        after: exam.toObject(),
      });

      return exam;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(400, `Error updating exam: ${error.message}`);
    }
  }

  /**
   * Delete exam (archive)
   */
  async archiveExam(id, adminId) {
    try {
      const exam = await EntranceExam.findByIdAndUpdate(
        id,
        { status: "archived", updatedBy: adminId },
        { new: true }
      );

      if (!exam) {
        throw new ApiError(404, "Exam not found");
      }

      await this.logAudit(adminId, "ARCHIVE_EXAM", exam._id, {});

      return exam;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(400, `Error archiving exam: ${error.message}`);
    }
  }

  /**
   * Log audit
   */
  async logAudit(adminId, action, targetId, changes) {
    try {
      await CareerGuidanceAuditLog.create({
        adminId,
        action,
        targetId,
        targetModel: "EntranceExam",
        changes,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error logging audit:", error);
    }
  }
}

export default new EntranceExamService();