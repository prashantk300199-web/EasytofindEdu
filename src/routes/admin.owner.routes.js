import { Router } from "express";
import { getAllOwners, getOwnerById, updateOwnerStatus, deleteOwner, updateOwnerDetails } from "../controllers/admin.owner.controller.js";
import { authenticateAdmin } from "../middlewares/auth.js";

const router = Router();

router.use(authenticateAdmin);

router.get("/", getAllOwners);
router.get("/:id", getOwnerById);
router.patch("/:id/status", updateOwnerStatus);
router.patch("/:id", updateOwnerDetails);
router.delete("/:id", deleteOwner);

export default router;