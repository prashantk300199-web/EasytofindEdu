import { Router } from "express";
import {
  createHostel,
  getMyHostels,
  getHostelById,
  updateHostel,
  deleteHostelPhoto,
  deleteHostel,
  toggleHostelAvailability,
  getHostelAnalytics,
} from "../controllers/hostel.controller.js";
import { authenticateOwner } from "../middlewares/auth.js";
import { uploadHostelPhotos, validateUploadedFiles } from "../middlewares/upload.js";
import parseFormData from "../middlewares/parseFormData.js";
import createRateLimiter from "../middlewares/rateLimiter.js";

const router = Router();

// Apply authentication to all routes
router.use(authenticateOwner);

/**
 * @route POST /api/v1/hostels
 * @access Private - Owner only
 * @description Create a new hostel listing with photos
 * Rate limited: 10 requests per hour
 */
router.post(
  "/",
  createRateLimiter("hostel_create"),
  uploadHostelPhotos,
  validateUploadedFiles,
  parseFormData,
  createHostel  
);
/**
 * @route GET /api/v1/hostels
 * @access Private - Owner only
 * @description Get all hostels owned by authenticated user
 * Query params: page, limit, status, sort
 * Rate limited: 100 requests per hour
 */
router.get("/", createRateLimiter("hostel_list"), getMyHostels);

/**
 * @route GET /api/v1/hostels/:id
 * @access Private - Owner only
 * @description Get specific hostel details
 */
router.get("/:id", getHostelById);

/**
 * @route PUT /api/v1/hostels/:id
 * @access Private - Owner only
 * @description Update hostel details and add photos
 * Rate limited: 30 requests per hour
 */
router.put("/:id", createRateLimiter("hostel_update"), uploadHostelPhotos, validateUploadedFiles, parseFormData, updateHostel);

/**
 * @route DELETE /api/v1/hostels/:id
 * @access Private - Owner only
 * @description Delete entire hostel and all photos
 */
router.delete("/:id", deleteHostel);

/**
 * @route PATCH /api/v1/hostels/:id/toggle
 * @access Private - Owner only
 * @description Toggle hostel availability (open/closed)
 */
router.patch("/:id/toggle", toggleHostelAvailability);

/**
 * @route GET /api/v1/hostels/:id/analytics
 * @access Private - Owner only
 * @description Get hostel analytics (views, leads, ratings)
 */
router.get("/:id/analytics", getHostelAnalytics);

/**
 * @route DELETE /api/v1/hostels/:id/photos/:photoId
 * @access Private - Owner only
 * @description Delete specific photo from hostel
 */
router.delete("/:id/photos/:photoId", deleteHostelPhoto);

export default router;
