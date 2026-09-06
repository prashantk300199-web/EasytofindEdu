import express from "express";
import {
  recommendCareer,
  getCareers, createCareer, deleteCareer,
  getRules, createRule, deleteRule,
  getCourses, createCourse, deleteCourse,
  getExams, createExam, deleteExam,
  getColleges, createCollege, deleteCollege,
  getHostels, createHostel, deleteHostel
} from "../controllers/cg.controller.js";

const router = express.Router();

// --- RECOMMENDATION ---
router.post("/recommend", recommendCareer);

// --- CRUD ---
router.route("/careers").get(getCareers).post(createCareer);
router.route("/careers/:id").delete(deleteCareer);

router.route("/rules").get(getRules).post(createRule);
router.route("/rules/:id").delete(deleteRule);

router.route("/courses").get(getCourses).post(createCourse);
router.route("/courses/:id").delete(deleteCourse);

router.route("/exams").get(getExams).post(createExam);
router.route("/exams/:id").delete(deleteExam);

router.route("/colleges").get(getColleges).post(createCollege);
router.route("/colleges/:id").delete(deleteCollege);

router.route("/hostels").get(getHostels).post(createHostel);
router.route("/hostels/:id").delete(deleteHostel);

export default router;
