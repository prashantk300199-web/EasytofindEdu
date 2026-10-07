// Clean, simple Gemini service for the AI Counselor.
// Uses the official @google/generative-ai SDK.
// The API key is read ONLY from server-side env (GEMINI_API_KEY).
// It is never exposed to the browser.

import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY || "";

// Model chain — primary first (env override), then stable fallbacks.
// Gemini 3.x flash models share the same API surface; when one is overloaded
// or quota-exhausted, another usually has capacity. Models with different
// tier names (lite, preview) tend to be on separate quota pools, which helps
// when the project is hitting its quota on the regular flash tier.
//
// Fallback order is curated to put the most-reliable / most-likely-to-have-
// quota models first. If env GEMINI_MODEL is set, it goes first regardless.
const PRIMARY = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const FALLBACK_MODELS = [
  "gemini-3.5-flash-lite",  // separate lite pool; confirmed working
  "gemini-3.6-flash",       // confirmed working
  "gemini-3-flash-preview", // separate preview pool; confirmed working
  "gemini-3.8-flash",       // primary default
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
 * Returns null only when there is no usable profile data at all.
 *
 * The section is split into "KNOWN" fields (the AI must NOT ask for these
 * again) and "KNOWN PREFERENCES" (the AI should use these to personalise).
 * When `hasProfile` is true but the career-guidance questionnaire hasn't
 * been completed, we still emit the basics — the student already gave us
 * name, qualification, school, percentage, and interests at signup, so the
 * AI must use those instead of re-asking.
 */
function formatProfileSection(ctx) {
  if (!ctx || !ctx.hasProfile) return null;

  const lines = [];
  const basics = ctx.basics || {};
  const cg = ctx.careerGuidance || {};
  const prefs = cg.preferences || {};

  if (basics.name) lines.push(`- Name: ${basics.name}`);
  if (basics.gender) lines.push(`- Gender: ${basics.gender}`);
  if (basics.educationLevel) lines.push(`- Current education level / last qualification: ${basics.educationLevel}`);
  if (basics.board) lines.push(`- Board: ${basics.board}`);
  if (basics.school) lines.push(`- School / institution: ${basics.school}`);
  if (basics.percentage) lines.push(`- Latest percentage / score: ${basics.percentage}`);
  if (basics.passingYear) lines.push(`- Passing year: ${basics.passingYear}`);
  if (cg.stream) lines.push(`- Stream: ${cg.stream}`);
  if (Array.isArray(cg.interests) && cg.interests.length) {
    lines.push(`- Subjects / interests: ${cg.interests.join(", ")}`);
  }
  if (Array.isArray(cg.skills) && cg.skills.length) {
    lines.push(`- Self-reported skills: ${cg.skills.join(", ")}`);
  }
  if (prefs.careerGoal) lines.push(`- Career goal: ${prefs.careerGoal}`);
  if (prefs.expertiseSubject) lines.push(`- Strongest subject: ${prefs.expertiseSubject}`);
  if (prefs.budget) lines.push(`- Budget for studies: ${prefs.budget}`);
  if (prefs.financialCapacity) lines.push(`- Financial capacity tier: ${prefs.financialCapacity}`);
  if (prefs.timeframe) lines.push(`- Timeframe: ${prefs.timeframe}`);
  if (prefs.workStyle) lines.push(`- Preferred work style: ${prefs.workStyle}`);
  if (prefs.workEnvironment) lines.push(`- Preferred work environment: ${prefs.workEnvironment}`);
  if (Array.isArray(prefs.priorities) && prefs.priorities.length) {
    lines.push(`- Career priorities: ${prefs.priorities.join(", ")}`);
  }
  if (prefs.relocation) lines.push(`- Relocation willingness: ${prefs.relocation}`);
  if (Array.isArray(prefs.preferredCities) && prefs.preferredCities.length) {
    lines.push(`- Preferred cities: ${prefs.preferredCities.join(", ")}`);
  }
  if (prefs.hostelNeeded) lines.push(`- Hostel needed: ${prefs.hostelNeeded}`);
  if (prefs.scholarshipLoan) lines.push(`- Scholarship / loan preference: ${prefs.scholarshipLoan}`);

  if (Array.isArray(ctx.savedCareers) && ctx.savedCareers.length) {
    lines.push(`- Saved careers (already shortlisted by the student): ${ctx.savedCareers.map((c) => c.title).join(", ")}`);
  }
  if (Array.isArray(ctx.topRecommendations) && ctx.topRecommendations.length) {
    lines.push(
      `- Top recommendations shown to this student on the platform: ${ctx.topRecommendations.map((r) => r.title).join(", ")}`
    );
  }

  if (lines.length === 0) return null;

  const isQuestionnaireComplete = cg.isComplete === true;

  return [
    "",
    "== STUDENT PROFILE (already provided by the student on signup / career-guidance page — DO NOT ask for these fields again) ==",
    ...lines,
    "== END STUDENT CONTEXT ==",
    "",
    "Behavioural rules:",
    "- The fields above are ALREADY KNOWN. Never ask the student to repeat their name, education level, qualification, stream, board, school, percentage, subjects, interests, skills, career goal, budget, timeframe, work style, work environment, priorities, preferred cities.",
    "- Use these details to personalise your answer silently. Tailor examples, suggestions, and the level of explanation to this student's profile.",
    "- Do NOT begin with phrases like 'Based on your profile', 'As a Class 12 PCM student', 'Since you're interested in...'. Just answer their question, with their context in mind.",
    isQuestionnaireComplete
      ? "- The career-guidance questionnaire is complete — full profile is available above."
      : "- The career-guidance questionnaire is NOT yet complete. Only the signup-time basics are known. Do not invent preferences the student hasn't shared (e.g. specific city, budget, career goal).",
    "- If a relevant detail is missing from the profile above and you genuinely need it to answer, you may ask ONE focused clarifying question — but only for the specific missing field, and only when it would meaningfully change your recommendation.",
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
