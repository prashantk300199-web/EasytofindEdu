import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticateStudent } from "../middlewares/AuthenticateStudents.js";
import {
  listConversations,
  createConversation,
  getConversation,
  sendMessage,
  archiveConversation,
  getQuickPrompts,
  getProfileContext,
} from "../controllers/careerAI.controller.js";

const router = Router();

// ─── Rate Limiter for AI Chat ──────────────────────────────────────────────
const aiChatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 messages per minute per student
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  validate: false,
  message: "You're sending messages too quickly. Please wait a moment.",
  standardHeaders: true,
  legacyHeaders: false,
});

const aiConversationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 new conversations per hour
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  validate: false,
  message: "Too many new conversations. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Public ───────────────────────────────────────────────────────────────
/**
 * GET /api/v1/career-ai/quick-prompts
 * Get quick prompt suggestions (no auth required)
 */
router.get("/quick-prompts", getQuickPrompts);

// ─── Protected ─────────────────────────────────────────────────────────────
/**
 * GET /api/v1/career-ai/profile-context
 * Get current student's profile context for AI personalization
 */
router.get(
  "/profile-context",
  authenticateStudent,
  getProfileContext
);

/**
 * GET /api/v1/career-ai/conversations
 * List all conversations for the authenticated student
 */
router.get(
  "/conversations",
  authenticateStudent,
  listConversations
);

/**
 * POST /api/v1/career-ai/conversations
 * Create a new AI conversation
 */
router.post(
  "/conversations",
  authenticateStudent,
  aiConversationLimiter,
  createConversation
);

/**
 * GET /api/v1/career-ai/conversations/:conversationId
 * Get a specific conversation
 */
router.get(
  "/conversations/:conversationId",
  authenticateStudent,
  getConversation
);

/**
 * POST /api/v1/career-ai/conversations/:conversationId/messages
 * Send a message in a conversation
 */
router.post(
  "/conversations/:conversationId/messages",
  authenticateStudent,
  aiChatLimiter,
  sendMessage
);

/**
 * DELETE /api/v1/career-ai/conversations/:conversationId
 * Archive a conversation
 */
router.delete(
  "/conversations/:conversationId",
  authenticateStudent,
  archiveConversation
);

export default router;
