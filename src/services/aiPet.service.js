// AI Pet service — two-step Gemini orchestration.
//
// FLOW:
//   1. STAGE 1 — Intent: feed the latest user message to Gemini with a
//      strict system prompt that asks for a JSON action plan
//      (intent + entities + which tool to call). The plan tells the
//      controller which retrieval function to run.
//   2. CONTROLLER — runs the matched retrieval function against MongoDB
//      using the validated entities. Raw queries are NEVER produced by
//      the AI.
//   3. STAGE 2 — Answer: feed the same conversation + the retrieved
//      records back to Gemini and ask it to write the user-facing reply,
//      grounded in the data we just gave it. This stage also classifies
//      the response (listings to render, etc.).
//
// This pattern matches the AI Counselor's model fallback chain — primary
// model first, then lite / preview flash tiers on transient errors.

import { GoogleGenerativeAI } from "@google/generative-ai";
import * as retrieval from "./aiPetRetrieval.service.js";

const API_KEY = process.env.GEMINI_API_KEY || "";

const PRIMARY = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const FALLBACK_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
  "gemini-flash-lite-latest",
  "gemini-3-flash-preview",
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.5-flash",
];
const MODEL_CHAIN = [PRIMARY, ...FALLBACK_MODELS.filter((m) => m !== PRIMARY)];
const PRIMARY_MAX_ATTEMPTS = 2;
const FALLBACK_MAX_ATTEMPTS = 1;
const PRIMARY_RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 12000;

let client = null;
function getClient() {
  if (client) return client;
  if (!API_KEY) throw new Error("GEMINI_API_KEY is not configured on the server.");
  client = new GoogleGenerativeAI(API_KEY);
  return client;
}

