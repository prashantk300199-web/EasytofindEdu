/**
 * Regression check for the hostel create/update payload contract.
 *
 * Run: node scripts/checkHostelSchema.mjs
 *
 * The Joi schema and the Mongoose model are two separate definitions of
 * "what a valid hostel looks like". A payload can pass Joi and still be
 * rejected by the model on save - and because that rejection used to be
 * caught by a generic catch block, the owner only ever saw a 500 with no
 * clue which field was wrong.
 *
 * This script runs the field combinations the registration form can
 * produce through both layers and fails if any of them is rejected.
 */
import mongoose from "mongoose";
import Hostel from "../src/models/Hostel.js";
import { createHostelSchema } from "../src/validators/hostel.validator.js";

/** Mirrors the payload the "Add New Hostel" form submits. */
const base = {
  name: "Test Hostel",
  description: "A test hostel",
  hostel_type: "boys",
  address: {
    line1: "12 Test Street",
    line2: "",
    area: "Patna",
    subarea: "", // the form's default: the owner did not pick a subarea
    pincode: "800001",
    city: "Patna",
    state: "Bihar",
  },
  location: { type: "Point", coordinates: null },
  rent: { security_deposit_type: "one_month_fee", registration_fee: 0 },
  rooms: [
    {
      room_type: "single_sharing_wall",
      total_beds: 10,
      available_beds_count: 10,
      monthly_rent: 5000,
      is_available: true,
      ac: false,
    },
  ],
  meal_plans: [
    { frequency: "3_times", meal_type: "veg", service_type: "in_house_kitchen" },
  ],
  contact_info: {
    phone: "9876543210",
    alternative_phone: "",
    additional_phones: [],
    email: "owner@example.com",
    owner_name: "Test Owner",
    owner_age: "40",
    owner_gender: "male",
  },
  warden: {
    name: "Test Warden",
    contact_number: "9876543211",
    alternative_contact: "",
    additional_contacts: [],
    email: "warden@example.com",
    gender: "male",
    age: "35",
  },
  in_room_amenities: [],
  washroom_amenities: [],
  utilities: [],
  cleaning: [],
  building_amenities: [],
  common_amenities: [],
  recreation: [],
  nearby_distances: { institutes: [], landmarks: [] },
};

let failed = false;

/** Runs one payload through Joi and then the Mongoose model. */
function check(label, payload) {
  const { error, value } = createHostelSchema.validate(payload, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });
  if (error) {
    failed = true;
    console.error(`FAIL ${label}`);
    for (const d of error.details) {
      console.error(`       joi:   ${d.path.join(".")}: ${d.message.slice(0, 100)}`);
    }
    return;
  }

  const doc = new Hostel({ ...value, owner: new mongoose.Types.ObjectId() });
  const syncErr = doc.validateSync();
  if (syncErr) {
    failed = true;
    console.error(`FAIL ${label}`);
    for (const [path, err] of Object.entries(syncErr.errors)) {
      console.error(`       model: ${path}: ${err.message}`);
    }
    return;
  }
  console.log(`PASS ${label}`);
}

// The owner's actual options.
check("owner skipped the subarea", base);
check(
  "owner picked a subarea",
  { ...base, address: { ...base.address, subarea: "Boring Road" } }
);
check(
  "owner picked a map location",
  { ...base, location: { type: "Point", coordinates: [85.1376, 25.5941] } }
);
check("no meal plans", { ...base, meal_plans: [] });
check("nearby distances filled in", {
  ...base,
  nearby_distances: {
    institutes: [{ name: "ABC College", distance_km: 1.5 }],
    landmarks: [{ name: "Bus Stop", distance_km: 0.2 }],
  },
});

// Every value the form offers for a field with a fixed set of options.
for (const deposit of [
  "one_month_fee",
  "two_month_fee",
  "15_day_fee",
  "no_deposit",
]) {
  check(`deposit type ${deposit}`, {
    ...base,
    rent: { ...base.rent, security_deposit_type: deposit },
  });
}

for (const flooring of ["tiles", "marble", "granite", "mosaic", "plaster"]) {
  check(`flooring type ${flooring}`, {
    ...base,
    building_details: { ...base.building_details, flooring_type: flooring },
  });
}

for (const policy of [
  "family_only",
  "friends_only",
  "both_allowed",
  "no_one_allowed",
]) {
  check(`guest policy ${policy}`, {
    ...base,
    rules: { ...base.rules, guest_policy: policy },
  });
}

process.exit(failed ? 1 : 0);
