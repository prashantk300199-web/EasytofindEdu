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
import { uploadHostelPhotos } from "../middlewares/upload.js";
import parseFormData from "../middlewares/parseFormData.js";

const router = Router();

router.use(authenticateOwner);

router.post("/", uploadHostelPhotos, parseFormData, createHostel);
router.get("/", getMyHostels);
router.get("/:id", getHostelById);
router.put("/:id", uploadHostelPhotos, parseFormData, updateHostel);
router.delete("/:id", deleteHostel);
router.patch("/:id/toggle", toggleHostelAvailability);
router.get("/:id/analytics", getHostelAnalytics);
router.delete("/:id/photos/:photoId", deleteHostelPhoto);

export default router;