import express from "express";
import adminCareerProgramController from "../controllers/admin.careerProgram.controller.js";
import adminEntranceExamController from "../controllers/admin.entranceExam.controller.js";
import adminCollegeController from "../controllers/admin.college.controller.js";
import verifyAdmin  from "../middlewares/auth.js";
import  validate from "../middlewares/validate.js";
import {
  createProgramValidator,
  updateProgramValidator,
} from "../validators/careerProgram.validator.js";

const router = express.Router();

// ============= ADMIN MIDDLEWARE =============
router.use(verifyAdmin);

// ============= CAREER PROGRAMS (CRUD) =============

/**
 * Get all programs (admin view)
 * GET /api/v1/admin/careers/programs?status=draft&page=1&limit=20
 * 
 * Supports status: "published" | "draft" | "archived" | "all"
 */
router.get("/programs", adminCareerProgramController.getAllPrograms);

/**
 * Get program stats
 * GET /api/v1/admin/careers/programs/stats
 */
router.get("/programs/stats", adminCareerProgramController.getProgramStats);

/**
 * Create program
 * POST /api/v1/admin/careers/programs
 */
router.post(
  "/programs",
  validate(createProgramValidator),
  adminCareerProgramController.createProgram
);

/**
 * Update program
 * PUT /api/v1/admin/careers/programs/:id
 */
router.put(
  "/programs/:id",
  validate(updateProgramValidator),
  adminCareerProgramController.updateProgram
);

/**
 * Publish program
 * PATCH /api/v1/admin/careers/programs/:id/publish
 */
router.patch(
  "/programs/:id/publish",
  adminCareerProgramController.publishProgram
);

/**
 * Archive program
 * DELETE /api/v1/admin/careers/programs/:id
 */
router.delete(
  "/programs/:id",
  adminCareerProgramController.archiveProgram
);

// ============= PROGRAM-EXAM RELATIONSHIPS =============

/**
 * Add exam to program
 * POST /api/v1/admin/careers/programs/:programId/exams
 */
router.post(
  "/programs/:programId/exams",
  adminCareerProgramController.addExamToProgram
);

/**
 * Remove exam from program
 * DELETE /api/v1/admin/careers/programs/:programId/exams/:examId
 */
router.delete(
  "/programs/:programId/exams/:examId",
  adminCareerProgramController.removeExamFromProgram
);

// ============= PROGRAM-COLLEGE RELATIONSHIPS =============

/**
 * Add college to program
 * POST /api/v1/admin/careers/programs/:programId/colleges
 */
router.post(
  "/programs/:programId/colleges",
  adminCareerProgramController.addCollegeToProgram
);

/**
 * Remove college from program
 * DELETE /api/v1/admin/careers/programs/:programId/colleges/:collegeId
 */
router.delete(
  "/programs/:programId/colleges/:collegeId",
  adminCareerProgramController.removeCollegeFromProgram
);

// ============= BULK OPERATIONS =============

/**
 * Bulk import programs
 * POST /api/v1/admin/careers/programs/bulk/import
 */
router.post(
  "/programs/bulk/import",
  adminCareerProgramController.bulkImportPrograms
);

// ============= ENTRANCE EXAMS (CRUD) =============

/**
 * Get all exams
 * GET /api/v1/admin/careers/exams?type=engineering&page=1&limit=20
 */
router.get("/exams", adminEntranceExamController.getAllExams);

/**
 * Create exam
 * POST /api/v1/admin/careers/exams
 */
router.post("/exams", adminEntranceExamController.createExam);

/**
 * Update exam
 * PUT /api/v1/admin/careers/exams/:id
 */
router.put("/exams/:id", adminEntranceExamController.updateExam);

/**
 * Publish exam
 * PATCH /api/v1/admin/careers/exams/:id/publish
 */
router.patch("/exams/:id/publish", adminEntranceExamController.publishExam);

/**
 * Archive exam
 * DELETE /api/v1/admin/careers/exams/:id
 */
router.delete("/exams/:id", adminEntranceExamController.archiveExam);

/**
 * Get exam by slug
 * GET /api/v1/admin/careers/exams/:slug
 */
router.get("/exams/:slug", adminEntranceExamController.getExamBySlug);

// ============= COLLEGES (CRUD) =============

/**
 * Get all colleges
 * GET /api/v1/admin/careers/colleges?city=Mumbai&type=govt&page=1&limit=20
 */
router.get("/colleges", adminCollegeController.getAllColleges);

/**
 * Get top colleges
 * GET /api/v1/admin/careers/colleges/top?limit=10
 */
router.get("/colleges/top", adminCollegeController.getTopColleges);

/**
 * Create college
 * POST /api/v1/admin/careers/colleges
 */
router.post("/colleges", adminCollegeController.createCollege);

/**
 * Update college
 * PUT /api/v1/admin/careers/colleges/:id
 */
router.put("/colleges/:id", adminCollegeController.updateCollege);

/**
 * Archive college
 * DELETE /api/v1/admin/careers/colleges/:id
 */
router.delete("/colleges/:id", adminCollegeController.archiveCollege);

/**
 * Add program to college
 * POST /api/v1/admin/careers/colleges/:collegeId/programs
 */
router.post(
  "/colleges/:collegeId/programs",
  adminCollegeController.addProgramToCollege
);

/**
 * Get college by slug
 * GET /api/v1/admin/careers/colleges/:slug
 */
router.get("/colleges/:slug", adminCollegeController.getCollegeBySlug);

export default router;