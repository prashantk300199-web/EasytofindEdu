import { Router } from "express";
import { createAdmin, getAllAdmins, getAdminById, updateAdmin, deleteAdmin } from "../controllers/admin.controller.js";
import { authenticateAdmin } from "../middlewares/auth.js";
import authorizeRoles from "../middlewares/role.js";
import { ADMIN_ROLE } from "../constants/enums.js";

const router = Router();

router.use(authenticateAdmin);
router.use(authorizeRoles(ADMIN_ROLE.SUPERADMIN));

router.post("/", createAdmin);
router.get("/", getAllAdmins);
router.get("/:id", getAdminById);
router.put("/:id", updateAdmin);
router.delete("/:id", deleteAdmin);

export default router;