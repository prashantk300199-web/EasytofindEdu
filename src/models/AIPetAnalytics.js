import mongoose from "mongoose";

// Lightweight analytics for the AI Pet — no PII, no conversation content.
// Tracks aggregated counts so admins can see what students are asking for.
const aiPetAnalyticsSchema = new mongoose.Schema(
  {
    // Bucket: e.g. "search_hostels", "search_colleges", "compare", "clarify"
    action: { type: String, required: true, index: true },
    // Optional sub-bucket — e.g. the city or course the student asked about
    // when the intent detection surfaced an entity.
    category: { type: String, default: "", index: true },
    // Did the search return results?
    hasResults: { type: Boolean, default: false, index: true },
    // Was the student logged in?
    authenticated: { type: Boolean, default: false },
    // Date truncated to the hour for cheap aggregation.
    hourBucket: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// One row per (action, category, hour, hasResults, authenticated) tuple.
aiPetAnalyticsSchema.index(
  { action: 1, category: 1, hourBucket: 1, hasResults: 1, authenticated: 1 },
  { unique: true }
);

const AIPetAnalytics = mongoose.model("AIPetAnalytics", aiPetAnalyticsSchema);
export default AIPetAnalytics;