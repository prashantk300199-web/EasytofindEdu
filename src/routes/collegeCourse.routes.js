import express from "express";
import {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} from "../controllers/collegeCourse.controller.js";

// Agar tere paas admin verify karne ka middleware hai (like verifyAdmin), toh usko post/put/delete me add kar lena
// import { verifyAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes (Students ke dekhne ke liye)
router.get("/", getAllCourses);
router.get("/:id", getCourseById);

// Protected/Admin routes (Course add/edit/delete karne ke liye)
router.post("/", createCourse); // Add verifyAdmin middleware here later if needed
router.put("/:id", updateCourse); 
router.delete("/:id", deleteCourse); 

export default router;