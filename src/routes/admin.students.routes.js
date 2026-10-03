import { Router } from "express";
import Student from "../models/Students.js";
import { authenticateAdmin } from "../middlewares/auth.js";

const router = Router();

router.use(authenticateAdmin);

/**
 * GET /api/v1/admin/students
 * List registered students with pagination, search, and status filter.
 * Returns non-sensitive fields only.
 */
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", status = "" } = req.query;
    const lim = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (Math.max(1, Number(page) || 1) - 1) * lim;

    const filter = {};
    if (status) filter.status = status;
    if (search) {
      const re = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: re }, { email: re }, { phone: re }];
    }

    // Project only non-sensitive fields
    const projection =
      "name email phone gender lastQualification status city state authProvider referralCode createdAt updatedAt";

    const [students, total] = await Promise.all([
      Student.find(filter, projection)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim)
        .lean(),
      Student.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Students fetched.",
      data: {
        students,
        pagination: {
          current_page: Number(page) || 1,
          total_pages: Math.max(1, Math.ceil(total / lim)),
          total_results: total,
          per_page: lim,
        },
      },
    });
  } catch (err) {
    console.error("Admin list students error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to list students",
    });
  }
});

/**
 * GET /api/v1/admin/students/:id
 * Single student detail. Non-sensitive fields only.
 */
router.get("/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .select(
        "name email phone gender lastQualification status city state authProvider referralCode profilePhoto careerGuidance createdAt updatedAt",
      )
      .lean();
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Student fetched.",
      data: student,
    });
  } catch (err) {
    console.error("Admin get student error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to get student",
    });
  }
});

/**
 * GET /api/v1/admin/students/stats/summary
 * Small aggregate used by the dashboard. Count by status.
 */
router.get("/stats/summary", async (req, res) => {
  try {
    const [total, verified, pending, blocked] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ status: "verified" }),
      Student.countDocuments({ status: "pending" }),
      Student.countDocuments({ status: "blocked" }),
    ]);
    return res.status(200).json({
      success: true,
      message: "Student summary fetched.",
      data: { total, verified, pending, blocked },
    });
  } catch (err) {
    console.error("Admin student summary error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to load student summary",
    });
  }
});

export default router;
