// src/routes/college.routes.js
import express from "express";
import {
  createCollege,
  getAllColleges,
  getCollegeById,
  updateCollege,
  deleteCollege,
  addCourseToCollege,
  removeCourseFromCollege
} from "../controllers/college.controller.js";

// 🔥 IMPORT VALIDATOR MIDDLEWARE & SCHEMA
import validate  from "../middlewares/validate.js";
import { collegeValidationSchema } from "../validators/college.validator.js";

const router = express.Router();

// GET routes (No validation needed here)
router.get("/", getAllColleges);
router.get("/:id", getCollegeById);

// 🛡️ POST & PUT routes (Protected by Joi Validator)
router.post("/", validate(collegeValidationSchema), createCollege);
router.put("/:id", validate(collegeValidationSchema), updateCollege);
router.delete("/:id", deleteCollege);

// Course linking routes
router.post("/:id/courses", addCourseToCollege);
router.delete("/:id/courses/:courseId", removeCourseFromCollege);

export default router;