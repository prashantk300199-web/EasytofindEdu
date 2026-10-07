import { generateCounselorReply, isCounselorConfigured } from "../services/gemini.service.js";
import { buildStudentContext } from "../services/studentContextBuilder.service.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const MAX_MESSAGES = 40;        // total messages (user + assistant) per request
const MAX_CONTENT_LEN = 4000;   // max chars per message

/**
 * POST /api/v1/career/counselor/chat
 *
 * Body: { messages: [{ role: "user" | "assistant", content: string }, ...] }
 *
 * The frontend owns the conversation history and sends it with each request.
 * No database persistence. No conversation IDs. No rate-limited fan-out.
 *
 * If a valid student JWT is present, the student's profile is fetched from
 * the database and injected into Gemini's system prompt so replies can be
 * personalised. If profile fetch fails or the student is anonymous, the
 * request still succeeds with a generic counselor response.
 *
 * Response: { success: true, message: "..." }
 *   or on failure: { success: false, message: "AI Counselor is temporarily unavailable." }
 */
export const chat = asyncHandler(async (req, res) => {
  const { messages } = req.body || {};

  if (!Array.isArray(messages)) {
    throw new ApiError(400, "messages must be an array");
  }
  if (messages.length === 0) {
    throw new ApiError(400, "messages must not be empty");
  }
  if (messages.length > MAX_MESSAGES) {
    throw new ApiError(400, `Too many messages (max ${MAX_MESSAGES})`);
  }

  const cleaned = [];
  for (const m of messages) {
    if (!m || typeof m !== "object") {
      throw new ApiError(400, "Each message must be an object");
    }
    const role = m.role;
    if (role !== "user" && role !== "assistant" && role !== "model") {
      throw new ApiError(400, "message.role must be 'user' or 'assistant'");
    }
    const content = typeof m.content === "string" ? m.content.trim() : "";
    if (!content) {
      throw new ApiError(400, "message.content must be a non-empty string");
    }
    if (content.length > MAX_CONTENT_LEN) {
      throw new ApiError(400, `message.content must be under ${MAX_CONTENT_LEN} characters`);
    }
    cleaned.push({ role: role === "model" ? "assistant" : role, content });
  }

  if (cleaned[cleaned.length - 1].role !== "user") {
    throw new ApiError(400, "Last message must be from the user");
  }

  // If the optional-auth middleware attached a user, fetch their profile.
  // Failures here are non-fatal — the AI will just answer generically.
  let studentContext = null;
  if (req.user && req.user._id) {
    try {
      studentContext = await buildStudentContext(req.user._id);
    } catch (err) {
      console.error("[counselor] profile fetch failed:", err?.message || err);
      studentContext = null;
    }
  }

  if (!isCounselorConfigured()) {
    return res.status(503).json({
      success: false,
      message: "AI Counselor is temporarily unavailable.",
    });
  }

  try {
    const reply = await generateCounselorReply(cleaned, studentContext);
    return res.status(200).json({ success: true, message: reply });
  } catch (err) {
    console.error("[counselor] Gemini error:", err?.message || err);
    const body = {
      success: false,
        message: "AI Counselor is temporarily unavailable.",
      };
    // TEMP DEBUG: include error info when ?debug=1 is set, so we can see what's failing
    if (req.query.debug === "1") {
      body.debug = {
        status: err?.status ?? err?.statusCode,
        message: String(err?.message || err).slice(0, 300),
        name: err?.name,
      };
    }
    return res.status(502).json(body);
  }
});

export default { chat };
