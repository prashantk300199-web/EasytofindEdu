import { Router } from "express";
import { adminLogin, adminLogout, getAdminProfile } from "../controllers/admin.auth.controller.js";
import { authenticateAdmin } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import { loginSchema } from "../validators/auth.validator.js";

const router = Router();

router.post("/login", validate(loginSchema), adminLogin);
router.post("/logout", authenticateAdmin, adminLogout);
router.get("/profile", authenticateAdmin, getAdminProfile);

export default router;