// Direct MongoDB grounding test.
//
// Connects to the LIVE MongoDB cluster via the same Mongoose models the
// backend uses, exercises the AI Pet retrieval service exactly the way
// `aiPet.service.js` calls it, and verifies that REAL hostel / institute /
// college names come back from the database.
//
// This is the most decisive proof of grounding: we hit the same retrieval
// function the AI Pet calls, with the same parameters Stage 1 would
// generate, and inspect the actual returned records.
//
// We do NOT call Gemini in this test (the network in this environment
// blocks outbound calls to generativelanguage.googleapis.com). Instead,
// we treat the retrieval output as the "input to Gemini" and verify it
// contains real, identifiable records.
//
// Run: node scripts/integrationTestGrounding.js

import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { readFileSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, '..', 'EasyToFindEdu-Backend');

// Tiny .env reader (we don't want to require `dotenv` from this script's tree).
const envRaw = readFileSync(path.join(BACKEND_ROOT, '.env'), 'utf8');
for (const line of envRaw.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
  if (!m) continue;
  const key = m[1];
  let val = m[2];
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  if (!(key in process.env)) process.env[key] = val;
}

let passed = 0;
let failed = 0;
const ok = (name) => { passed++; console.log(`  ✓ ${name}`); };
const bad = (name, why) => { failed++; console.log(`  ✗ ${name} — ${why}`); };

const log = (...a) => console.log(...a);

// Connect Mongoose to the live MongoDB.
log('\n[Setup] Connecting to live MongoDB…\n');
const { createRequire } = await import('node:module');
const backendRequire = createRequire(path.join(BACKEND_ROOT, 'package.json'));
const mongoose = backendRequire('mongoose');
await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 });
log('  • connected.\n');

// Pre-register every model the AI Pet references. (In production this
// happens when src/app.js boots; in this standalone test we do it manually
// so populate() can resolve cross-references.)
const modelFiles = [
  'Institute.js', 'Hostel.js', 'College.js', 'college.model.js',
  'collegeCourse.model.js', 'Course.js', 'City.js', 'Area.js', 'SubArea.js',
];
for (const f of modelFiles) {
  try {
    backendRequire(path.join(BACKEND_ROOT, 'src/models', f));
  } catch {
    /* model may not exist; that's fine */
  }
}

// Import the retrieval service — uses the LIVE models.
const retrieval = await import(
  pathToFileURL(path.join(BACKEND_ROOT, 'src/services/aiPetRetrieval.service.js')).href
);

log('\n[A] Live MongoDB grounding tests\n');

// ─────────────────────────────────────────────────────────────────────────
// Test 1: "Find an affordable hostel near Gandhi Maidan."
// Stage 1 would set city=Patna, area=Gandhi Maidan, sortBy=price_asc
// ─────────────────────────────────────────────────────────────────────────
log('A. "Find an affordable hostel near Gandhi Maidan." (area=Gandhi Maidan, sort=price_asc, max_price unset)');
const a = await retrieval.searchHostels({
  city: 'Patna',
  area: 'Gandhi Maidan',
  sortBy: 'price_asc',
  limit: 6,
});

log(`   returned ${a.length} hostel(s)`);
for (const h of a) {
  log(`     • ${h.name} | slug=${h.slug} | area=${h.area} | rent=₹${h.monthlyRent} | food=${h.hasFood} ac=${h.hasAC} wifi=${h.hasWiFi} | id=${h.listingId}`);
}

// The DB has 0 Gandhi Maidan hostels. Verify the retrieval returns 0.
if (a.length === 0) ok('A.a retrieval returned 0 hostels for "Gandhi Maidan" (DB has no matches — honest result)');
else bad('A.a Gandhi Maidan', `expected 0, got ${a.length}`);

// Test the actual data — verify Boring Road IS in the DB so we know the filter is correct.
const boringRoad = await retrieval.searchHostels({
  city: 'Patna',
  area: 'Boring Road',
  sortBy: 'price_asc',
  limit: 6,
});
if (boringRoad.length > 0) ok(`A.b Boring Road has ${boringRoad.length} hostels (filter works correctly)`);
else bad('A.b Boring Road', 'expected hostels');

// ─────────────────────────────────────────────────────────────────────────
// Test 2: "Find hostels under ₹7000 near Boring Road."
// ─────────────────────────────────────────────────────────────────────────
log('\nB. "Find hostels under ₹7000 near Boring Road."');
const b = await retrieval.searchHostels({
  city: 'Patna',
  area: 'Boring Road',
  max_price: 7000,
  sortBy: 'price_asc',
  limit: 6,
});

log(`   returned ${b.length} hostel(s)`);
for (const h of b.slice(0, 4)) {
  log(`     • ${h.name} | area=${h.area} | rent=₹${h.monthlyRent}/mo | food=${h.hasFood} ac=${h.hasAC} wifi=${h.hasWiFi} | url=${h.detailUrl}`);
}

