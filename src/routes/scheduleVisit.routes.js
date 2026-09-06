import express from "express";
import * as scheduleVisitController from "../controllers/scheduleVisitController.js";
import { authenticateStudent } from "../middlewares/AuthenticateStudents.js";
import { authenticateAdmin } from "../middlewares/auth.js";

const router = express.Router();

// Public/Student routes
router.post("/", scheduleVisitController.createScheduleVisit);
router.get("/my-visits", authenticateStudent, scheduleVisitController.getUserScheduleVisits);

// Admin routes
router.get("/admin/all", authenticateAdmin, scheduleVisitController.getAllScheduleVisits);
router.patch("/admin/:id/status", authenticateAdmin, scheduleVisitController.updateScheduleVisitStatus);
router.get("/property/:propertyId", scheduleVisitController.getPropertyScheduleVisits);

export default router;
