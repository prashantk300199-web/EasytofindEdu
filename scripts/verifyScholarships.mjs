import mongoose from "mongoose";
import Scholarship from "../src/models/Scholarship.js";
import connectDB from "../src/config/db.js";

await connectDB();

const total = await Scholarship.countDocuments();
const featured = await Scholarship.countDocuments({ isFeatured: true });
const active = await Scholarship.countDocuments({ status: "active" });
const bySource = await Scholarship.aggregate([{ $group: { _id: "$source.sourceType", count: { $sum: 1 } } }]);
const byCat = await Scholarship.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]);
const byType = await Scholarship.aggregate([{ $group: { _id: "$scholarshipType", count: { $sum: 1 } } }]);

console.log("\n===== SCHOLARSHIP DB SUMMARY =====");
console.log("Total:", total, "| Featured:", featured, "| Active:", active);
console.log("\nBy sourceType:");
bySource.forEach((x) => console.log("  -", x._id, ":", x.count));
console.log("\nBy category:");
byCat.forEach((x) => console.log("  -", x._id, ":", x.count));
console.log("\nBy type:");
byType.forEach((x) => console.log("  -", x._id, ":", x.count));

console.log("\n===== SAMPLE: PMRF =====");
const pmrf = await Scholarship.findOne({ name: "Prime Minister's Research Fellowship (PMRF)" });
console.log("Name           :", pmrf.name);
console.log("Source name    :", pmrf.source.sourceName);
console.log("Source URL     :", pmrf.source.sourceUrl);
console.log("Apply URL      :", pmrf.source.officialApplicationUrl);
console.log("Status         :", pmrf.status, "| Computed:", pmrf.computedStatus);
console.log("Last verified  :", pmrf.source.lastVerifiedAt);
console.log("Amount label   :", pmrf.amountLabel);
console.log("Deadline label :", pmrf.deadlineLabel);
console.log("Education lvl  :", pmrf.eligibility.educationLevels);
console.log("Streams        :", pmrf.eligibility.streams);
console.log("Categories     :", pmrf.eligibility.categories);
console.log("Gender         :", pmrf.eligibility.gender);
console.log("Docs           :", pmrf.requiredDocuments?.length, "items");
console.log("toJSON         :", JSON.stringify(pmrf.toJSON()).slice(0, 300) + "...");

console.log("\n===== SAMPLE: AICTE PRAGATI =====");
const prag = await Scholarship.findOne({ name: /AICTE Pragati/ });
console.log("Name           :", prag.name);
console.log("Gender         :", prag.eligibility.gender);
console.log("Max family inc :", prag.eligibility.maxFamilyIncome);
console.log("Apply URL      :", prag.source.officialApplicationUrl);

console.log("\n===== SAMPLE: Maharashtra State Scholarship =====");
const maha = await Scholarship.findOne({ name: /Maharashtra/ });
console.log("Name           :", maha.name);
console.log("States         :", maha.eligibility.states);
console.log("Categories     :", maha.eligibility.categories);
console.log("Source         :", maha.source.sourceName);

console.log("\n===== SAMPLE: NTSE (recurring) =====");
const ntse = await Scholarship.findOne({ name: /NTSE/ });
console.log("Name           :", ntse.name);
console.log("isRecurring    :", ntse.deadline.isRecurring);
console.log("Computed status:", ntse.computedStatus);
console.log("Deadline label :", ntse.deadlineLabel);
console.log("Source URL     :", ntse.source.sourceUrl);

await mongoose.disconnect();
process.exit(0);
