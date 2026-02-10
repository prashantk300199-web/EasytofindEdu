import { Router } from "express";
import {
  getPublicHostels,
  getPublicHostelBySlug,
  getNearbyHostels,
  getHostelCities,
  getAmenitiesList,
  getRulesList,
} from "../controllers/public.controller.js";

const router = Router();

router.get("/hostels", getPublicHostels);
router.get("/hostels/nearby", getNearbyHostels);
router.get("/hostels/cities", getHostelCities);
router.get("/hostels/:slug", getPublicHostelBySlug);
router.get("/amenities", getAmenitiesList);
router.get("/rules", getRulesList);

export default router;