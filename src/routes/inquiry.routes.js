import { Router } from "express";
import { createInquiry, getAllInquiries, updateInquiry, deleteInquiry } from "../controllers/inquiry.controller.js";
import { authenticateAdmin } from "../middlewares/auth.js";
import authorizeRoles from "../middlewares/role.js";
import { ADMIN_ROLE } from "../constants/enums.js";

const router = Router();

// Public route for submission
router.post("/", createInquiry);

// Admin routes
router.get("/", authenticateAdmin, authorizeRoles(ADMIN_ROLE.SUPERADMIN, ADMIN_ROLE.ADMIN), getAllInquiries);
router.patch("/:id", authenticateAdmin, authorizeRoles(ADMIN_ROLE.SUPERADMIN, ADMIN_ROLE.ADMIN), updateInquiry);
router.delete("/:id", authenticateAdmin, authorizeRoles(ADMIN_ROLE.SUPERADMIN, ADMIN_ROLE.ADMIN), deleteInquiry);

export default router;
