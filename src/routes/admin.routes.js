import { Router } from "express";
import { createAdmin, getAllAdmins, getAdminById, updateAdmin, deleteAdmin } from "../controllers/admin.controller.js";
import { authenticateAdmin } from "../middlewares/auth.js";
import authorizeRoles from "../middlewares/role.js";
import { ADMIN_ROLE } from "../constants/enums.js";

const router = Router();

router.use(authenticateAdmin);

// Anyone with an admin account (Admin or SuperAdmin) can view the list
router.get("/", authorizeRoles(ADMIN_ROLE.SUPERADMIN, ADMIN_ROLE.ADMIN), getAllAdmins);

// Only SuperAdmins can manage other admins
router.post("/", authorizeRoles(ADMIN_ROLE.SUPERADMIN), createAdmin);
router.get("/:id", authorizeRoles(ADMIN_ROLE.SUPERADMIN), getAdminById);
router.put("/:id", authorizeRoles(ADMIN_ROLE.SUPERADMIN), updateAdmin);
router.delete("/:id", authorizeRoles(ADMIN_ROLE.SUPERADMIN), deleteAdmin);

export default router;