import College from "../models/College.js";
import CareerGuidanceAuditLog from "../models/CareerGuidanceAuditLog.js";
import slugify from "../utils/slugify.js";
import ApiError from "../utils/ApiError.js";

class CollegeService {

  async getAllColleges(filters = {}, pagination = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        city = "",
        state = "",
        type = "",
        search = "",
      } = { ...filters, ...pagination };

      const query = { status: "published" };

      if (city) {
        query["location.city"] = city;
      }

      if (state) {
        query["location.state"] = state;
      }

      if (type) {
        query.collegeType = type;
      }

      if (search && search.trim()) {
        query.$or = [{ name: { $regex: search, $options: "i" } }];
      }

      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        College.find(query)
          .skip(skip)
          .limit(limit)
          .sort({ "ranking.nirf.rank": 1 }),
        College.countDocuments(query),
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
      throw new ApiError(500, `Error fetching colleges: ${error.message}`);
    }
  }

  /**
   * Get college by slug
   */
  async getCollegeBySlug(slug) {
    try {
      const college = await College.findOne({ slug, status: "published" }).populate(
        "programs.programId",
        "title slug category"
      );

      if (!college) {
        throw new ApiError(404, "College not found");
      }

      college.viewCount = (college.viewCount || 0) + 1;
      await college.save();

      return college;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Error fetching college: ${error.message}`);
    }
  }

  /**
   * Get top colleges (by NIRF ranking)
   */
  async getTopColleges(limit = 10) {
    try {
      const colleges = await College.find({ status: "published" })
        .sort({ "ranking.nirf.rank": 1 })
        .limit(limit)
        .select(
          "name city state collegeType ranking placements contact.website"
        );

      return colleges;
    } catch (error) {
      throw new ApiError(500, `Error fetching top colleges: ${error.message}`);
    }
  }

  /**
   * Get colleges by city
   */
  async getCollegesByCity(city, limit = 20) {
    try {
      const colleges = await College.find({
        "location.city": city,
        status: "published",
      })
        .limit(limit)
        .select("name city state collegeType ranking placements");

      return colleges;
    } catch (error) {
      throw new ApiError(500, `Error fetching colleges by city: ${error.message}`);
    }
  }

  /**
   * Create college (admin)
   */
  async createCollege(data, adminId) {
    try {
      const slug = slugify(data.name);

      const exists = await College.findOne({ slug });
      if (exists) {
        throw new ApiError(409, `College "${data.name}" already exists`);
      }

      const college = new College({
        ...data,
        slug,
        createdBy: adminId,
      });

      await college.save();

      await this.logAudit(adminId, "CREATE_COLLEGE", college._id, {
        college: college.toObject(),
      });

      return college;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(400, `Error creating college: ${error.message}`);
    }
  }

  /**
   * Update college (admin)
   */
  async updateCollege(id, data, adminId) {
    try {
      const college = await College.findById(id);

      if (!college) {
        throw new ApiError(404, "College not found");
      }

      if (data.name && data.name !== college.name) {
        data.slug = slugify(data.name);
      }

      const oldData = college.toObject();

      Object.assign(college, data);
      college.updatedBy = adminId;

      await college.save();

      await this.logAudit(adminId, "UPDATE_COLLEGE", college._id, {
        before: oldData,
        after: college.toObject(),
      });

      return college;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(400, `Error updating college: ${error.message}`);
    }
  }

  /**
   * Delete college (archive)
   */
  async archiveCollege(id, adminId) {
    try {
      const college = await College.findByIdAndUpdate(
        id,
        { status: "archived", updatedBy: adminId },
        { new: true }
      );

      if (!college) {
        throw new ApiError(404, "College not found");
      }

      await this.logAudit(adminId, "ARCHIVE_COLLEGE", college._id, {});

      return college;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(400, `Error archiving college: ${error.message}`);
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
        targetModel: "College",
        changes,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error logging audit:", error);
    }
  }
}

export default new CollegeService();