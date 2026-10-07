import { Router } from "express";
import rateLimit from "express-rate-limit";
import { chat } from "../controllers/aiPet.controller.js";
import { attachStudentIfPresent } from "../middlewares/attachStudentIfPresent.js";

const router = Router();

// Public, anonymous-safe, optional student auth. Same pattern as the AI
// Counselor. attachStudentIfPresent sets req.user if a valid JWT is present
// but never rejects.
const optionalAuth = attachStudentIfPresent;

// 30 req/min/IP — pet conversations are short.
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "You're sending messages too quickly. Please wait a moment." },
});

/**
 * POST /api/v1/ai-pet/chat
 *
 * Public. The AI Pet assistant. Conversation history is owned by the
 * frontend (no DB persistence). All factual listing answers come from the
 * EasyToFindEdu database via controlled retrieval — see
 * aiPetRetrieval.service.js.
 */
router.post("/chat", optionalAuth, limiter, chat);

export default router;