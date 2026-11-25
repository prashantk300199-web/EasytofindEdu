/**
 * Regression check for the amenity key contract between the API and its
 * clients.
 *
 * Run: node scripts/checkAmenityAliases.mjs
 *
 * Verifies that:
 *  1. Legacy amenity spellings are accepted and rewritten to the canonical
 *     key (so an older/cached client bundle does not fail the registration).
 *  2. Genuinely unknown keys are still rejected (the API stays strict).
 */
import {
  createHostelSchema,
} from "../src/validators/hostel.validator.js";

const legacyPayload = {
  cleaning: ["6_days_week_cleaning", "5_days_week_cleaning"],
  common_amenities: [
    "wifi",
    "ro_water",
    "water_cooler",
    "6_days_week_cleaning",
    "common_tv",
  ],
  washroom_amenities: ["separate_bath_toilet", "geyser"],
  in_room_amenities: ["mattress", "ac"],
  utilities: ["wifi"],
  building_amenities: ["lift"],
  recreation: ["common_tv", "gym"],
};

const { error, value } = createHostelSchema.validate(legacyPayload, {
  abortEarly: false,
  stripUnknown: true,
  convert: true,
});

const amenityErrors = (error?.details ?? []).filter((d) =>
  /amenit|cleaning|recreation|utilities|building/i.test(d.path.join(".")),
);

let failed = false;

if (amenityErrors.length) {
  failed = true;
  console.error("FAIL: legacy amenity keys were rejected:");
  console.error(
    JSON.stringify(
      amenityErrors.map((d) => ({ path: d.path.join("."), msg: d.message })),
      null,
      2
    )
  );
} else {
  console.log("PASS: legacy amenity keys are accepted.");
}

const expected = {
  cleaning: ["6_days_in_a_week", "5_days_in_a_week"],
  washroom_amenities: ["separate_bath_and_toilet", "geyser"],
  recreation: ["tv_in_common_area", "gym"],
};

for (const [field, want] of Object.entries(expected)) {
  const got = value[field];
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed = true;
  console.log(
    `${ok ? "PASS" : "FAIL"}: ${field} -> ${JSON.stringify(got)}${ok ? "" : ` (expected ${JSON.stringify(want)})`}`
  );
}

// An unknown key must still fail validation.
const { error: badErr } = createHostelSchema.validate(
  { cleaning: ["not_a_real_amenity"] },
  { abortEarly: false, stripUnknown: true, convert: true }
);
const rejected = (badErr?.details ?? []).some((d) => d.path[0] === "cleaning");
if (!rejected) failed = true;
console.log(
  `${rejected ? "PASS" : "FAIL"}: an unknown amenity key is still rejected.`
);

process.exit(failed ? 1 : 0);
