import Scholarship from "../models/Scholarship.js";
import Student from "../models/Students.js";
import ApiError from "../utils/ApiError.js";
import {
  SCHOLARSHIP_DEFAULT_PAGE,
  SCHOLARSHIP_DEFAULT_LIMIT,
  SCHOLARSHIP_MAX_LIMIT,
  SCHOLARSHIP_STATUS,
} from "../constants/careerGuidance.constants.js";

const logger = {
  info: (msg, data = {}) => console.log(`[INFO] ${msg}`, data),
  error: (msg, error = {}) => console.error(`[ERROR] ${msg}`, error),
};

/**
 * Build the base match filter for any public list call.
 * Public users only see ACTIVE records.
 */
function buildBaseFilter() {
  return { status: SCHOLARSHIP_STATUS.ACTIVE };
}

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Resolve an Indian-state list to its union with "All India" semantics.
 * If the input list is empty, we leave the filter open (any state matches).
 */
function stateFilter(states) {
  if (!states || (Array.isArray(states) && states.length === 0)) return null;
  const list = Array.isArray(states) ? states : [states];
  return { $in: list };
}

/**
 * Search scholarships by free-text query.
 * Uses MongoDB text index when query is present, otherwise returns paginated set.
 */
export async function searchScholarships(params = {}) {
  try {
    const {
      query,
      category,
      scholarshipType,
      educationLevel,
      stream,
      eligibleCategory, // general / sc / st / obc / ews / minority / pwd / women
      state,
      gender,
      status: explicitStatus,
      deadlineFrom,
      deadlineTo,
      sortBy = "relevance",
      page = SCHOLARSHIP_DEFAULT_PAGE,
      limit = SCHOLARSHIP_DEFAULT_LIMIT,
    } = params;

    const filter = buildBaseFilter();

    if (query && String(query).trim().length > 0) {
      const q = String(query).trim();
      filter.$or = [
        { name: { $regex: escapeRegex(q), $options: "i" } },
        { shortDescription: { $regex: escapeRegex(q), $options: "i" } },
        { description: { $regex: escapeRegex(q), $options: "i" } },
        { tags: { $regex: escapeRegex(q), $options: "i" } },
        { keywords: { $regex: escapeRegex(q), $options: "i" } },
        { "source.sourceName": { $regex: escapeRegex(q), $options: "i" } },
      ];
    }

    if (category) filter.category = category;
    if (scholarshipType) filter.scholarshipType = scholarshipType;

    if (educationLevel) {
      filter["eligibility.educationLevels"] = { $in: [educationLevel, "any"] };
    }

    if (stream) {
      filter["eligibility.streams"] = { $in: [stream, "any"] };
    }

    if (eligibleCategory) {
      filter["eligibility.categories"] = { $in: [eligibleCategory, "any"] };
    }

    const stateCond = stateFilter(state);
    if (stateCond) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { "eligibility.states": { $size: 0 } },
          { "eligibility.states": stateCond },
        ],
      });
    }

    if (gender && gender !== "any") {
      filter["eligibility.gender"] = { $in: [gender, "any"] };
    }

    if (explicitStatus) {
      filter.computedStatus = explicitStatus;
    }

    if (deadlineFrom || deadlineTo) {
      filter["deadline.applicationEndDate"] = {};
      if (deadlineFrom) filter["deadline.applicationEndDate"].$gte = new Date(deadlineFrom);
      if (deadlineTo) filter["deadline.applicationEndDate"].$lte = new Date(deadlineTo);
    }

    // Build sort
    let sort = { isFeatured: -1, displayOrder: 1, createdAt: -1 };
    switch (sortBy) {
      case "deadline_soonest":
        sort = { isFeatured: -1, "deadline.applicationEndDate": 1, createdAt: -1 };
        break;
      case "deadline_latest":
        sort = { isFeatured: -1, "deadline.applicationEndDate": -1, createdAt: -1 };
        break;
      case "amount_high_to_low":
        sort = { isFeatured: -1, "amount.max": -1, "amount.min": -1, createdAt: -1 };
        break;
      case "amount_low_to_high":
        sort = { isFeatured: -1, "amount.min": 1, createdAt: -1 };
        break;
      case "newest":
        sort = { createdAt: -1 };
        break;
      case "most_popular":
        sort = { isFeatured: -1, viewCount: -1, clickCount: -1, createdAt: -1 };
        break;
      case "relevance":
      default:
        sort = { isFeatured: -1, priority: -1, displayOrder: 1, createdAt: -1 };
        break;
    }

    const safeLimit = Math.min(Math.max(parseInt(limit) || SCHOLARSHIP_DEFAULT_LIMIT, 1), SCHOLARSHIP_MAX_LIMIT);
    const safePage = Math.max(parseInt(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      Scholarship.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(safeLimit)
        .select("-notes")
        .lean(),
      Scholarship.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit) || 1,
      },
    };
  } catch (err) {
    logger.error("Error in searchScholarships", err);
    throw new ApiError(500, "Failed to search scholarships");
  }
}

/**
 * Get a single scholarship by id or slug.
 */
export async function getScholarshipById(identifier) {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    const doc = isObjectId
      ? await Scholarship.findOne({ _id: identifier, status: SCHOLARSHIP_STATUS.ACTIVE })
      : await Scholarship.findOne({ slug: identifier.toLowerCase(), status: SCHOLARSHIP_STATUS.ACTIVE });
    if (!doc) throw new ApiError(404, "Scholarship not found");
    doc.viewCount = (doc.viewCount || 0) + 1;
    await doc.save();
    return doc.toJSON();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    logger.error("Error in getScholarshipById", err);
    throw new ApiError(500, "Failed to fetch scholarship");
  }
}

