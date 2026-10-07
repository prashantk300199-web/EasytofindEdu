import mongoose from "mongoose";
import Scholarship from "../src/models/Scholarship.js";
import connectDB from "../src/config/db.js";
import dotenv from "dotenv";
dotenv.config();

await connectDB();

// Test 1: list with filters
const list = await Scholarship.find({ status: "active" })
  .limit(3)
  .select("name source.sourceName scholarshipType category computedStatus")
  .lean();
console.log("\n=== /scholarships list (first 3) ===");
list.forEach((s) => console.log(" -", s.name, "|", s.scholarshipType, "|", s.category, "|", s.computedStatus));

// Test 2: by source type
const govt = await Scholarship.countDocuments({ status: "active", "source.sourceType": "government" });
const univ = await Scholarship.countDocuments({ status: "active", "source.sourceType": "university" });
const found = await Scholarship.countDocuments({ status: "active", "source.sourceType": "foundation" });
console.log("\n=== By source type (active) ===");
console.log("Government  :", govt);
console.log("University  :", univ);
console.log("Foundation  :", found);

// Test 3: deadline window
const open = await Scholarship.countDocuments({
  status: "active",
  computedStatus: { $in: ["upcoming", "closing_soon", "active"] },
});
console.log("\n=== Open / Upcoming / Closing soon ===", open);

// Test 4: search by text
const pmrf = await Scholarship.findOne({ name: { $regex: "PMRF", $options: "i" } }).lean();
console.log("\n=== Search PMRF ===");
console.log("Found:", pmrf?.name, "|", pmrf?.source?.officialApplicationUrl);

// Test 5: slug uniqueness
const dupes = await Scholarship.aggregate([
  { $group: { _id: "$slug", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } },
]);
console.log("\n=== Slug uniqueness ===");
console.log("Duplicate slugs:", dupes.length);

// Test 6: women-only filter
const women = await Scholarship.countDocuments({ status: "active", "eligibility.gender": "female_only" });
console.log("\n=== Women-only scholarships ===", women);

// Test 7: category-based filter
const scst = await Scholarship.countDocuments({
  status: "active",
  "eligibility.categories": { $in: ["sc", "st"] },
});
console.log("=== SC/ST-eligible scholarships ===", scst);

// Test 8: state-bound filter (Maharashtra)
const maha = await Scholarship.findOne({ "eligibility.states": "Maharashtra" }).lean();
console.log("\n=== State-bound (Maharashtra) ===");
console.log("Sample:", maha?.name, "| states:", maha?.eligibility.states);

// Test 9: research-fellowship filter
const research = await Scholarship.find({ category: "research_fellowship" })
  .select("name scholarshipType")
  .lean();
console.log("\n=== Research Fellowships ===");
research.forEach((r) => console.log(" -", r.name, "|", r.scholarshipType));

await mongoose.disconnect();
process.exit(0);
