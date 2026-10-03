// Clean, simple Gemini service for the AI Counselor.
// Uses the official @google/generative-ai SDK.
// The API key is read ONLY from server-side env (GEMINI_API_KEY).
// It is never exposed to the browser.

import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const API_KEY = process.env.GEMINI_API_KEY || "";

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

  const model = c.getGenerativeModel({
    model: MODEL,
    systemInstruction,
  });

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

  const chat = model.startChat({
    history: chatHistory,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
      topP: 0.9,
      topK: 40,
    },
  });

  // Retry on transient 5xx / network errors. Most user-facing failures are
  // Google's "high demand" 503s, which usually clear within a few seconds.
  // Up to 3 total attempts with exponential backoff (1.5s, 3s).
  const transient = (err) => {
    const msg = String(err?.message || err || "");
    return /503|Service Unavailable|high demand|fetch failed|ETIMEDOUT|ECONNRESET|EAI_AGAIN/i.test(msg);
  };

  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await chat.sendMessage(last.parts[0].text);
      const text = result?.response?.text?.();
      if (!text || !text.trim()) {
        throw new Error("Gemini returned an empty response.");
      }
      return text.trim();
    } catch (err) {
      lastErr = err;
      if (transient(err) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 1500 * Math.pow(2, attempt)));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

export function isCounselorConfigured() {
  return Boolean(API_KEY && API_KEY.length > 10);
}

export default { generateCounselorReply, isCounselorConfigured };
