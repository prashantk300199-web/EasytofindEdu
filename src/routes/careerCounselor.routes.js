import { Router } from "express";
import rateLimit from "express-rate-limit";
import { chat } from "../controllers/careerCounselor.controller.js";
import { attachStudentIfPresent } from "../middlewares/attachStudentIfPresent.js";

const router = Router();

// Truly optional auth — attaches req.user if a valid student token is
// present, otherwise continues anonymously. Never rejects.
const optionalAuth = attachStudentIfPresent;

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
 * Public endpoint — works for anonymous and logged-in students.
 * If authenticated, the student's profile is included in the system prompt
 * so the AI can give personalised answers.
 * Body: { messages: [{ role, content }, ...] }
 */
router.post("/chat", optionalAuth, limiter, chat);

export default router;
