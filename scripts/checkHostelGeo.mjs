/**
 * Regression check for the hostel save path, against a real MongoDB with
 * the model's real indexes.
 *
 * Run: npm i -D mongodb-memory-server && node scripts/checkHostelGeo.mjs
 *
 * The 2dsphere index on `location` rejects a document whose geo field is
 * present but has no usable coordinates - MongoDB fails the write with
 * "Can't extract geo keys: ... Point must be an array or object". That
 * made every registration without a map pin fail with a 500.
 *
 * mongodb-memory-server is not a dependency of this project (it downloads a
 * MongoDB binary, which would slow down every install), so this script
 * skips itself when the package is not present.
 */
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);

let MongoMemoryServer;
try {
  ({ MongoMemoryServer } = await import("mongodb-memory-server"));
} catch {
  console.log(
    "SKIP: mongodb-memory-server is not installed.\n" +
      "      npm i -D mongodb-memory-server && node scripts/checkHostelGeo.mjs"
  );
  process.exit(0);
}

const mongoose = require("mongoose");
const { default: Hostel } = await import(
  pathToFileURL(
    fileURLToPath(new URL("../src/models/Hostel.js", import.meta.url))
  ).href
);

const mongod = await MongoMemoryServer.create();
await mongoose.connect(mongod.getUri("etf-test"));
await Hostel.syncIndexes();

let failed = false;
let n = 0;

/** Saves a hostel and reports what ended up in the `location` field. */
async function expectSave(label, location) {
  n += 1;
  const doc = new Hostel({
    name: "Test Hostel",
    description: "A test hostel",
    hostel_type: "boys",
    address: {
      line1: "12 Test Street",
      area: "Patna",
      subarea: "",
      pincode: "800001",
      city: "Patna",
      state: "Bihar",
    },
    location,
    rent: { security_deposit_type: "one_month_fee", registration_fee: 0 },
    rooms: [
      {
        room_type: "single_sharing_wall",
        total_beds: 10,
        monthly_rent: 5000,
        is_available: true,
      },
    ],
    owner: new mongoose.Types.ObjectId(),
    slug: `slug-${n}-${Date.now()}`,
    photos: [{ url: "https://example.com/a.jpg", publicId: "p/a" }],
  });

  try {
    await doc.save();
    const raw = await Hostel.collection.findOne({ _id: doc._id });
    const stored = raw.location === undefined ? "(absent)" : JSON.stringify(raw.location);
    console.log(`PASS ${label} -> location ${stored}`);
    return doc;
  } catch (err) {
    failed = true;
    console.error(`FAIL ${label}`);
    console.error(`     ${err.name}: ${err.message.split("\n")[0].slice(0, 160)}`);
    return null;
  }
}

console.log("--- a hostel without a map pin must still save ---");
await expectSave("coordinates: null", { type: "Point", coordinates: null });
await expectSave("no location at all", undefined);
await expectSave("location with null coordinates", {
  type: "Point",
  coordinates: null,
});

console.log("\n--- a hostel with a map pin keeps it ---");
await expectSave("real coordinates", {
  type: "Point",
  coordinates: [85.1376, 25.5941],
});

console.log("\n--- clearing the pin on an existing hostel must save ---");
const withPin = new Hostel({
  name: "Editable Hostel",
  description: "A test hostel",
  hostel_type: "boys",
  address: {
    line1: "12 Test Street",
    area: "Patna",
    subarea: "",
    pincode: "800001",
    city: "Patna",
    state: "Bihar",
  },
  location: { type: "Point", coordinates: [85.1376, 25.5941] },
  rent: { security_deposit_type: "one_month_fee", registration_fee: 0 },
  rooms: [
    {
      room_type: "single_sharing_wall",
      total_beds: 10,
      monthly_rent: 5000,
      is_available: true,
    },
  ],
  owner: new mongoose.Types.ObjectId(),
  slug: `editable-${Date.now()}`,
  photos: [{ url: "https://example.com/a.jpg", publicId: "p/a" }],
});
await withPin.save();
try {
  withPin.location.coordinates = null;
  await withPin.save();
  const raw = await Hostel.collection.findOne({ _id: withPin._id });
  console.log(
    `PASS clearing the map pin -> location ${raw.location === undefined ? "(absent)" : JSON.stringify(raw.location)}`
  );
  if (raw.location !== undefined) {
    failed = true;
    console.error("     expected the location to be dropped entirely");
  }
} catch (err) {
  failed = true;
  console.error("FAIL clearing the map pin");
  console.error(`     ${err.name}: ${err.message.split("\n")[0].slice(0, 160)}`);
}

console.log("\n--- proximity search still only matches hostels that have a pin ---");
const geoCount = await Hostel.collection.countDocuments({
  location: { $exists: true },
});
const near = await Hostel.collection
  .find({
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [85.1376, 25.5941] },
        $maxDistance: 50000,
      },
    },
  })
  .toArray();
if (near.length !== geoCount) {
  failed = true;
  console.error(
    `FAIL $near returned ${near.length} hostels, but ${geoCount} have a location`
  );
} else {
  console.log(
    `PASS $near returned ${near.length} hostels, matching the ${geoCount} that have a location`
  );
}

await mongoose.disconnect();
await mongod.stop();
process.exit(failed ? 1 : 0);
