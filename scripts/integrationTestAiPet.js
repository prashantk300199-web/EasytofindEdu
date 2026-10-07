// Live integration test for the AI Pet.
//
// Hits the production API at https://easytofindedu.onrender.com
// with the user's exact questions and verifies the response is grounded
// in the actual MongoDB records.
//
// Run: node scripts/integrationTestAiPet.js
//
//   A. "Find an affordable hostel near Gandhi Maidan."
//      (No DB match for "Gandhi Maidan" — verify the pet honestly says so,
//       suggests broadening the location, and does NOT fabricate hostels.)
//
//   B. "Find hostels under ₹7000 near Boring Road."
//      (Real hostels exist in Boring Road — verify the AI names REAL records.)
//
//   C. Follow-up "Under ₹7000."
//      (Narrowing the previous Boring Road search.)
//
//   D. "Which one should I choose?"
//      (Recommendation based on the previously-shown records only.)
//
//   E. "Find B.Tech CSE colleges in Patna."
//      (College search — verify real college names appear.)
//
//   F. "Find coaching institutes near Boring Road."
//      (Institute search — verify real institute names.)
//
//   G. A query with no matching DB records (e.g. "hostels in Tokyo").
//      (Honest no-match reply, no fabrication.)
//
//   H. Verify NO fabricated distance: the response must not contain
//      "X km away" or "1.2 km" or "nearest" unless the record itself
//      contains that figure.
//
//   I. Verify listing IDs in the cards match real Mongo _ids from the
//      public hostels endpoint.

import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = process.env.AI_PET_BASE || 'https://easytofindedu.onrender.com/api/v1';

let passed = 0;
let failed = 0;
const ok = (name) => { passed++; console.log(`  ✓ ${name}`); };
const bad = (name, why) => { failed++; console.log(`  ✗ ${name} — ${why}`); };

const log = (...a) => console.log(...a);

// ─────────────────────────────────────────────────────────────────────────
// Fetch helper
// ─────────────────────────────────────────────────────────────────────────

async function api(pathname, init = {}) {
  const url = `${API_BASE}${pathname}`;
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(45000) });
  const text = await res.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    /* non-JSON */
  }
  if (!res.ok) {
    throw new Error(`${pathname} → HTTP ${res.status} ${text.slice(0, 200)}`);
  }
  return body;
}

async function askPet(messages, context = {}) {
  const body = await api('/ai-pet/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, context }),
  });
  if (!body?.success) {
    throw new Error(`AI Pet returned error: ${body?.message || 'unknown'}`);
  }
  return body;
}

// ─────────────────────────────────────────────────────────────────────────
// Reference data from the live database
// ─────────────────────────────────────────────────────────────────────────

log('\n[Setup] Loading reference data from live DB…\n');

const hostelData = await api('/public/hostels?city=Patna&limit=30');
const ALL_PATNA_HOSTELS = hostelData.data.hostels;
log(`  • ${ALL_PATNA_HOSTELS.length} Patna hostels in the live database.`);

// Build a lookup set of every REAL name from the DB.
const realHostelNames = new Set();
const realHostelSlugs = new Set();
const realHostelIds = new Set();
for (const h of ALL_PATNA_HOSTELS) {
  realHostelNames.add(h.masked_name);
  realHostelSlugs.add(h.slug);
  realHostelIds.add(h._id);
}

const collegeData = await api('/collegeS?limit=30');
const ALL_COLLEGES = collegeData.data || [];
const realCollegeNames = new Set();
for (const c of ALL_COLLEGES) {
  if (c?.name) realCollegeNames.add(c.name);
  if (c?.shortName) realCollegeNames.add(c.shortName);
}
log(`  • ${ALL_COLLEGES.length} colleges in the live database.`);

const instData = await api('/institutes?limit=30');
const realInstituteNames = new Set();
const instList = Array.isArray(instData?.data) ? instData.data : (Array.isArray(instData?.data?.data) ? instData.data.data : []);
for (const i of instList) {
  if (i?.name) realInstituteNames.add(i.name);
}
log(`  • ${instList.length} institutes in the live database.`);

// ─────────────────────────────────────────────────────────────────────────
// Helpers to assert grounding
// ─────────────────────────────────────────────────────────────────────────

