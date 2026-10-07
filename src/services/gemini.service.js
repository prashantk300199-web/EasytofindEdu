// Clean, simple Gemini service for the AI Counselor.
// Uses the official @google/generative-ai SDK.
// The API key is read ONLY from server-side env (GEMINI_API_KEY).
// It is never exposed to the browser.

import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY || "";

// Model chain — primary first (env override), then stable fallbacks.
// Gemini 3.x flash models share the same API surface; when one is overloaded
// (intermittent 503 "high demand"), another usually has capacity. Stops at
// the first model that returns a real reply.
const PRIMARY = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const FALLBACK_MODELS = [
  "gemini-3.7-flash",
  "gemini-3.5-flash",
];
const MODEL_CHAIN = [
  PRIMARY,
  ...FALLBACK_MODELS.filter((m) => m !== PRIMARY),
];

// Retry budget: 1 quick retry on primary, then single attempts on fallbacks.
// Worst-case wall time = 2 attempts × TIMEOUT_MS on primary + 1s wait
//                      + (N-1) fallbacks × TIMEOUT_MS
//                      ≈ 40s for 3 models at TIMEOUT_MS=10s. Acceptable.
const PRIMARY_MAX_ATTEMPTS = 2;
const FALLBACK_MAX_ATTEMPTS = 1;
const PRIMARY_RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 10000; // per-request HTTP timeout

const SYSTEM_PROMPT = `You are the AI Career Counselor for EasyToFindEdu, an Indian education platform that helps students discover careers, courses, colleges, and entrance exams.

Your job is to give practical, structured, and honest career guidance to Indian students (typically Class 9 onwards, including graduates and working professionals exploring career changes).

You help with:
- career selection and career paths
- choosing the right courses and degrees
- colleges, institutes, and universities
- entrance examinations (JEE, NEET, CAT, GATE, UPSC, banking, state exams, etc.)
- skills to develop
- study planning and learning roadmaps
- internships and first jobs
- higher education (India and abroad)
- competitive exams preparation
- technology careers and emerging fields

How you answer:
- Use clear **bold headings** to structure longer answers.
- Use short bullet points and short paragraphs.
- Prefer Indian context: use INR for costs, refer to CBSE/ICSE/State boards, JEE/NEET/UPSC, IITs/NITs/AIIMS, IIIT, IIM, etc.
- Be encouraging but realistic. Avoid hype and false promises.
- When the user is unsure ("I don't know what to do"), ask gentle clarifying questions before suggesting paths.
- When comparing options, present facts neutrally. Do not declare a "winner".
- When discussing exams, fees, salaries, cutoffs, or seat counts, tell the user to verify from the official source — do not invent exact numbers.
- If you do not know something, say so clearly. Do not fabricate.
- Keep answers focused and skimmable. Avoid long preambles.

You do NOT have access to private EasyToFindEdu databases unless the user (or the system) provides that data in the conversation. If the user asks about specific colleges or listings, guide them to use the search and explore pages on the site.

Stay strictly within education and careers. For unrelated topics, politely redirect the user back to career guidance.`;

let client = null;
function getClient() {
  if (client) return client;
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }
  client = new GoogleGenerativeAI(API_KEY);
  return client;
}

/**
 * Convert a buildStudentContext() result into a short system-prompt section.
 * Returns null when there is no usable profile data.
 */
function formatProfileSection(ctx) {
  if (!ctx || !ctx.hasProfile) return null;

  const lines = [];
  const basics = ctx.basics || {};
  const cg = ctx.careerGuidance || {};
  const prefs = cg.preferences || {};

  if (basics.name) lines.push(`- Name: ${basics.name}`);
  if (basics.educationLevel) lines.push(`- Education level: ${basics.educationLevel}`);
  if (cg.stream) lines.push(`- Stream: ${cg.stream}`);
  if (cg.interests && cg.interests.length) lines.push(`- Interests: ${cg.interests.join(", ")}`);
  if (prefs.careerGoal) lines.push(`- Career goal: ${prefs.careerGoal}`);
  if (prefs.budget) lines.push(`- Budget: ${prefs.budget}`);
  if (prefs.timeframe) lines.push(`- Timeframe: ${prefs.timeframe}`);
  if (prefs.relocation) lines.push(`- Relocation: ${prefs.relocation}`);
  if (prefs.preferredCities && prefs.preferredCities.length) {
    lines.push(`- Preferred cities: ${prefs.preferredCities.join(", ")}`);
  }
  if (basics.percentage) lines.push(`- Latest percentage / score: ${basics.percentage}`);

  if (Array.isArray(ctx.savedCareers) && ctx.savedCareers.length) {
    lines.push(`- Saved careers: ${ctx.savedCareers.map((c) => c.title).join(", ")}`);
  }
  if (Array.isArray(ctx.topRecommendations) && ctx.topRecommendations.length) {
    lines.push(
      `- Top recommendations for this student: ${ctx.topRecommendations.map((r) => r.title).join(", ")}`
    );
  }

  if (lines.length === 0) return null;

  return [
    "",
    "== ABOUT THIS STUDENT (use to personalise; do NOT recite these details back) ==",
    ...lines,
    "== END STUDENT CONTEXT ==",
    "",
    "Personalise your answer to this student when relevant. Do not start with \"Based on your profile\" or similar filler — just answer their question, with their context in mind.",
  ].join("\n");
}