const transient = (err) => {
  const status = err?.status ?? err?.statusCode;
  if ([429, 500, 502, 503, 504].includes(status)) return true;
  const msg = String(err?.message || err || "");
  return /503|Service Unavailable|high demand|fetch failed|fetch error|ETIMEDOUT|ECONNRESET|EAI_AGAIN|429|rate.?limit|overloaded|aborted|Request aborted/i.test(
    msg
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Stage-1 system prompt — Intent + entities.
// ─────────────────────────────────────────────────────────────────────────
//
// Gemini returns ONE JSON object describing the action to take. We validate
// the shape before letting the controller dispatch to a retrieval function.

const STAGE1_SYSTEM = `You are the routing brain for "EasyToFindEdu Pet", an AI assistant that ONLY answers listing questions using EasyToFindEdu's own MongoDB database. You DO NOT answer the user directly. You only classify their latest message into a JSON action.

You will be given:
- the recent chat history (so you can resolve follow-ups like "under ₹7,000" against the previous hostel search)
- the latest user message
- the page context (URL pathname) the user is currently viewing, if any

Output a SINGLE JSON object (no prose, no markdown fences) with this exact shape:
{
  "action": "search_hostels" | "search_institutes" | "search_colleges" | "search_courses" | "compare" | "clarify" | "smalltalk",
  "entities": { ... },
  "rephrase": "a one-sentence version of the user's request, useful for the assistant that writes the final answer"
}

Allowed values:

- "search_hostels" — student is looking for hostels. entities can include:
    city (string), area (string), hostel_type ("boys" | "girls" | "co_ed"),
    max_price (number INR/month), min_price (number INR/month),
    has_food (boolean), has_ac (boolean), has_wifi (boolean),
    priority ("price" | "location" | "food" | "facilities" | "rating" | "any"),
    sortBy ("price_asc" | "price_desc" | "rating" | "newest" | "default")

- "search_institutes" — student is looking for coaching institutes / training centres.
    entities can include: city, area, course (substring), priority.

- "search_colleges" — student is looking for colleges. entities can include:
    city, state, collegeType ("Engineering" | "Medical" | "Management" | etc.),
    course (substring), priority.

- "search_courses" — student is asking which colleges/institutes offer a course.
    entities can include: courseName, stream, degreeType ("UG" | "PG" | "Diploma").

- "compare" — student is asking to compare previously-shown items.
    The controller will look back at the conversation's last hostels/institutes/colleges and compare them.

- "clarify" — student query is too vague to act on. entities.rephrase should hold a single short clarifying question for the student.

- "smalltalk" — greeting / out-of-scope question. entities.rephrase should hold a one-sentence friendly reply grounded in EasyToFindEdu's mission (education marketplace).

PRIORITY / SORT MAPPING (apply when the user hints at ranking):
- "affordable", "cheapest", "cheaper", "budget", "low cost", "low price" → sortBy="price_asc", priority="price"
- "most expensive", "premium" → sortBy="price_desc", priority="price"
- "closest", "nearest", "near me", "close to" → priority="location"
- "highest rated", "best", "top", "most popular", "highly rated" → sortBy="rating", priority="rating"
- "with food" / "with AC" / "with Wi-Fi" → set the matching has_food/has_ac/has_wifi boolean AND priority="facilities"
- No ranking words → sortBy="default", priority="any"

RULES (strict):
- Resolve references against the chat history. If the previous turn was a hostel search and the user says "under ₹7,000", set action=search_hostels with max_price=7000 (preserving the previous city/area).
- For college search the keyword "B.Tech", "MBA", "CSE", etc. is a course hint, not a city.
- For hostel search "Boys hostel", "girls hostel", "co-ed" etc. map to hostel_type.
- "near X" or "close to X" is an AREA hint, not a city. Set entities.area to that value.
- NEVER invent entity values the user did not state or imply from prior turns.
- If a budget is mentioned, parse it to a number in INR (e.g. "7k" → 7000, "₹7000" → 7000, "under 10k" → 10000).
- If location is in the URL page context (pathname like /hostels/maurya-girls-hostel-patna), you may use that as a hint for area/city but you MUST NOT assume it is what the student meant unless they referred to it.
- Output NOTHING except the JSON.`;

// ─────────────────────────────────────────────────────────────────────────
// Stage-2 system prompt — Final answer.
// ─────────────────────────────────────────────────────────────────────────

const STAGE2_SYSTEM = `You are "EasyToFindEdu Pet" 🐾, a friendly, conversational assistant that ONLY answers listing questions using EasyToFindEdu's own database.

You will be given:
- the chat history
- the latest user message
- the action that was taken
- the FULL STRUCTURED RECORDS that were retrieved from the EasyToFindEdu database (JSON)
- a list of city names already in the database

ABSOLUTE GROUNDING RULES — read carefully. Every reply must comply:

1. Every listing name you mention MUST be exactly one of the "name" values in the records provided. If a name does not appear in the records, you MUST NOT mention it.
2. Every price, fee, or rent figure you mention MUST come from the records. If a price is missing for a listing, say "fees not listed" or skip it.
3. Every facility (Wi-Fi, food, AC, gym, etc.) you mention MUST come from the records. Do NOT invent.
5. Every rating / score you mention MUST come from the records. Do NOT invent.
6. Every location claim MUST come from the records.
   - If the record has a numeric distance to a landmark (record.nearbyDistances), you may quote that exact number, prefixed with "approximately".
   - If the record only has the area name (record.area), say "associated with the X area" or "located in X". DO NOT invent a numeric distance like "1.2 km away" or "nearest" — unless the record contains that exact figure.
   - NEVER claim one hostel is "closer" than another unless the records contain comparable numeric distances.
7. Every comparison must use ONLY fields present in the records. Explain trade-offs based on the actual numbers and flags.
8. If the user asks for information the records do not contain (e.g. exact km distance, current vacancy, owner phone), say plainly: "I don't have that information in the current EasyToFindEdu listing." — do NOT guess.
9. NEVER invent availability, vacancy, current promotions, or contact details.
10. NEVER use outside internet knowledge to fill in missing EasyToFindEdu listing facts (no CollegeDunia / Shiksha / Wikipedia / general hostel directories).
11. If the records list 0 listings, do NOT pretend there are results. Tell the student honestly: "I couldn't find any matching listings in EasyToFindEdu's current database." Then suggest what to change (broader location, higher budget, different course).
13. General knowledge questions ("capital of India", "how are you") get a one-sentence friendly reply. Keep them short.

Writing rules:
- Be concise but warm. 2–4 sentences for simple answers, longer for comparisons.
- Use bullet points when listing 2+ options.
- When a fact is missing, say so. Do NOT fill the gap from training data.
- Keep the assistant voice consistent — this is a friendly mascot, not a search engine.

Comparison rule:
- When comparing, present facts neutrally. Explain trade-offs using only DB attributes (cheaper, has AC, has food, larger campus, more recent, etc.). Do NOT declare a winner.

Reply must be PLAIN TEXT — no JSON, no markdown fences. You may use **bold** for listing names and short bullet lines. You may reference a listing by its "name" field exactly as it appears.`;

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

const numFromTokens = (tokens) => {
  if (!Array.isArray(tokens)) return null;
  for (const t of tokens) {
    if (!t) continue;
    const m = String(t).match(/(\d+(?:\.\d+)?)\s*(k|thousand|lakh|lac|l|crore|cr)?/i);
    if (m) {
      const v = Number(m[1]);
      const u = (m[2] || "").toLowerCase();
      if (!Number.isFinite(v)) continue;
      if (u === "k" || u === "thousand") return v * 1000;
      if (u === "l" || u === "lakh" || u === "lac") return v * 100000;
      if (u === "cr" || u === "crore") return v * 10000000;
      return v;
    }
  }
  return null;
};

/** Light entity extraction that fills gaps if Gemini's first-stage JSON
 *  comes back missing a field the regex above can find in the user's text. */
const reinforceEntities = (text, action, entities) => {
  const out = { ...(entities || {}) };
  const priceMatch = numFromTokens([text]);
  if (
    priceMatch !== null &&
    (action === "search_hostels" || action === "compare") &&
    out.max_price === undefined &&
    /\b(under|below|less than|<|upto|max|maximum|budget|cheap)\b/i.test(text)
  ) {
    out.max_price = priceMatch;
  }
  if (
    action === "search_hostels" &&
    !out.hostel_type
  ) {
    if (/\bboys?\b/i.test(text)) out.hostel_type = "boys";
    else if (/\bgirls?\b/i.test(text)) out.hostel_type = "girls";
    else if (/\bco[- ]?ed\b/i.test(text)) out.hostel_type = "co_ed";
  }
  if (action === "search_hostels" && /\b(ac|a\.c\.)\b/i.test(text)) out.has_ac = true;
  if (action === "search_hostels" && /\b(food|meal|meals|mess)\b/i.test(text)) out.has_food = true;
  if (action === "search_hostels" && /\b(wifi|wi[- ]?fi)\b/i.test(text)) out.has_wifi = true;

  // Reinforce ranking / sort hints that Gemini may have left out.
  if (action === "search_hostels" && !out.sortBy) {
    if (/\b(affordable|cheapest|cheaper|budget|low[- ]?cost|low[- ]?price|cheap(?:er)?|inexpensive)\b/i.test(text)) {
      out.sortBy = "price_asc";
      if (!out.priority) out.priority = "price";
    } else if (/\b(most expensive|premium|costly|high[- ]?end)\b/i.test(text)) {
      out.sortBy = "price_desc";
      if (!out.priority) out.priority = "price";
    } else if (/\b(highest[- ]?rated|best|top[- ]?rated|top|most popular|highly[- ]?rated|highest)\b/i.test(text)) {
      out.sortBy = "rating";
      if (!out.priority) out.priority = "rating";
    } else if (/\b(closest|nearest|near|close to|nearby)\b/i.test(text)) {
      if (!out.priority) out.priority = "location";
    }
  }

  return out;
};

const parseStage1 = (raw) => {
  // Strip ```json fences if present.
  const trimmed = String(raw || "").trim();
  const jsonStart = trimmed.indexOf("{");
  const jsonEnd = trimmed.lastIndexOf("}");
  const slice = jsonStart >= 0 && jsonEnd > jsonStart ? trimmed.slice(jsonStart, jsonEnd + 1) : trimmed;
  try {
    const parsed = JSON.parse(slice);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
};

const callGemini = async (systemInstruction, history, userText, opts = {}) => {
  const c = getClient();
  const msgs = (history || [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant" || m.role === "model"))
    .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: String(m.content ?? "") }] }));
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") {
    msgs.push({ role: "user", parts: [{ text: String(userText || "") }] });
  } else {
    msgs[msgs.length - 1] = { role: "user", parts: [{ text: String(userText || "") }] };
  }
  const chatHistory = msgs.slice(0, -1);

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
        temperature: opts.temperature ?? 0.4,
        maxOutputTokens: opts.maxOutputTokens ?? 1024,
        topP: 0.9,
        topK: 40,
      },
    });
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await chat.sendMessage(msgs[msgs.length - 1].parts[0].text);
        const text = result?.response?.text?.();
        if (!text || !text.trim()) throw new Error("Gemini returned an empty response.");
        if (mi > 0) {
          console.warn(`[ai-pet] succeeded via fallback model ${modelName} after primary ${PRIMARY} failed`);
        }
        return text.trim();
      } catch (err) {
        lastErr = err;
        if (!transient(err)) throw err;
        if (attempt < maxAttempts - 1) {
          await new Promise((r) => setTimeout(r, PRIMARY_RETRY_DELAY_MS));
          continue;
        }
        if (mi < MODEL_CHAIN.length - 1) {
          console.warn(`[ai-pet] model ${modelName} failed (${err?.status || "n/a"}), trying fallback ${MODEL_CHAIN[mi + 1]}`);
        }
      }
    }
  }
  throw lastErr;
};

