import { Router } from "express";
import rateLimit from "express-rate-limit";
import { chat } from "../controllers/careerCounselor.controller.js";

const router = Router();

// Basic abuse guard: 30 requests per minute per IP.
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "You're sending messages too quickly. Please wait a moment." },
});

/**
 * POST /api/v1/career/counselor/chat
 * Public endpoint — no login required.
 * Body: { messages: [{ role, content }, ...] }
 */
router.post("/chat", limiter, chat);

export default router;