/**
 * Generate a response from Gemini given a conversation history.
 * @param {{role: "user" | "assistant" | "model" | "system", content: string}[]} messages
 * @param {object|null} [studentContext] - Optional result from buildStudentContext().
 * @returns {Promise<string>} the assistant's reply text
 */
export async function generateCounselorReply(messages, studentContext = null) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("messages must be a non-empty array");
  }

  const c = getClient();
  const profileSection = formatProfileSection(studentContext);
  const systemInstruction = SYSTEM_PROMPT + (profileSection || "");

  // Convert history to Gemini format. Drop any "system" entries — they're
  // already handled via systemInstruction above.
  const history = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant" || m.role === "model"))
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content ?? "") }],
    }));

  if (history.length === 0) {
    throw new Error("No valid messages to send to Gemini.");
  }

  // Last message must be from the user for chat.sendMessage.
  const last = history[history.length - 1];
  if (last.role !== "user") {
    throw new Error("Last message must be from the user.");
  }
  const chatHistory = history.slice(0, -1);

  // Classify whether an error is transient (worth retrying / falling back on).
  // 503 high-demand, 429 quota, network blips all fall in here. We do NOT
  // retry on 4xx like bad request or invalid API key — those will never
  // succeed by trying again or switching.
  const transient = (err) => {
    const status = err?.status ?? err?.statusCode;
    if (status === 429 || status === 500 || status === 502 || status === 503 || status === 504) {
      return true;
    }
    const msg = String(err?.message || err || "");
    return /503|Service Unavailable|high demand|fetch failed|fetch error|ETIMEDOUT|ECONNRESET|EAI_AGAIN|429|rate.?limit|overloaded|aborted|Request aborted/i.test(msg);
  };

  // Try each model in the chain. Primary gets 1 quick retry (handles 1–2s
  // blips); fallbacks get 1 attempt each. Move to the next model the
  // instant the current one fails transiently. Hard errors (e.g. 400 bad
  // request) bubble up immediately without burning the chain.
  let lastErr;
  for (let mi = 0; mi < MODEL_CHAIN.length; mi++) {
    const modelName = MODEL_CHAIN[mi];
    const maxAttempts = mi === 0 ? PRIMARY_MAX_ATTEMPTS : FALLBACK_MAX_ATTEMPTS;
    const model = c.getGenerativeModel(
      { model: modelName, systemInstruction },
      { timeout: REQUEST_TIMEOUT_MS }
    );
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        topP: 0.9,
        topK: 40,
      },
    });

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await chat.sendMessage(last.parts[0].text);
        const text = result?.response?.text?.();
        if (!text || !text.trim()) {
          throw new Error("Gemini returned an empty response.");
        }
        if (mi > 0) {
          console.warn(`[counselor] succeeded via fallback model ${modelName} after primary ${PRIMARY} was unavailable`);
        }
        return text.trim();
      } catch (err) {
        lastErr = err;
        if (!transient(err)) {
          // Hard error (4xx, auth, malformed request) — fail fast.
          throw err;
        }
        if (attempt < maxAttempts - 1) {
          // Same model, more attempts left — wait briefly then retry.
          await new Promise((r) => setTimeout(r, PRIMARY_RETRY_DELAY_MS));
          continue;
        }
        // Out of attempts on this model — fall through to next model.
        if (mi < MODEL_CHAIN.length - 1) {
          console.warn(`[counselor] model ${modelName} unavailable (${err?.status || "n/a"}), trying fallback ${MODEL_CHAIN[mi + 1]}`);
        }
      }
    }
  }
  throw lastErr;
}

export function isCounselorConfigured() {
  return Boolean(API_KEY && API_KEY.length > 10);
}

export default { generateCounselorReply, isCounselorConfigured };
