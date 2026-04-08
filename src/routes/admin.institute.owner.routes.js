import { Router } from "express";
import {
  getAllInstituteOwners,
  getInstituteOwnerById,
  updateInstituteOwnerStatus,
  deleteInstituteOwner
} from "../controllers/admin.institute.owner.controller.js";
import { authenticateAdmin } from "../middlewares/auth.js";

const router = Router();

router.use(authenticateAdmin);

router.get("/", getAllInstituteOwners);
router.get("/:id", getInstituteOwnerById);
router.patch("/:id/status", updateInstituteOwnerStatus);
router.delete("/:id", deleteInstituteOwner);

export default router;
