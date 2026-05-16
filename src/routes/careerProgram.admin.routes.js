import express from "express";
import adminCareerProgramController from "../controllers/admin.careerProgram.controller.js";
import adminEntranceExamController from "../controllers/admin.entranceExam.controller.js";
import adminCollegeController from "../controllers/admin.college.controller.js";
import verifyAdmin from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import { updateProgramValidator } from "../validators/careerProgram.validator.js";

const router = express.Router();

// ============= ADMIN MIDDLEWARE =============
router.use(verifyAdmin);

// ============= CAREER PROGRAMS (CRUD) =============

router.get("/programs", adminCareerProgramController.getAllPrograms);
router.get("/programs/stats", adminCareerProgramController.getProgramStats);

// Program creation route (validation removed as requested)
router.post("/programs", adminCareerProgramController.createProgram);

router.put(
  "/programs/:id",
  validate(updateProgramValidator),
  adminCareerProgramController.updateProgram
);

router.patch("/programs/:id/publish", adminCareerProgramController.publishProgram);
router.delete("/programs/:id", adminCareerProgramController.archiveProgram);

// ============= PROGRAM-EXAM RELATIONSHIPS =============
router.post("/programs/:programId/exams", adminCareerProgramController.addExamToProgram);
router.delete("/programs/:programId/exams/:examId", adminCareerProgramController.removeExamFromProgram);

// ============= PROGRAM-COLLEGE RELATIONSHIPS =============
router.post("/programs/:programId/colleges", adminCareerProgramController.addCollegeToProgram);
router.delete("/programs/:programId/colleges/:collegeId", adminCareerProgramController.removeCollegeFromProgram);

// ============= BULK OPERATIONS =============
router.post("/programs/bulk/import", adminCareerProgramController.bulkImportPrograms);

// ============= ENTRANCE EXAMS (CRUD) =============
router.get("/exams", adminEntranceExamController.getAllExams);
router.post("/exams", adminEntranceExamController.createExam);
router.put("/exams/:id", adminEntranceExamController.updateExam);
router.patch("/exams/:id/publish", adminEntranceExamController.publishExam);
router.delete("/exams/:id", adminEntranceExamController.archiveExam);
router.get("/exams/:slug", adminEntranceExamController.getExamBySlug);

// ============= COLLEGES (CRUD) =============
router.get("/colleges", adminCollegeController.getAllColleges);
router.get("/colleges/top", adminCollegeController.getTopColleges);
router.post("/colleges", adminCollegeController.createCollege);
router.put("/colleges/:id", adminCollegeController.updateCollege);
router.delete("/colleges/:id", adminCollegeController.archiveCollege);
router.post("/colleges/:collegeId/programs", adminCollegeController.addProgramToCollege);
router.get("/colleges/:slug", adminCollegeController.getCollegeBySlug);

export default router;