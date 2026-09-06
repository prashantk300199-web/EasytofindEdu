import express from "express";
import {
  applyForAdmission,
  getStudentAdmissions,
  adminGetAllAdmissions,
  updateAdmissionStatus,
  getStudentHostelInquiries
} from "../controllers/admission.controller.js";
import { authenticateStudent } from "../middlewares/AuthenticateStudents.js";
import { authenticateAdmin } from "../middlewares/auth.js";

const router = express.Router();

// Student Routes
router.post("/apply", authenticateStudent, applyForAdmission);
router.get("/my-applications", authenticateStudent, getStudentAdmissions);
router.get("/my-hostel-unlocks", authenticateStudent, getStudentHostelInquiries);

// Admin Routes
router.get("/admin/all", authenticateAdmin, adminGetAllAdmissions);
router.put("/admin/status/:id", authenticateAdmin, updateAdmissionStatus);

export default router;
