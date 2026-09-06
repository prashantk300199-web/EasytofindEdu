import express from "express";
import careerProgramController from "../controllers/careerProgram.controller.js";

const router = express.Router();

// ============= PUBLIC ROUTES (User-facing Career Explorer) =============

/**
 * Get all programs with filters
 * GET /api/v1/careers/programs?page=1&limit=12&tags=after_12th&stream=pcm
 * 
 * ALWAYS returns PUBLISHED programs only
 */
router.get("/programs", careerProgramController.getAllPrograms);

/**
 * Get featured programs
 * GET /api/v1/careers/programs/featured?limit=6
 */
router.get("/programs/featured", careerProgramController.getFeaturedPrograms);

/**
 * Get programs by stream
 * GET /api/v1/careers/programs/stream/:stream
 */
router.get("/programs/stream/:stream", careerProgramController.getProgramsByStream);

/**
 * Get related programs (similar to a given program)
 * GET /api/v1/careers/programs/:programId/related
 */
router.get("/programs/:programId/related", careerProgramController.getRelatedPrograms);

/**
 * Get program details by slug
 * GET /api/v1/careers/programs/:slug
 */
router.get("/programs/:slug", careerProgramController.getProgramBySlug);

export default router;