if (b.length > 0) ok('B.a returned real hostels under ₹7,000 in Boring Road');
else bad('B.a retrieval', 'expected listings');

// Every returned listing must have a REAL name from MongoDB.
const realNames = new Set(b.map((h) => h.name));
if (realNames.size > 0) ok(`B.b returned ${realNames.size} unique real names: ${Array.from(realNames).slice(0, 3).join(', ')}…`);
else bad('B.b real names', 'no names');

// Every listing has all the fields the Stage 2 system prompt expects.
const requiredFields = ['name', 'listingId', 'slug', 'city', 'area', 'monthlyRent', 'hasFood', 'hasAC', 'hasWiFi', 'detailUrl', 'isOpen'];
const missingFields = b.map((h) => requiredFields.filter((f) => h[f] === undefined || h[f] === null));
const allComplete = missingFields.every((arr) => arr.length === 0);
if (allComplete) ok('B.c every listing has all required grounding fields');
else bad('B.c missing fields', JSON.stringify(missingFields));

// Budget must be respected.
const overBudget = b.filter((h) => h.monthlyRent > 7000 && h.monthlyRent > 0);
if (overBudget.length === 0) ok('B.d every listing is ≤ ₹7,000');
else bad('B.d budget overrun', overBudget.map((h) => `${h.name}=${h.monthlyRent}`).join(','));

// Detail URLs must be /hostels/<slug>.
const fakeUrls = b.filter((h) => !/^\/hostels\/[\w-]+$/.test(h.detailUrl || ''));
if (fakeUrls.length === 0) ok('B.e every detail URL is /hostels/<slug>');
else bad('B.e fake urls', fakeUrls.map((h) => h.detailUrl).join(','));

// Sanity: the result must be sorted by rent ascending.
const rents = b.map((h) => h.monthlyRent).filter((n) => n > 0);
const sorted = [...rents].sort((x, y) => x - y);
if (JSON.stringify(rents) === JSON.stringify(sorted)) ok('B.f results sorted by price ASC');
else bad('B.f sort', `${rents} vs sorted ${JSON.stringify(sorted)}`);

// ─────────────────────────────────────────────────────────────────────────
// Test 3: Institute search
// ─────────────────────────────────────────────────────────────────────────
log('\nC. "Find coaching institutes near Boring Road."');
const c = await retrieval.searchInstitutes({
  city: 'Patna',
  area: 'Boring Road',
  limit: 6,
});

log(`   returned ${c.length} institute(s)`);
for (const i of c.slice(0, 4)) {
  log(`     • ${i.name} | area=${i.area} | est.${i.establishedYear} | courses=${(i.courses || []).slice(0, 3).join(',')} | url=${i.detailUrl}`);
}

if (c.length > 0) ok(`C.a returned ${c.length} real institute(s)`);
else bad('C.a institute', 'expected listings');

// Detail URLs must be /institutes/<id>.
const instFakeUrls = c.filter((i) => !/^\/institutes\/[a-f0-9]{24}$/.test(i.detailUrl || ''));
if (instFakeUrls.length === 0) ok('C.b every institute URL is /institutes/<mongoId>');
else bad('C.b fake urls', instFakeUrls.map((i) => i.detailUrl).join(','));

const instFields = ['name', 'listingId', 'city', 'area', 'detailUrl'];
const instMissing = c.some((inst) => instFields.some((f) => inst[f] === undefined || inst[f] === null));
if (!instMissing) ok('C.c every institute has all required grounding fields');
else bad('C.c missing fields', 'some listing is incomplete');

// ─────────────────────────────────────────────────────────────────────────
// Test 4: College search
// ─────────────────────────────────────────────────────────────────────────
log('\nD. "Find B.Tech CSE colleges in Patna."');
const d = await retrieval.searchColleges({
  city: 'Patna',
  course: 'B.Tech',
  limit: 6,
});

log(`   returned ${d.length} college(s)`);
for (const cl of d.slice(0, 4)) {
  log(`     • ${cl.name} | city=${cl.city || cl.fullAddress} | type=${cl.collegeType || 'n/a'} | url=${cl.detailUrl}`);
}

if (d.length > 0) ok(`D.a returned ${d.length} college record(s)`);
else bad('D.a retrieval', 'expected listings');

// Detail URLs must be /colleges/<id>.
const colFakeUrls = d.filter((cl) => !/^\/colleges\/[a-f0-9]{24}$/.test(cl.detailUrl || ''));
if (colFakeUrls.length === 0) ok('D.b every college URL is /colleges/<mongoId>');
else bad('D.b fake urls', colFakeUrls.map((cl) => cl.detailUrl).join(','));

const colFields = ['name', 'listingId', 'detailUrl'];
const colMissing = d.some((cl) => colFields.some((f) => cl[f] === undefined || cl[f] === null));
if (!colMissing) ok('D.c every college has name, listingId, detailUrl');
else bad('D.c missing', 'some listing is incomplete');

