import { Router } from "express";
import { getDashboardOverview } from "../controllers/admin.dashboard.controller.js";
import { authenticateAdmin } from "../middlewares/auth.js";

const router = Router();

router.use(authenticateAdmin);

router.get("/overview", getDashboardOverview);

export default router;
