import fetch from "node-fetch";

const logger = {
  info: (msg, data = {}) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, data),
  error: (msg, error = {}) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, error),
};

let apiKey = process.env.GEMINI_API_KEY || "";
let model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
let apiUrl = process.env.GEMINI_API_URL || "https://generativelanguage.googleapis.com/v1beta/models";

export function configureGemini({ key, modelName, url }) {
  if (key) apiKey = key;
  if (modelName) model = modelName;
  if (url) apiUrl = url;
}

export function isConfigured() {
  return Boolean(apiKey && apiKey.length > 10);
}

const SYSTEM_PROMPT = `You are a knowledgeable and empathetic career counselor AI assistant for EasyToFindEdu, an Indian education platform. You help students from Class 10 onwards explore careers, understand educational paths, and plan their futures.

IMPORTANT RULES:
1. NEVER invent real-world facts (exam dates, fees, seat counts, salary figures, college cutoffs). If you don't know, say so clearly and suggest verifying from official sources.
2. ALWAYS ground answers in the student's provided profile data (education, interests, skills, constraints).
3. When discussing institutes, courses, or exams, note that the student should verify details from official websites.
4. NEVER claim a career is "perfect" or "guaranteed success". Use "Profile Match" for numerical scores, not probability.
5. Be encouraging but realistic. Acknowledge challenges and constraints.
6. Ask clarifying questions when the student's profile is incomplete.
7. Keep responses concise but thorough. Use plain language accessible to Indian students.
8. When recommending actions (explore career, compare, add to roadmap), format as simple action suggestions the frontend can render.
9. Format your responses with clear sections using **bold headings** for readability.
10. For Indian context: use INR for costs, understand Indian education system (CBSE/ICSE/State boards, JEE/NEET/UPSC, IITs/NITs/AIIMS etc.)
11. NEVER share, repeat, or store personal data beyond the current conversation.
12. If the student asks about information outside education/careers, politely redirect to career guidance topics.
13. When asked to compare careers, present information neutrally without declaring a "winner".
14. When suggesting learning plans, ask about available time and current commitments.
15. For roadmap generation, always respect the student's current education level and existing progress.`;

export async function generateResponse(messages, options = {}) {
  if (!isConfigured()) {
    throw new Error("Gemini API is not configured. Please set GEMINI_API_KEY.");
  }

  const { temperature = 0.7, maxOutputTokens = 2048, topP = 0.9, topK = 40 } = options;

  // Build the conversation history in Gemini format
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "model" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const body = {
    contents,
    generationConfig: {
      temperature: Math.min(Math.max(temperature, 0), 1),
      maxOutputTokens: Math.min(maxOutputTokens, 8192),
      topP: Math.min(Math.max(topP, 0), 1),
      topK: Math.min(Math.max(topK, 1), 100),
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    ],
  };

  // Prepend system prompt as first user message if not already present
  if (contents.length > 0 && contents[0].role !== "user") {
    contents.unshift({
      role: "user",
      parts: [{ text: SYSTEM_PROMPT }],
    });
  } else if (contents.length === 0) {
    contents.push({
      role: "user",
      parts: [{ text: SYSTEM_PROMPT + "\n\nStart the conversation." }],
    });
  }

  const url = `${apiUrl}/${model}:generateContent?key=${apiKey}`;

  let response;
  let retries = 0;
  const maxRetries = 2;

  while (retries <= maxRetries) {
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        timeout: 30000,
      });
      break;
    } catch (err) {
      retries++;
      if (retries > maxRetries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * retries));
    }
  }

  if (!response?.ok) {
    let errorDetail = "";
    try {
      const errBody = await response?.json();
      errorDetail = errBody?.error?.message || JSON.stringify(errBody);
    } catch { /* ignore */ }
    logger.error("Gemini API error", { status: response?.status, detail: errorDetail });
    throw new Error(`Gemini API error (${response?.status}): ${errorDetail || "Unknown error"}`);
  }

  const data = await response.json();

  if (!data.candidates || data.candidates.length === 0) {
    if (data.promptFeedback?.blockReason) {
      throw new Error(`Content blocked: ${data.promptFeedback.blockReason}`);
    }
    throw new Error("No response from Gemini. Please try again.");
  }

  const candidate = data.candidates[0];
  if (candidate.finishReason === "SAFETY" || candidate.finishReason === "RECITATION") {
    throw new Error("Your message could not be processed. Please rephrase and try again.");
  }

  const text = candidate.content?.parts?.[0]?.text || "";
  logger.info("Gemini response generated", { tokens: text.length });

  return text;
}

export default { generateResponse, configureGemini, isConfigured };