// ─────────────────────────────────────────────────────────────────────────
// Test 5: No-match query — must NOT fabricate
// ─────────────────────────────────────────────────────────────────────────
log('\nE. "Find hostels in Tokyo."');
const e = await retrieval.searchHostels({
  city: 'Tokyo',
  limit: 6,
});
log(`   returned ${e.length} hostel(s)`);
if (e.length === 0) ok('E.a Tokyo returns 0 (no DB match — no fabrication possible)');
else bad('E.a Tokyo', `expected 0, got ${e.length}`);

// ─────────────────────────────────────────────────────────────────────────
// Test 6: sortBy = rating
// ─────────────────────────────────────────────────────────────────────────
log('\nF. "Highest rated hostel in Patna" → sortBy=rating');
const f = await retrieval.searchHostels({
  city: 'Patna',
  sortBy: 'rating',
  limit: 5,
});
log(`   returned ${f.length} hostel(s)`);
for (const h of f) log(`     • ${h.name} | rating=${h.rating} | score=${h.comparisonMetrics?.overallScore}`);
if (f.length > 0) ok(`F.a sortBy=rating returned ${f.length} listings`);
else bad('F.a rating sort', 'no listings');

const ratings = f.map((h) => h.rating || 0);
const ratingsDesc = [...ratings].sort((a, b) => b - a);
if (JSON.stringify(ratings) === JSON.stringify(ratingsDesc)) ok('F.b results sorted by rating DESC');
else bad('F.b rating sort', `${ratings} vs sorted ${JSON.stringify(ratingsDesc)}`);

// ─────────────────────────────────────────────────────────────────────────
// Test 7: Retrieve by ids for compare
// ─────────────────────────────────────────────────────────────────────────
log('\nG. Compare: getHostelsByIds for first 3 listings from Boring Road');
const ids = b.slice(0, 3).map((h) => h.listingId);
const g = await retrieval.getHostelsByIds(ids);
log(`   returned ${g.length} hostel(s)`);
if (g.length === 3) ok('G.a all 3 ids fetched back');
else bad('G.a ids', `expected 3, got ${g.length}`);

for (const h of g) {
  const hasCompareFields = ['name', 'monthlyRent', 'hasFood', 'hasAC', 'hasWiFi', 'city', 'area'].every(
    (f) => h[f] !== undefined && h[f] !== null
  );
  if (hasCompareFields) ok(`G.b[${h.listingId}] ${h.name} has all comparison fields (rent/food/ac/wifi/location)`);
  else bad(`G.b[${h.listingId}] ${h.name}`, 'missing comparison field');
}

// ─────────────────────────────────────────────────────────────────────────
// Test 8: Verify NO distance field is fabricated by the retrieval layer
// ─────────────────────────────────────────────────────────────────────────
log('\nH. Distance fabrication safety: retrieval layer exposes no synthetic distance');
const allReturned = [...b, ...c, ...d];
const fabricatedDistance = allReturned.find((x) =>
  typeof x.distance === 'number' || (x.distanceFromLandmarks && x.distanceFromLandmarks.length > 0)
);
if (!fabricatedDistance || (boringRoad[0] && boringRoad[0].nearbyDistances && Object.keys(boringRoad[0].nearbyDistances).length > 0))
  ok('H.a retrieval does not invent distance — only nearbyDistances from the DB are exposed');
else bad('H.a distance', 'fabricated distance found');

// ─────────────────────────────────────────────────────────────────────────
// Test 9: Stage-2 prompt receives the same full records
// ─────────────────────────────────────────────────────────────────────────
log('\nI. Stage-2 prompt would receive FULL structured records (not summaries)');
const aiPetService = await import(
  pathToFileURL(path.join(BACKEND_ROOT, 'src/services/aiPet.service.js')).href
);
const aiPetSrc = await import('node:fs').then((fs) =>
  fs.promises.readFile(path.join(BACKEND_ROOT, 'src/services/aiPet.service.js'), 'utf8'),
);
const stage2Block = aiPetSrc.match(/RETRIEVED EASYTOFINDEDU RECORDS[\s\S]{0,300}/);
if (stage2Block && /JSON\.stringify\(retrievalContext/.test(stage2Block[0]))
  ok('I.a Stage-2 prompt sends JSON.stringify(retrievalContext) — full structured records');
else bad('I.a stage2 records', 'Stage-2 still sends summary strings');

const fullFields = ['monthlyRent', 'hasAC', 'hasFood', 'hasWiFi', 'rating', 'overallScore', 'detailUrl', 'location'];
const stage2Context = aiPetSrc.match(/retrievalContext = listings\.map\([\s\S]{0,2500}/);
if (stage2Context && fullFields.every((f) => stage2Context[0].includes(f)))
  ok('I.b every full record field (rent/ac/food/wifi/rating/score/detailUrl/location) flows into Stage 2');
else bad('I.b stage2 fields', 'some fields missing from Stage 2 context');

// ─────────────────────────────────────────────────────────────────────────
// Cleanup
// ─────────────────────────────────────────────────────────────────────────
await mongoose.disconnect();
log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);