// ─────────────────────────────────────────────────────────────────────────
// PUBLIC ENTRY
// ─────────────────────────────────────────────────────────────────────────

/**
 * @typedef {{ role: "user" | "assistant", content: string }} PetMessage
 * @typedef {{
 *   message: string;
 *   listings: any[];
 *   action: string;
 *   rephrase?: string;
 *   cities?: string[];
 * }} PetResult
 */

/**
 * Run the AI Pet on a conversation.
 *
 * @param {PetMessage[]} history - frontend-owned, last entry should be the user
 * @param {{ pathname?: string, cities?: string[], contextListingIds?: { hostels?: string[], institutes?: string[], colleges?: string[] } }} context
 * @returns {Promise<PetResult>}
 */
export async function runPet(history, context = {}) {
  if (!Array.isArray(history) || history.length === 0) {
    throw new Error("history must be a non-empty array");
  }
  const last = history[history.length - 1];
  if (last.role !== "user") {
    throw new Error("Last message must be from the user");
  }
  const userText = String(last.content || "").trim();

  // Pre-discover available cities for the system prompt.
  let cities = Array.isArray(context.cities) ? context.cities : null;
  if (!cities) {
    try {
      cities = await retrieval.getAvailableCities();
    } catch {
      cities = [];
    }
  }

  // ── Stage 1: classify ───────────────────────────────────────────────
  const stage1User = [
    "AVAILABLE CITIES (substring of these):",
    cities.slice(0, 60).join(", ") || "(none discovered)",
    "",
    "PAGE CONTEXT:",
    context.pathname ? `pathname = ${context.pathname}` : "(no page)",
    "",
    "CONVERSATION HISTORY (most recent last):",
    history
      .slice(-6)
      .map((m) => `${m.role === "user" ? "Student" : "Pet"}: ${String(m.content || "").slice(0, 600)}`)
      .join("\n"),
    "",
    "LATEST USER MESSAGE:",
    userText,
    "",
    "Return only the JSON action object.",
  ].join("\n");

  let stage1;
  try {
    const raw = await callGemini(STAGE1_SYSTEM, history.slice(0, -1), stage1User, {
      temperature: 0.2,
      maxOutputTokens: 400,
    });
    stage1 = parseStage1(raw);
  } catch (err) {
    // If the intent classifier is fully unavailable, fall back to a
    // smalltalk-style reply instead of failing the whole request.
    console.error("[ai-pet] stage-1 Gemini error:", err?.message || err);
    return {
      action: "smalltalk",
      message: "I'm having trouble thinking right now. Please try again in a moment.",
      listings: [],
      cities,
    };
  }

  if (!stage1 || typeof stage1 !== "object" || !stage1.action) {
    return {
      action: "smalltalk",
      message: "I'm not quite sure I caught that. Could you rephrase what you're looking for?",
      listings: [],
      cities,
    };
  }

  stage1.entities = reinforceEntities(userText, stage1.action, stage1.entities || {});
  const action = stage1.action;
  const entities = stage1.entities || {};

  // ── Dispatch retrieval ──────────────────────────────────────────────
  let listings = [];
  let retrievalContext = [];

  try {
    if (action === "search_hostels") {
      const params = {
        city: entities.city || undefined,
        area: entities.area || undefined,
        hostel_type: entities.hostel_type || undefined,
        max_price: typeof entities.max_price === "number" ? entities.max_price : undefined,
        min_price: typeof entities.min_price === "number" ? entities.min_price : undefined,
        has_food: entities.has_food === true ? true : undefined,
        has_ac: entities.has_ac === true ? true : undefined,
        has_wifi: entities.has_wifi === true ? true : undefined,
        sortBy: entities.sortBy || undefined,
        limit: 6,
      };
      listings = await retrieval.searchHostels(params);
      // Full structured record is passed to Stage 2 — every field the AI
      // may mention must come from here. This is the source-of-truth list.
      retrievalContext = listings.map((h) => ({
        kind: "hostel",
        id: h.listingId,
        name: h.name,
        slug: h.slug,
        type: h.type,
        location: {
          city: h.city,
          area: h.area,
          subarea: h.subarea,
          state: h.state,
          fullAddress: h.fullAddress,
        },
        monthlyRent: h.monthlyRent,
        roomTypes: h.roomTypes,
        hasAC: h.hasAC,
        hasFood: h.hasFood,
        foodDetails: h.foodDetails,
        hasWiFi: h.hasWiFi,
        security: h.security,
        rating: h.rating,
        overallScore: h.comparisonMetrics?.overallScore,
        isOpen: h.isOpen,
        nearbyDistances: h.nearbyDistances,
        detailUrl: h.detailUrl,
      }));
    } else if (action === "search_institutes") {
      const params = {
        city: entities.city || undefined,
        area: entities.area || undefined,
        course: entities.course || undefined,
        limit: 6,
      };
      listings = await retrieval.searchInstitutes(params);
      retrievalContext = listings.map((i) => ({
        kind: "institute",
        id: i.listingId,
        name: i.name,
        location: { city: i.city, area: i.area, subarea: i.subarea, fullAddress: i.fullAddress },
        establishedYear: i.establishedYear,
        courses: i.courses,
        facilities: i.facilities,
        facilityList: i.facilityList,
        overallScore: i.comparisonMetrics?.overallScore,
        director: i.director,
        averageFacultyExperience: i.averageFacultyExperience,
        detailUrl: i.detailUrl,
      }));
    } else if (action === "search_colleges") {
      const params = {
        city: entities.city || undefined,
        state: entities.state || undefined,
        course: entities.course || undefined,
        collegeType: entities.collegeType || undefined,
        limit: 6,
      };
      listings = await retrieval.searchColleges(params);
      retrievalContext = listings.map((c) => ({
        kind: "college",
        id: c.listingId,
        name: c.name,
        shortName: c.shortName,
        location: { city: c.city, state: c.state, fullAddress: c.fullAddress },
        collegeType: c.collegeType,
        ownershipType: c.ownershipType,
        affiliationType: c.affiliationType,
        approvedBy: c.approvedBy,
        accreditation: c.accreditation,
        ranking: c.ranking,
        placements: c.placements,
        feeStructure: c.feeStructure,
        coursesOffered: c.coursesOffered,
        detailUrl: c.detailUrl,
      }));
    } else if (action === "search_courses") {
      const params = {
        courseName: entities.courseName || undefined,
        stream: entities.stream || undefined,
        degreeType: entities.degreeType || undefined,
        limit: 6,
      };
      listings = await retrieval.searchCourses(params);
      retrievalContext = listings.map((c) => ({
        kind: "course",
        id: c.listingId,
        name: c.courseName,
        fullForm: c.fullForm,
        degreeType: c.degreeType,
        stream: c.stream,
        specialization: c.specialization,
        duration: c.duration,
        semesters: c.semesters,
        eligibility: c.eligibility,
        requiredSubjects: c.requiredSubjects,
        entranceExamsAccepted: c.entranceExamsAccepted,
        detailUrl: c.detailUrl,
      }));
    } else if (action === "compare") {
      const ids = context.contextListingIds || {};
      const [hostels, institutes, colleges] = await Promise.all([
        ids.hostels?.length
          ? retrieval.getHostelsByIds(ids.hostels)
          : [],
        ids.institutes?.length
          ? retrieval.getInstitutesByIds(ids.institutes)
          : [],
        ids.colleges?.length
          ? retrieval.getCollegesByIds(ids.colleges)
          : [],
      ]);
      listings = [...hostels, ...institutes, ...colleges];
      // Full comparison context — Gemini must see every attribute, not just names.
      retrievalContext = listings.map((x) => ({
        kind: x.detailUrl.startsWith("/hostels")
          ? "hostel"
          : x.detailUrl.startsWith("/institutes")
            ? "institute"
            : x.detailUrl.startsWith("/colleges")
              ? "college"
              : "course",
        id: x.listingId,
        name: x.name,
        // Hostel fields (only present on hostel records).
        city: x.city,
        area: x.area,
        subarea: x.subarea,
        state: x.state,
        fullAddress: x.fullAddress,
        monthlyRent: x.monthlyRent,
        hasAC: x.hasAC,
        hasFood: x.hasFood,
        hasWiFi: x.hasWiFi,
        roomTypes: x.roomTypes,
        foodDetails: x.foodDetails,
        security: x.security,
        rating: x.rating,
        overallScore: x.comparisonMetrics?.overallScore,
        nearbyDistances: x.nearbyDistances,
        // Institute fields.
        establishedYear: x.establishedYear,
        courses: x.courses,
        facilities: x.facilities,
        facilityList: x.facilityList,
        // College fields.
        collegeType: x.collegeType,
        ownershipType: x.ownershipType,
        affiliationType: x.affiliationType,
        approvedBy: x.approvedBy,
        accreditation: x.accreditation,
        ranking: x.ranking,
        placements: x.placements,
        feeStructure: x.feeStructure,
        detailUrl: x.detailUrl,
      }));
    }
  } catch (err) {
    console.error("[ai-pet] retrieval error:", err?.message || err);
    return {
      action,
      message:
        "Sorry, I'm having trouble accessing EasyToFindEdu listings right now. Please try again.",
      listings: [],
      cities,
    };
  }

  // ── Stage 2: write the user-facing reply ────────────────────────────
  // Build a structured prompt so Gemini sees the FULL records as JSON,
  // not a one-line summary. The records below are the only source of truth.
  const stage2User = [
    "ACTION TAKEN:",
    action,
    "",
    "STUDENT'S REQUEST:",
    stage1.rephrase || userText,
    "",
    "RETRIEVED EASYTOFINDEDU RECORDS (the only factual source you may use — every name, price, facility, rating, location claim must come from these JSON objects):",
    retrievalContext.length
      ? "```json\n" +
        JSON.stringify(retrievalContext, null, 2).slice(0, 6000) +
        "\n```"
      : "(no records matched — say so honestly and suggest what to change)",
    "",
    "Write the reply now in plain text (no JSON, no fences). Refer to listings by their exact `name` value.",
  ].join("\n");

  let message;
  try {
    message = await callGemini(STAGE2_SYSTEM, history, stage2User, {
      temperature: 0.55,
      maxOutputTokens: 700,
    });
  } catch (err) {
    console.error("[ai-pet] stage-2 Gemini error:", err?.message || err);
    // Fall back to a deterministic reply built from the records so we still
    // never fabricate. If we have no records, the smalltalk line above is
    // already informative enough.
    if (listings.length === 0) {
      return {
        action,
        message:
          "I couldn't find any matching listings in EasyToFindEdu's current database. Try widening the location, budget, or course.",
        listings: [],
        cities,
      };
    }
    message = `I found ${listings.length} option${
      listings.length === 1 ? "" : "s"
    } in our database. Take a look below.`;
  }

  // If action was smalltalk / clarify and Gemini didn't echo any records,
  // suppress the listings array — the frontend only renders cards when
  // there's actual data.
  if (action === "smalltalk" || action === "clarify") {
    return { action, message, listings: [], rephrase: stage1.rephrase, cities };
  }

  return {
    action,
    message,
    listings,
    rephrase: stage1.rephrase,
    cities,
  };
}

export function isPetConfigured() {
  return Boolean(API_KEY && API_KEY.length > 10);
}

export default { runPet, isPetConfigured };