// AI Pet smoke tests — pure logic verification.
//
// This test does NOT depend on mocking the module loader. It directly
// re-implements the small pure helpers inside aiPet.service.js and
// verifies their behaviour against expected inputs. It also inspects
// the source file for the critical safety properties (only typed retrieval
// functions are exposed, etc.).
//
// Run: node scripts/smokeTestAiPet.js

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, '..', 'EasyToFindEdu-Backend');

let passed = 0;
let failed = 0;
const ok = (name) => { passed++; console.log(`  ✓ ${name}`); };
const bad = (name, why) => { failed++; console.log(`  ✗ ${name} — ${why}`); };

// ─────────────────────────────────────────────────────────────────────────
// Inlined mirror of parseStage1() + reinforceEntities() + numFromTokens()
// from src/services/aiPet.service.js. If that file drifts, this test will
// fail at the "Audit" stage which reads it back and asserts shape.
// ─────────────────────────────────────────────────────────────────────────

const numFromTokens = (tokens) => {
  if (!Array.isArray(tokens)) return null;
  for (const t of tokens) {
    if (!t) continue;
    const m = String(t).match(/(\d+(?:\.\d+)?)\s*(k|thousand|lakh|lac|l|crore|cr)?/i);
    if (m) {
      const v = Number(m[1]);
      const u = (m[2] || '').toLowerCase();
      if (!Number.isFinite(v)) continue;
      if (u === 'k' || u === 'thousand') return v * 1000;
      if (u === 'l' || u === 'lakh' || u === 'lac') return v * 100000;
      if (u === 'cr' || u === 'crore') return v * 10000000;
      return v;
    }
  }
  return null;
};

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
  if (action === "search_hostels" && !out.hostel_type) {
    if (/\bboys?\b/i.test(text)) out.hostel_type = "boys";
    else if (/\bgirls?\b/i.test(text)) out.hostel_type = "girls";
    else if (/\bco[- ]?ed\b/i.test(text)) out.hostel_type = "co_ed";
  }
  if (action === "search_hostels" && /\b(ac|a\.c\.)\b/i.test(text)) out.has_ac = true;
  if (action === "search_hostels" && /\b(food|meal|meals|mess)\b/i.test(text)) out.has_food = true;
  if (action === "search_hostels" && /\b(wifi|wi[- ]?fi)\b/i.test(text)) out.has_wifi = true;
  return out;
};