/**
 * Get featured scholarships (for "Recommended for You" top section).
 */
export async function getFeaturedScholarships(limit = 6) {
  try {
    const docs = await Scholarship.find({
      status: SCHOLARSHIP_STATUS.ACTIVE,
      isFeatured: true,
    })
      .sort({ priority: -1, displayOrder: 1, createdAt: -1 })
      .limit(Math.min(parseInt(limit) || 6, 20))
      .lean();
    return docs;
  } catch (err) {
    logger.error("Error in getFeaturedScholarships", err);
    return [];
  }
}

/**
 * Get scholarships currently open or closing soon — for the
 * "Open & closing soon" landing rail.
 */
export async function getOpenAndClosingSoon(limit = 12) {
  try {
    const now = new Date();
    const docs = await Scholarship.find({
      status: SCHOLARSHIP_STATUS.ACTIVE,
      computedStatus: { $in: ["active", "closing_soon", "upcoming"] },
      $or: [
        { "deadline.applicationEndDate": { $gte: now } },
        { "deadline.applicationEndDate": null, "deadline.isRecurring": true },
      ],
    })
      .sort({ isFeatured: -1, "deadline.applicationEndDate": 1, createdAt: -1 })
      .limit(Math.min(parseInt(limit) || 12, 30))
      .lean();
    return docs;
  } catch (err) {
    logger.error("Error in getOpenAndClosingSoon", err);
    return [];
  }
}

/**
 * Personalized recommendations for a logged-in student based on
 * their profile. Always falls back to a featured list when the
 * profile is incomplete.
 */
export async function getRecommendedForStudent(studentId, limit = 8) {
  try {
    const student = await Student.findById(studentId).lean();
    if (!student) return getFeaturedScholarships(limit);

    const profile = student.careerGuidance || {};
    const lastQual = profile.lastQualification || student.lastQualification || null;
    const stream = profile.stream || null;
    const state = student.state || null;
    const gender = student.gender || null;

    const orFilters = [];

    if (lastQual) {
      orFilters.push({ "eligibility.educationLevels": { $in: [lastQual, "any"] } });
    }
    if (stream) {
      orFilters.push({ "eligibility.streams": { $in: [stream, "any"] } });
    }
    if (state) {
      orFilters.push({
        $or: [
          { "eligibility.states": { $size: 0 } },
          { "eligibility.states": { $in: [state] } },
        ],
      });
    }
    if (gender && gender !== "any") {
      orFilters.push({ "eligibility.gender": { $in: [gender, "any"] } });
    }

    // If the profile has no signal at all, just return featured.
    if (orFilters.length === 0) {
      return getFeaturedScholarships(limit);
    }

    const docs = await Scholarship.find({
      status: SCHOLARSHIP_STATUS.ACTIVE,
      $or: orFilters,
    })
      .sort({ isFeatured: -1, priority: -1, "deadline.applicationEndDate": 1, createdAt: -1 })
      .limit(Math.min(parseInt(limit) || 8, 30))
      .lean();

    if (docs.length < 3) {
      // Backfill with featured so the student always has something useful.
      const backfill = await getFeaturedScholarships(limit - docs.length);
      const seen = new Set(docs.map((d) => String(d._id)));
      for (const b of backfill) if (!seen.has(String(b._id))) docs.push(b);
    }

    return docs;
  } catch (err) {
    logger.error("Error in getRecommendedForStudent", err);
    return getFeaturedScholarships(limit);
  }
}

/**
 * Faceted counts — useful for filter UI sidebar.
 */
export async function getScholarshipFacets() {
  try {
    const base = { status: SCHOLARSHIP_STATUS.ACTIVE };
    const [byType, byCategory, byLevel, byGender, byComputed] = await Promise.all([
      Scholarship.aggregate([{ $match: base }, { $group: { _id: "$scholarshipType", count: { $sum: 1 } } }]),
      Scholarship.aggregate([{ $match: base }, { $group: { _id: "$category", count: { $sum: 1 } } }]),
      Scholarship.aggregate([
        { $match: base },
        { $unwind: { path: "$eligibility.educationLevels", preserveNullAndEmptyArrays: true } },
        { $group: { _id: "$eligibility.educationLevels", count: { $sum: 1 } } },
      ]),
      Scholarship.aggregate([{ $match: base }, { $group: { _id: "$eligibility.gender", count: { $sum: 1 } } }]),
      Scholarship.aggregate([{ $match: base }, { $group: { _id: "$computedStatus", count: { $sum: 1 } } }]),
    ]);
    return {
      byType: Object.fromEntries(byType.map((x) => [x._id, x.count])),
      byCategory: Object.fromEntries(byCategory.map((x) => [x._id, x.count])),
      byEducationLevel: Object.fromEntries(byLevel.map((x) => [x._id || "any", x.count])),
      byGender: Object.fromEntries(byGender.map((x) => [x._id, x.count])),
      byComputedStatus: Object.fromEntries(byComputed.map((x) => [x._id, x.count])),
    };
  } catch (err) {
    logger.error("Error in getScholarshipFacets", err);
    return null;
  }
}

/**
 * Track an outbound click on the official application link.
 */
export async function trackApplicationClick(id) {
  try {
    await Scholarship.findByIdAndUpdate(id, { $inc: { clickCount: 1 } });
  } catch (err) {
    logger.error("Error in trackApplicationClick", err);
  }
}
