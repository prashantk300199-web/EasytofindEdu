import { Router } from "express";
import { getProfile, updateProfile, uploadProfilePhoto, deleteProfilePhoto } from "../controllers/owner.controller.js";
import { authenticateOwner } from "../middlewares/auth.js";
import { uploadProfilePhoto as uploadMiddleware } from "../middlewares/upload.js";

const router = Router();

router.use(authenticateOwner);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.put("/profile/photo", uploadMiddleware, uploadProfilePhoto);
router.delete("/profile/photo", deleteProfilePhoto);

export default router;