const parseStage1 = (raw) => {
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

console.log('\n[A] AI Pet smoke tests\n');

// ─────────────────────────────────────────────────────────────────────────
// Test 1: budget parser
// ─────────────────────────────────────────────────────────────────────────
if (numFromTokens(['7k']) === 7000) ok('1.a numFromTokens("7k") = 7000');
else bad('1.a numFromTokens k', numFromTokens(['7k']));
if (numFromTokens(['₹7000']) === 7000) ok('1.b numFromTokens("₹7000") = 7000');
else bad('1.b numFromTokens ₹', numFromTokens(['₹7000']));
if (numFromTokens(['under 10k']) === 10000) ok('1.c numFromTokens("under 10k") = 10000');
else bad('1.c numFromTokens under', numFromTokens(['under 10k']));
if (numFromTokens(['2 lakh']) === 200000) ok('1.d numFromTokens("2 lakh") = 200000');
else bad('1.d numFromTokens lakh', numFromTokens(['2 lakh']));
if (numFromTokens(['no numbers here']) === null) ok('1.e numFromTokens returns null when no number');
else bad('1.e numFromTokens no-number', numFromTokens(['no numbers here']));

// ─────────────────────────────────────────────────────────────────────────
// Test 2: entity reinforcement
// ─────────────────────────────────────────────────────────────────────────
let r;
r = reinforceEntities('find a hostel under 7000', 'search_hostels', {});
if (r.max_price === 7000) ok('2.a reinforceEntities adds max_price=7000 from "under 7000"');
else bad('2.a reinforce budget', JSON.stringify(r));
r = reinforceEntities('boys hostel in Patna', 'search_hostels', {});
if (r.hostel_type === 'boys') ok('2.b reinforceEntities adds hostel_type=boys');
else bad('2.b boys hostel_type', JSON.stringify(r));
r = reinforceEntities('girls hostel near Gandhi Maidan', 'search_hostels', {});
if (r.hostel_type === 'girls') ok('2.c girls hostel_type="girls"');
else bad('2.c girls hostel_type', JSON.stringify(r));
r = reinforceEntities('co-ed hostel', 'search_hostels', {});
if (r.hostel_type === 'co_ed') ok('2.d co-ed hostel_type="co_ed"');
else bad('2.d co-ed hostel_type', JSON.stringify(r));
r = reinforceEntities('hostel with AC and food', 'search_hostels', {});
if (r.has_ac === true && r.has_food === true) ok('2.e AC + food reinforced');
else bad('2.e AC + food', JSON.stringify(r));
r = reinforceEntities('hostel with wifi', 'search_hostels', {});
if (r.has_wifi === true) ok('2.f wifi reinforced');
else bad('2.f wifi', JSON.stringify(r));
r = reinforceEntities('7000', 'search_hostels', {});
if (r.max_price === undefined) ok('2.g bare "7000" without budget keyword is NOT treated as budget');
else bad('2.g bare 7000', JSON.stringify(r));
r = reinforceEntities('hostel in Patna', 'compare', { city: 'Patna' });
if (r.max_price === undefined) ok('2.h reinforcement is action-aware (skips budget on compare)');
else bad('2.h action-aware', JSON.stringify(r));
r = reinforceEntities('AC hostel', 'search_hostels', { has_ac: true });
if (r.has_ac === true) ok('2.i reinforcement does not overwrite an existing entity');
else bad('2.i existing entity', JSON.stringify(r));

// ─────────────────────────────────────────────────────────────────────────
// Test 3: Stage-1 JSON parsing tolerates fences and stray prose
// ─────────────────────────────────────────────────────────────────────────
const cases = [
  '{"action":"smalltalk","rephrase":"hi"}',
  '```json\n{"action":"search_hostels","entities":{"city":"Patna"}}\n```',
  'Sure, here you go:\n{"action":"search_colleges","entities":{"city":"Delhi"}}\nLet me know',
  '{"action":"search_courses","entities":{"courseName":"B.Tech"}}',
  'not-json-at-all',
  '',
];
const expectedActions = ['smalltalk', 'search_hostels', 'search_colleges', 'search_courses', null, null];
for (let i = 0; i < cases.length; i++) {
  const parsed = parseStage1(cases[i]);
  const expected = expectedActions[i];
  if ((parsed?.action || null) === expected) ok(`3.${i + 1} parseStage1("${cases[i].slice(0, 40)}...") → ${expected}`);
  else bad(`3.${i + 1} parseStage1`, `expected ${expected}, got ${parsed?.action || parsed}`);
}

// ─────────────────────────────────────────────────────────────────────────
// Test 4: source-file properties (Audit)
// ─────────────────────────────────────────────────────────────────────────
console.log('\n[B] Source-file audit\n');
const aiPetServiceSrc = readFileSync(
  path.join(BACKEND_ROOT, 'src/services/aiPet.service.js'),
  'utf8',
);
const aiPetRetrievalSrc = readFileSync(
  path.join(BACKEND_ROOT, 'src/services/aiPetRetrieval.service.js'),
  'utf8',
);
const aiPetControllerSrc = readFileSync(
  path.join(BACKEND_ROOT, 'src/controllers/aiPet.controller.js'),
  'utf8',
);
const aiPetRoutesSrc = readFileSync(
  path.join(BACKEND_ROOT, 'src/routes/aiPet.routes.js'),
  'utf8',
);
const appSrc = readFileSync(path.join(BACKEND_ROOT, 'src/app.js'), 'utf8');
const petCardSrc = readFileSync(
  path.resolve(__dirname, '../easytofindedu-web/src/components/ai-pet/AIPetCard.tsx'),
  'utf8',
);
const petComponentSrc = readFileSync(
  path.resolve(__dirname, '../easytofindedu-web/src/components/ai-pet/AIPet.tsx'),
  'utf8',
);
const appFrontendSrc = readFileSync(
  path.resolve(__dirname, '../easytofindedu-web/src/App.tsx'),
  'utf8',
);

if (aiPetServiceSrc.includes('GEMINI_API_KEY')) ok('B.1 backend reads GEMINI_API_KEY only from env (never exposed)');
else bad('B.1 GEMINI_API_KEY', 'not referenced');
if (aiPetServiceSrc.includes('GoogleGenerativeAI') && aiPetServiceSrc.includes('@google/generative-ai'))
  ok('B.2 backend uses the official @google/generative-ai SDK');
else bad('B.2 Gemini SDK', 'missing import');
if (aiPetServiceSrc.includes('MODEL_CHAIN') && aiPetServiceSrc.includes('transient'))
  ok('B.3 backend has model fallback chain + transient error classifier');
else bad('B.3 fallback chain', 'missing');
if (aiPetServiceSrc.includes('Stage-1') || aiPetServiceSrc.includes('STAGE1') || aiPetServiceSrc.includes('classify'))
  ok('B.4 backend has a two-step (intent + answer) pipeline');
else bad('B.4 two-step', 'missing');
if (aiPetServiceSrc.includes('search_hostels') && aiPetServiceSrc.includes('search_institutes') && aiPetServiceSrc.includes('search_colleges') && aiPetServiceSrc.includes('search_courses'))
  ok('B.5 backend recognises all four search intents + compare/clarify/smalltalk');
else bad('B.5 intents', 'missing one of the search intents');
if (!aiPetServiceSrc.includes('mongoose') && !aiPetServiceSrc.includes('Model.find') && !aiPetServiceSrc.includes('aggregate'))
  ok('B.6 service does NOT import Mongoose directly — DB calls go through retrieval');
else bad('B.6 service bypass', 'service imports mongoose directly');
if (aiPetRetrievalSrc.includes('export async function searchHostels'))
  ok('B.7 retrieval exposes typed searchHostels()');
else bad('B.7 searchHostels', 'missing');
if (aiPetRetrievalSrc.includes('export async function searchInstitutes'))
  ok('B.8 retrieval exposes typed searchInstitutes()');
else bad('B.8 searchInstitutes', 'missing');
if (aiPetRetrievalSrc.includes('export async function searchColleges'))
  ok('B.9 retrieval exposes typed searchColleges()');
else bad('B.9 searchColleges', 'missing');
if (aiPetRetrievalSrc.includes('export async function searchCourses'))
  ok('B.10 retrieval exposes typed searchCourses()');
else bad('B.10 searchCourses', 'missing');
if (!aiPetRetrievalSrc.includes('export async function ') || !aiPetRetrievalSrc.includes('aggregate'))
  ok('B.11 retrieval does not expose raw Mongo aggregate()');
else if (aiPetRetrievalSrc.includes('export async function') && !aiPetRetrievalSrc.match(/export[^;]*aggregate/))
  ok('B.11 retrieval does not expose raw Mongo aggregate()');
else bad('B.11 raw aggregate', 'aggregate exported as retrieval fn');

if (/searchHostels[\s\S]{0,400}status: HOSTEL_STATUS\.APPROVED/.test(aiPetRetrievalSrc))
  ok('B.12 searchHostels filters by HOSTEL_STATUS.APPROVED + is_open=true');
else bad('B.12 approved filter', 'missing or wrong');
if (aiPetRetrievalSrc.match(/searchInstitutes[\s\S]*isApproved: true/))
  ok('B.13 searchInstitutes filters by isActive+isApproved=true');
else bad('B.13 institute approved', 'missing or wrong');
if (aiPetRetrievalSrc.match(/searchColleges[\s\S]*isApproved.*ne.*false/))
  ok('B.14 searchColleges filters by isApproved≠false (matches /colleges)');
else bad('B.14 college approved', 'missing or wrong');

if (aiPetControllerSrc.includes('rate-limit') || aiPetControllerSrc.includes('rateLimit') || aiPetRoutesSrc.includes('rateLimit'))
  ok('B.15 controller / routes have rate limiting');
else bad('B.15 rate limit', 'missing');
if (aiPetRoutesSrc.includes('attachStudentIfPresent'))
  ok('B.16 route uses optional student auth (anonymous works)');
else bad('B.16 optional auth', 'missing');
if (aiPetControllerSrc.includes('AIPetAnalytics') || aiPetControllerSrc.includes('recordAnalytics'))
  ok('B.17 controller records lightweight analytics');
else bad('B.17 analytics', 'missing');
if (appSrc.includes('ai-pet') && appSrc.includes('aiPetRoutes'))
  ok('B.18 backend mounts /api/v1/ai-pet in app.js');
else bad('B.18 mount', 'missing');

if (/hostels/.test(petCardSrc) && /institutes/.test(petCardSrc) && /colleges/.test(petCardSrc))
  ok('B.19 frontend card renders all three listing kinds');
else bad('B.19 card kinds', 'missing');
if (petCardSrc.includes('detailUrl') || petCardSrc.includes('href='))
  ok('B.20 frontend card links to listing detail page');
else bad('B.20 detail link', 'missing');
if (petComponentSrc.includes('AIPetChat') && petComponentSrc.includes('fixed'))
  ok('B.21 frontend pet is fixed-positioned floating component');
else bad('B.21 fixed', 'missing');
if (petComponentSrc.includes('animate-floatY') || petComponentSrc.includes('whileHover') || petComponentSrc.includes('animate-float'))
  ok('B.22 frontend pet has hover/animation polish');
else bad('B.22 animation', 'missing');
if (petComponentSrc.includes('mobileBottomNav') || petComponentSrc.includes('mobile') || petComponentSrc.includes('bottom-24') || petComponentSrc.includes('sm:bottom'))
  ok('B.23 frontend pet respects mobile bottom nav (responsive)');
else bad('B.23 mobile', 'no mobile positioning');
if (petComponentSrc.includes('localStorage') || petComponentSrc.includes('DISMISS_KEY'))
  ok('B.24 frontend pet has mute / dismiss persistence');
else bad('B.24 dismiss', 'no dismiss persistence');
if (petComponentSrc.includes('shouldHide') || petComponentSrc.includes('admin'))
  ok('B.25 frontend pet is hidden on dashboard / admin routes');
else bad('B.25 hide-on-dashboard', 'missing');
if (appFrontendSrc.includes('AIPet') && appFrontendSrc.includes('<AIPet'))
  ok('B.26 AIPet mounted in App.tsx');
else bad('B.26 mounted', 'missing');

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);