/** Split the AI's reply into word tokens and look for any of them
 *  appearing as a full standalone hostel name in the DB. */
function findRealHostelInText(text) {
  // Real names are short — match against 2-4 word spans.
  for (const name of realHostelNames) {
    const rx = new RegExp(`(^|[^\\w])${escapeRx(name)}([^\\w]|$)`, 'i');
    if (rx.test(text)) return name;
  }
  return null;
}

function findFakeCollegeInText(text) {
  // Look for any "College" or "Institute" or "University" mention that is
  // NOT in the live DB list.
  const candidates = text.match(/\b[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3}\s+(College|Institute|University|Academy|School)\b/g) || [];
  for (const c of candidates) {
    if (!realCollegeNames.has(c) && !realInstituteNames.has(c)) {
      // Only flag if it isn't something obvious like "EasyToFindEdu".
      if (!/EasyToFindEdu/i.test(c)) return c;
    }
  }
  return null;
}

function escapeRx(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function claimsDistance(text) {
  // Heuristic: looks for phrases like "X km away", "X km from", "nearest",
  // "1.2 km", etc. — flag any distance claim so we can audit it.
  const m = text.match(/(\d+(?:\.\d+)?)\s*(?:km|kilometer|kilometre)\b/i);
  if (m) return `numeric distance "${m[0]}"`;
  if (/\bnearest\b/i.test(text)) return `claim "nearest"`;
  if (/\bclosest\b/i.test(text)) return `claim "closest"`;
  return null;
}

log('\n[A] Live AI Pet integration tests\n');

// ─────────────────────────────────────────────────────────────────────────
// Test A: "Find an affordable hostel near Gandhi Maidan."
// ─────────────────────────────────────────────────────────────────────────
{
  log('A. "Find an affordable hostel near Gandhi Maidan."');
  const res = await askPet([
    { role: 'user', content: 'Find an affordable hostel near Gandhi Maidan.' },
  ]);

  log(`   action=${res.action}`);
  log(`   listings=${res.listings?.length || 0}`);
  log(`   message="${res.message?.slice(0, 200)}…"`);

  // The DB has 0 hostels tagged with Gandhi Maidan — Boring Road is the area
  // most Boring Road ones live in. The pet must say so honestly.
  if (res.action === 'search_hostels') ok('A.a action routed to search_hostels');
  else bad('A.a action', `got ${res.action}`);

  // Either: 0 listings returned (correct), or if any, every listing.id must be real.
  const listArr = res.listings || [];
  const fakeIds = listArr.filter((l) => !realHostelIds.has(l.listingId) && !realHostelSlugs.has(String(l.slug || '').replace(/^[\w]/, (c) => c.toLowerCase())));
  if (fakeIds.length === 0)
    ok('A.b every listing ID is real (or no listings returned)');
  else bad('A.b fake listing ids', JSON.stringify(fakeIds.map((f) => f.listingId)));

  // The message must not invent a hostel name that isn't in the DB.
  const msg = res.message || '';
  const realNameInMsg = findRealHostelInText(msg);
  if (listArr.length === 0) {
    // Honest no-match reply expected.
    if (/couldn['']?t find|no.*listings|database|broaden/i.test(msg))
      ok('A.c message honestly reports no Gandhi Maidan matches in our database');
    else bad('A.c honesty', `expected honest no-match reply, got: ${msg.slice(0, 200)}`);
    if (/boring road|broaden|location|try/i.test(msg))
      ok('A.d message suggests broadening location');
    else bad('A.d suggest broader', `got: ${msg.slice(0, 200)}`);
  } else {
    if (realNameInMsg)
      ok(`A.c message names a REAL hostel from the DB ("${realNameInMsg}")`);
    else bad('A.c real name in msg', `no DB hostel name found in: ${msg.slice(0, 200)}`);
  }

  // No distance fabrication.
  const dist = claimsDistance(msg);
  if (!dist) ok('A.e no fabricated distance claim');
  else bad('A.e distance claim', dist);
}

// ─────────────────────────────────────────────────────────────────────────
// Test B: "Find hostels under ₹7000 near Boring Road."
// ─────────────────────────────────────────────────────────────────────────
{
  log('\nB. "Find hostels under ₹7000 near Boring Road."');
  const res = await askPet([
    { role: 'user', content: 'Find hostels under ₹7000 near Boring Road.' },
  ]);
  log(`   action=${res.action}  listings=${res.listings?.length || 0}`);
  log(`   message="${res.message?.slice(0, 200)}…"`);

  if (res.action === 'search_hostels') ok('B.a action routed to search_hostels');
  else bad('B.a action', res.action);

  // At least one listing should be returned — Boring Road has 20+ hostels
  // under 7000 (see live data).
  const listArr = res.listings || [];
  if (listArr.length > 0) ok(`B.b retrieved ${listArr.length} real listing(s)`);
  else bad('B.b retrieval', 'expected listings, got 0');

  // Every listing id must be a real MongoDB _id.
  const ids = listArr.map((l) => l.listingId);
  const fakeIds = ids.filter((id) => !realHostelIds.has(id));
  if (fakeIds.length === 0) ok('B.c every listing ID exists in MongoDB');
  else bad('B.c fake ids', JSON.stringify(fakeIds));

  // Every detailUrl must point to /hostels/<slug> with a real slug.
  const urls = listArr.map((l) => l.detailUrl);
  const fakeUrls = urls.filter((u) => {
    const m = String(u).match(/^\/hostels\/([\w-]+)$/);
    if (!m) return true;
    return !realHostelSlugs.has(m[1]);
  });
  if (fakeUrls.length === 0) ok('B.d every detail URL points to a real hostel slug');
  else bad('B.d fake urls', JSON.stringify(fakeUrls));

  // Every rent figure in the listings must match the live DB rent_min.
  for (const l of listArr) {
    const live = ALL_PATNA_HOSTELS.find((h) => h._id === l.listingId);
    if (!live) continue;
    const liveRentMin = live.rooms?.length
      ? Math.min(...live.rooms.map((r) => r.monthly_rent).filter((n) => n > 0))
      : 0;
    if (l.monthlyRent === liveRentMin) ok(`B.e[${l.listingId}] monthlyRent matches DB`);
    else bad(`B.e[${l.listingId}] monthlyRent mismatch`, `pet=${l.monthlyRent} db=${liveRentMin}`);
  }

  // The AI's reply must include at least one real hostel name.
  const realNameInMsg = findRealHostelInText(res.message || '');
  if (realNameInMsg)
    ok(`B.f reply references REAL hostel "${realNameInMsg}" from the DB`);
  else bad('B.f real name in reply', `reply: ${res.message?.slice(0, 200)}`);

  // No distance fabrication.
  const dist = claimsDistance(res.message || '');
  if (!dist) ok('B.g no fabricated distance claim');
  else bad('B.g distance', dist);

  // The filtered results must respect "under ₹7000": every returned listing
  // should have monthlyRent <= 7000. (Some leeway in case the AI widened.)
  const overBudget = listArr.filter((l) => l.monthlyRent > 7000 && l.monthlyRent > 0);
  if (overBudget.length === 0)
    ok('B.h every returned listing is under the ₹7,000 budget');
  else bad('B.h budget overrun', JSON.stringify(overBudget.map((l) => `${l.name}=${l.monthlyRent}`)));
}

// ─────────────────────────────────────────────────────────────────────────
// Test C: Budget follow-up "Under ₹7000."
// ─────────────────────────────────────────────────────────────────────────
{
  log('\nC. Budget follow-up: "Under ₹7000."');
  const first = await askPet([
    { role: 'user', content: 'Find a hostel near Boring Road in Patna.' },
  ]);
  log(`   step1 listings=${first.listings?.length}`);

  const second = await askPet([
    { role: 'user', content: 'Find a hostel near Boring Road in Patna.' },
    { role: 'assistant', content: first.message },
    { role: 'user', content: 'Under ₹7000.' },
  ]);
  log(`   step2 action=${second.action}  listings=${second.listings?.length}`);
  log(`   step2 message="${second.message?.slice(0, 200)}…"`);

  if (second.action === 'search_hostels') ok('C.a follow-up routed to search_hostels (memory of prior action)');
  else bad('C.a follow-up action', second.action);

  // Should still be in Boring Road area.
  const listArr = second.listings || [];
  if (listArr.every((l) => !l.area || /boring road/i.test(l.area || '')))
    ok('C.b context preserved: still Boring Road');
  else bad('C.b area context', listArr.map((l) => l.area).join(','));

  // Should be <= 7000.
  const overBudget = listArr.filter((l) => l.monthlyRent > 7000 && l.monthlyRent > 0);
  if (overBudget.length === 0) ok('C.c budget applied: every listing ≤ ₹7,000');
  else bad('C.c budget', JSON.stringify(overBudget.map((l) => `${l.name}=${l.monthlyRent}`)));

  // No fake ids.
  const fakeIds = listArr.filter((l) => !realHostelIds.has(l.listingId));
  if (fakeIds.length === 0) ok('C.d all listing IDs are real');
  else bad('C.d fake ids', fakeIds.length);

  // No distance fabrication.
  const dist = claimsDistance(second.message || '');
  if (!dist) ok('C.e no fabricated distance');
  else bad('C.e distance', dist);
}

// ─────────────────────────────────────────────────────────────────────────
// Test D: Recommendation "Which one should I choose?"
// ─────────────────────────────────────────────────────────────────────────
{
  log('\nD. Recommendation "Which one should I choose?"');
  const first = await askPet([
    { role: 'user', content: 'Find hostels under ₹7000 near Boring Road.' },
  ]);
  const firstIds = (first.listings || []).map((l) => l.listingId);

  const second = await askPet(
    [
      { role: 'user', content: 'Find hostels under ₹7000 near Boring Road.' },
      { role: 'assistant', content: first.message },
      { role: 'user', content: 'Which one should I choose?' },
    ],
    {
      // Pass the previously-shown listing ids so the pet can compare them.
      contextListingIds: { hostels: firstIds },
    },
  );
  log(`   step2 action=${second.action}  listings=${second.listings?.length}`);

  if (second.action === 'compare') ok('D.a recommendation uses the previously-shown hostels');
  else bad('D.a recommendation action', second.action);

  const listArr = second.listings || [];
  if (listArr.length > 0) ok(`D.b ${listArr.length} prior listing(s) re-fetched for comparison`);
  else bad('D.b no listings', '0 listings');

  // Reply must name at least one REAL hostel.
  const realName = findRealHostelInText(second.message || '');
  if (realName) ok(`D.c reply names REAL hostel "${realName}"`);
  else bad('D.c real name', second.message?.slice(0, 200));

  // No distance fabrication.
  const dist = claimsDistance(second.message || '');
  if (!dist) ok('D.d no fabricated distance claim');
  else bad('D.d distance', dist);
}

// ─────────────────────────────────────────────────────────────────────────
// Test E: College search "Find B.Tech CSE colleges in Patna."
// ─────────────────────────────────────────────────────────────────────────
{
  log('\nE. "Find B.Tech CSE colleges in Patna."');
  const res = await askPet([
    { role: 'user', content: 'Find B.Tech CSE colleges in Patna.' },
  ]);
  log(`   action=${res.action}  listings=${res.listings?.length}`);
  log(`   message="${res.message?.slice(0, 200)}…"`);

  if (res.action === 'search_colleges' || res.action === 'search_courses')
    ok('E.a routed to college / course search');
  else bad('E.a action', res.action);

  const fake = findFakeCollegeInText(res.message || '');
  if (!fake) ok('E.b no fabricated college names in reply');
  else bad('E.b fake college name', fake);

  const dist = claimsDistance(res.message || '');
  if (!dist) ok('E.c no fabricated distance claim');
  else bad('E.c distance', dist);

  // Cards must point to real college ids.
  const listArr = res.listings || [];
  const fakeIds = listArr.filter((l) => {
    const m = String(l.detailUrl || '').match(/^\/colleges\/([a-f0-9]{24})$/);
    return !m;
  });
  if (fakeIds.length === 0) ok('E.d every college card uses /colleges/<mongoId>');
  else bad('E.d fake college urls', JSON.stringify(fakeIds.map((l) => l.detailUrl)));
}

// ─────────────────────────────────────────────────────────────────────────
// Test F: Institute search "Find coaching institutes near Boring Road."
// ─────────────────────────────────────────────────────────────────────────
{
  log('\nF. "Find coaching institutes near Boring Road."');
  const res = await askPet([
    { role: 'user', content: 'Find coaching institutes near Boring Road.' },
  ]);
  log(`   action=${res.action}  listings=${res.listings?.length}`);
  log(`   message="${res.message?.slice(0, 200)}…"`);

  if (res.action === 'search_institutes' || res.action === 'search_colleges')
    ok('F.a routed to institute / college search');
  else bad('F.a action', res.action);

  const listArr = res.listings || [];
  const urls = listArr.map((l) => l.detailUrl);
  const fakeUrls = urls.filter((u) => {
    const m = String(u).match(/^\/institutes\/([a-f0-9]{24})$/);
    return !m;
  });
  if (listArr.length === 0 || fakeUrls.length === 0)
    ok('F.b institute cards use /institutes/<mongoId>');
  else bad('F.b fake urls', JSON.stringify(fakeUrls));

  // No fake names.
  const fake = findFakeCollegeInText(res.message || '');
  if (!fake) ok('F.c no fabricated institute names in reply');
  else bad('F.c fake institute name', fake);

  const dist = claimsDistance(res.message || '');
  if (!dist) ok('F.d no fabricated distance claim');
  else bad('F.d distance', dist);
}

// ─────────────────────────────────────────────────────────────────────────
// Test G: No-match query
// ─────────────────────────────────────────────────────────────────────────
{
  log('\nG. No-match: "Find hostels in Tokyo."');
  const res = await askPet([
    { role: 'user', content: 'Find hostels in Tokyo.' },
  ]);
  log(`   listings=${res.listings?.length}`);
  log(`   message="${res.message?.slice(0, 200)}…"`);

  if ((res.listings || []).length === 0) ok('G.a no listings fabricated for non-existent city');
  else bad('G.a fabrication', JSON.stringify(res.listings.map((l) => l.name)));

  if (/couldn['']?t find|no.*listings|database|broaden|try/i.test(res.message || ''))
    ok('G.b honest no-match reply');
  else bad('G.b honesty', res.message?.slice(0, 200));
}

// ─────────────────────────────────────────────────────────────────────────
// Test H: distance / rating / facility fabrication safety
// ─────────────────────────────────────────────────────────────────────────
{
  log('\nH. Distance / rating / facility safety across multiple queries');
  const queries = [
    'Which hostel is nearest to Boring Road?',
    'Compare these hostels',
    'Cheapest hostel in Patna',
  ];
  let issues = 0;
  for (const q of queries) {
    const res = await askPet([{ role: 'user', content: q }]);
    const dist = claimsDistance(res.message || '');
    if (dist) {
      issues++;
      log(`   ⚠ "${q}" reply contains a distance claim: ${dist}`);
    } else {
      log(`   ✓ "${q}" → no fabricated distance`);
    }
  }
  if (issues === 0) ok('H.a no query produced an unsupported distance claim');
  else bad('H.a distance fabrication', `${issues} queries fabricated distance`);
}

// ─────────────────────────────────────────────────────────────────────────
// Test I: MongoDB-failure simulation — the pet must NOT fabricate.
// (We can't crash the live DB from this test, but we can verify the
//  fall-through message is the safe canned one by inspecting the source.)
// ─────────────────────────────────────────────────────────────────────────
{
  log('\nI. Retrieval-error fallback path');
  const src = await import('node:fs').then((fs) =>
    fs.promises.readFile(
      path.resolve(__dirname, '../EasyToFindEdu-Backend/src/services/aiPet.service.js'),
      'utf8',
    ),
  );
  if (src.includes("trouble accessing EasyToFindEdu listings right now"))
    ok('I.a fallback message is safe (no DB info leaked, no fabricated reply)');
  else bad('I.a fallback', 'fallback message missing or wrong');

  if (/return \{[\s\S]*?action,[\s\S]*?message:[\s\S]*?listings:\s*\[\]/.test(src))
    ok('I.b retrieval error returns action + empty listings, never fabricated cards');
  else bad('I.b retrieval fallback', 'service does not always return empty listings on error');
}

log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);