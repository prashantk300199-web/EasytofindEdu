import { Router } from "express";
import {
  getAllHostels,
  getHostelById,
  updateHostelStatus,
  updateHostelSortPriority,
  deleteHostel,
  getHostelBookings,
  getHostelReviews,
  toggleReviewApproval,
  getDashboardStats,
  toggleHostelOpenStatus,
  updateHostelDetails,
  getHostelInquiries,
  getAllHostelInquiries,
} from "../controllers/admin.hostel.controller.js";
import { authenticateAdmin } from "../middlewares/auth.js";

const router = Router();

router.use(authenticateAdmin);

router.get("/dashboard", getDashboardStats);
router.get("/", getAllHostels);
router.get("/:id", getHostelById);
router.patch("/:id/status", updateHostelStatus);
router.patch("/:id", updateHostelDetails);
router.patch("/:id/priority", updateHostelSortPriority);
router.patch("/:id/toggle-open", toggleHostelOpenStatus);
router.delete("/:id", deleteHostel);
router.get("/:id/bookings", getHostelBookings);
router.get("/:id/reviews", getHostelReviews);
router.get("/:id/inquiries", getHostelInquiries);
router.get("/inquiries/all", getAllHostelInquiries);
router.patch("/reviews/:reviewId/toggle", toggleReviewApproval);

export default router;