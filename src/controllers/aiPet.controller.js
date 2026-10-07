import { runPet, isPetConfigured } from "../services/aiPet.service.js";
import AIPetAnalytics from "../models/AIPetAnalytics.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { attachStudentIfPresent } from "../middlewares/attachStudentIfPresent.js";

const MAX_MESSAGES = 30; // smaller than counselor — pet is short-burst
const MAX_CONTENT_LEN = 2000;

/**
 * Truncate a category string for safe storage (no PII, no raw prompt text).
 * Only allows letters / digits / spaces, capped at 40 chars.
 */
const sanitizeCategory = (s) => {
  if (typeof s !== "string") return "";
  return String(s)
    .replace(/[^\w\s\-]/g, "")
    .slice(0, 40)
    .trim();
};

const recordAnalytics = async ({ action, category, hasResults, authenticated }) => {
  try {
    const hourBucket = new Date();
    hourBucket.setMinutes(0, 0, 0);
    await AIPetAnalytics.updateOne(
      { action, category, hourBucket, hasResults: !!hasResults, authenticated: !!authenticated },
      { $inc: { count: 1 } },
      { upsert: true }
    );
  } catch (err) {
    // Analytics failures must never affect the user-facing response.
    console.warn("[ai-pet] analytics write failed:", err?.message || err);
  }
};

/**
 * POST /api/v1/ai-pet/chat
 *
 * Body: {
 *   messages: [{ role, content }, ...],   // frontend-owned history
 *   context: {
 *     pathname?: string,                  // current page URL path
 *     contextListingIds?: { hostels?: string[], institutes?: string[], colleges?: string[] }
 *   }
 * }
 *
 * Response: { success: true, message: "...", listings: [...], action, rephrase, cities }
 */
export const chat = asyncHandler(async (req, res) => {
  const { messages, context } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new ApiError(400, "messages must be a non-empty array");
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

  // Optional student context (never required — anonymous works fine).
  let studentContext = null;
  if (req.user && req.user._id) {
    try {
      const { buildStudentContext } = await import("../services/studentContextBuilder.service.js");
      studentContext = await buildStudentContext(req.user._id);
    } catch (err) {
      console.warn("[ai-pet] profile fetch failed:", err?.message || err);
      studentContext = null;
    }
  }

  if (!isPetConfigured()) {
    return res.status(503).json({
      success: false,
      message: "AI Pet is temporarily unavailable.",
    });
  }

  let result;
  try {
    result = await runPet(cleaned, {
      pathname: context?.pathname || undefined,
      contextListingIds: context?.contextListingIds || undefined,
    });
  } catch (err) {
    console.error(
      "[ai-pet] error status=%s name=%s msg=%s",
      err?.status ?? err?.statusCode ?? "?",
      err?.name ?? "?",
      String(err?.message || err).slice(0, 400)
    );
    return res.status(502).json({
      success: false,
      message: "AI Pet is temporarily unavailable.",
    });
  }

  // Inject a one-line student-profile nudge into the system prompt for
  // stage-2 if the student is logged in and has shared any preferences.
  if (studentContext?.hasProfile) {
    const tag = [];
    if (studentContext.careerGuidance?.preferences?.preferredCities?.length) {
      tag.push(`Preferred cities: ${studentContext.careerGuidance.preferences.preferredCities.join(", ")}`);
    }
    if (studentContext.careerGuidance?.preferences?.budget) {
      tag.push(`Budget band: ${studentContext.careerGuidance.preferences.budget}`);
    }
    if (studentContext.basics?.lastQualification || studentContext.basics?.educationLevel) {
      tag.push(`Education: ${studentContext.basics.lastQualification || studentContext.basics.educationLevel}`);
    }
    if (tag.length && result.action !== "smalltalk") {
      result.message = `${result.message}\n\n_(Personalised using your preferences: ${tag.join(" · ")})_`;
    }
  }

  // Fire-and-forget analytics. Failures are swallowed.
  void recordAnalytics({
    action: result.action || "unknown",
    category:
      sanitizeCategory(result.rephrase) ||
      "general",
    hasResults: (result.listings || []).length > 0,
    authenticated: Boolean(req.user && req.user._id),
  });

  return res.status(200).json({
    success: true,
    message: result.message,
    listings: result.listings || [],
    action: result.action,
    rephrase: result.rephrase,
  });
});

export default { chat };