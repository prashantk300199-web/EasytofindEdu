import { Router as expressRouter } from "express";
import {
  createReference,
  getAllReferences,
  updateReferenceStatus,
} from "../controllers/reference.controller.js";
import { authenticateStudent } from "../middlewares/AuthenticateStudents.js";
import { authenticateAdmin } from "../middlewares/auth.js";

const router = expressRouter();

// Student creates a reference
router.post("/", authenticateStudent, createReference);

// Admin manages references
router.get("/admin/all", authenticateAdmin, getAllReferences);
router.patch("/admin/:id/status", authenticateAdmin, updateReferenceStatus);

export default router;
