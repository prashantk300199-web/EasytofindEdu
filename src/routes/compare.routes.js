import { Router } from "express";
import { getCompareHostels, getCompareInstitutes } from "../controllers/compare.controller.js";

const router = Router();

router.get("/hostels", getCompareHostels);
router.get("/institutes", getCompareInstitutes);

export default router;
