import express from "express";
import {
  createEnquiry,
  getMyEnquiries,
  deleteMyEnquiry,
  adminGetAllEnquiries,
  adminGetEnquiryById,
  adminUpdateEnquiryStatus,
  adminDeleteEnquiry,
} from "../controllers/enquiry.controller.js";
import { authenticateStudent } from "../middlewares/AuthenticateStudents.js";
import { authenticateAdmin } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import {
  createEnquiryValidator,
  updateEnquiryStatusValidator,
} from "../validators/enquiry.validator.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// STUDENT ROUTES  (must be logged in as student)
// ─────────────────────────────────────────────────────────────

// Submit enquiry for a specific batch
// POST /api/v1/enquiries/batch/:batchId
router.post(
  "/batch/:batchId",
  authenticateStudent,
  validate(createEnquiryValidator),
  createEnquiry
);

// View all my enquiries
// GET /api/v1/enquiries/my
router.get("/my", authenticateStudent, getMyEnquiries);

// Cancel / delete my enquiry
// DELETE /api/v1/enquiries/my/:enquiryId
router.delete("/my/:enquiryId", authenticateStudent, deleteMyEnquiry);


// ─────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────────────────────

// GET  /api/v1/enquiries/admin?status=pending&institute=ID&batch=ID&page=1&limit=10
router.get("/admin", authenticateAdmin, adminGetAllEnquiries);

// GET  /api/v1/enquiries/admin/:id
router.get("/admin/:id", authenticateAdmin, adminGetEnquiryById);

// PUT  /api/v1/enquiries/admin/:id/status
router.put(
  "/admin/:id/status",
  authenticateAdmin,
  validate(updateEnquiryStatusValidator),
  adminUpdateEnquiryStatus
);

// DELETE /api/v1/enquiries/admin/:id
router.delete("/admin/:id", authenticateAdmin, adminDeleteEnquiry);

export default router;