// Controlled database retrieval for the AI Pet.
//
// SECURITY: This module is the only place the AI Pet is allowed to read
// listing data from. The AI model NEVER executes raw queries. It returns
// a structured action (intent + entities) and the controller routes it
// to one of these named functions with validated parameters.
//
// Every function returns a *lean* listing summary that is safe to pass
// straight into the LLM context — only fields we actually want surfaced,
// and the listing's canonical detail-page URL.

import Hostel from "../models/Hostel.js";
import Institute from "../models/Institute.js";
import College from "../models/College.js";
import CollegeProfile from "../models/college.model.js"; // legacy college doc used by /api/v1/collegeS
import CollegeCourse from "../models/collegeCourse.model.js";
import City from "../models/City.js";
import { HOSTEL_STATUS } from "../constants/enums.js";
import maskName from "../utils/maskName.js";

// ─────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────

const safeNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const escapeRegex = (s) => String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const lowerHostel = (hostel) => ({
  name: hostel.masked_name || maskName(hostel.name),
  slug: hostel.slug,
  type: hostel.hostel_type,
  description: hostel.description,
  city: hostel.address?.city,
  area: hostel.address?.area,
  subarea: hostel.address?.subarea,
  state: hostel.address?.state,
  fullAddress: [hostel.address?.line1, hostel.address?.line2, hostel.address?.area, hostel.address?.city]
    .filter(Boolean)
    .join(", "),
  // Pricing — derived from cheapest available room.
  monthlyRent: hostel.rooms?.length
    ? Math.min(...hostel.rooms.map((r) => safeNumber(r.monthly_rent, 0)).filter((n) => n > 0))
    : 0,
  roomTypes: hostel.rooms?.map((r) => r.room_type).filter(Boolean) || [],
  hasAC: hostel.rooms?.some((r) => r.ac) || false,
  hasWiFi: (hostel.in_room_amenities || []).some(
    (a) => typeof a === "string" && /wi[- ]?fi/i.test(a)
  ),
  hasFood: (hostel.meal_plans || []).length > 0,
  foodDetails: (hostel.meal_plans || []).map((m) => ({
    frequency: m.frequency,
    type: m.meal_type,
    serviceType: m.service_type,
    monthlyCost: safeNumber(m.monthly_cost),
  })),
  security: {
    cctv: !!hostel.security?.cctv,
    guard: !!hostel.security?.security_guard_24x7,
    biometric: !!hostel.security?.biometric_entry,
    warden: !!hostel.security?.full_time_warden,
  },
  wardenContact: hostel.warden?.contact_number || null,
  genderType: hostel.hostel_type,
  totalBeds: safeNumber(hostel.total_hostel_beds),
  availableBeds: hostel.rooms?.reduce(
    (sum, r) => sum + safeNumber(r.available_beds_count, 0),
    0
  ),
  photos: (hostel.photos || []).map((p) => p.url).filter(Boolean),
  nearbyDistances: hostel.nearby_distances || {},
  rating: hostel.rating_summary?.overall || null,
  comparisonMetrics: hostel.comparisonMetrics || {},
  isOpen: !!hostel.is_open,
  detailUrl: `/hostels/${hostel.slug}`,
  listingId: String(hostel._id),
});

const lowerInstitute = (inst) => {
  const city = inst.location?.cityName || inst.location?.city?.name || "";
  const area = inst.location?.areaName || inst.location?.area?.name || "";
  const subarea = inst.location?.subareaName || inst.location?.subarea?.name || "";
  return {
    name: inst.name,
    establishedYear: inst.establishedYear,
    about: inst.about,
    city,
    area,
    subarea,
    fullAddress: inst.location?.fullAddress || [subarea, area, city].filter(Boolean).join(", "),
    facilities: Object.entries(inst.facilities || {})
      .filter(([, v]) => v === true)
      .map(([k]) => k),
    facilityList: inst.facilityList || [],
    comparisonMetrics: inst.comparisonMetrics || {},
    courses: (inst.courses || []).map((c) => (typeof c === "object" ? c.name : c)).filter(Boolean),
    director: inst.directorName,
    averageFacultyExperience: inst.avgFacultyExperience,
    logo: inst.logo?.url,
    coverImage: inst.coverImage?.url,
    detailUrl: `/institutes/${inst._id}`,
    listingId: String(inst._id),
  };
};

// College has two on-disk models: the newer `College` schema and the legacy
// `CollegeProfile` (`college.model.js`). The public /collegeS API uses the
// legacy one. We try both for any query so the pet works with whatever data
// is actually live.
const lowerCollege = (c) => {
  if (!c) return null;
  const loc = c.location || {};
  const fee = c.feeStructure || {};
  return {
    name: c.name,
    shortName: c.shortName,
    about: c.about || c.description,
    city: loc.city,
    state: loc.state,
    fullAddress: loc.address,
    collegeType: c.collegeType,
    ownershipType: c.ownershipType,
    affiliationType: c.affiliationType,
    affiliatedUniversity: c.affiliatedUniversity,
    approvedBy: c.approvals || c.approvedBy || [],
    accreditation: c.accreditation || (c.naacGrade ? [c.naacGrade] : []),
    naacGrade: c.accreditation?.naacGrade || c.naacGrade,
    ranking: c.ranking || c.rankings,
    placements: c.placements || {},
    programs: (c.programs || []).map((p) => ({
      programId: p.programId,
      cutoff: p.cutoff,
      seats: p.seats,
      category: p.category,
    })),
    feeStructure: fee.tuitionFeePerYear
      ? {
          tuitionMin: safeNumber(fee.tuitionFeePerYear.min),
          tuitionMax: safeNumber(fee.tuitionFeePerYear.max),
          hostelFee: safeNumber(fee.hostelFeePerYear),
          totalCostPerYear: safeNumber(fee.totalCostPerYear),
        }
      : null,
    coursesOffered:
      c.coursesOffered?.map((co) => ({
        course: co.course?.courseName || co.courseName,
        degreeType: co.course?.degreeType,
        stream: co.course?.stream,
        specialization: co.course?.specialization,
      })) || [],
    details: c.details || {},
    images: c.images || c.bannerImages || [],
    detailUrl: `/colleges/${c._id}`,
    listingId: String(c._id),
  };
};

// ─────────────────────────────────────────────────────────────────────────
// HOSTELS
// ─────────────────────────────────────────────────────────────────────────

/**
 * @param {Object} params
 * @param {string} [params.city]      case-insensitive city name
 * @param {string} [params.area]      case-insensitive area / subarea / landmark
 * @param {string} [params.hostel_type] boys | girls | co_ed
 * @param {number} [params.max_price]  monthly rent ceiling (in INR)
 * @param {number} [params.min_price]  monthly rent floor
 * @param {boolean}[params.has_food]   only hostels that offer meal plans
 * @param {boolean}[params.has_ac]     only hostels with at least one AC room
 * @param {boolean}[params.has_wifi]   only hostels with Wi-Fi in rooms
 * @param {string} [params.sortBy]     "price_asc" | "price_desc" | "rating" | "newest" | "default"
 * @param {number} [params.limit]
 */
export async function searchHostels(params = {}) {
  const {
    city,
    area,
    hostel_type,
    max_price,
    min_price,
    has_food,
    has_ac,
    has_wifi,
    sortBy = "default",
    limit = 8,
  } = params;

  const filter = {
    status: HOSTEL_STATUS.APPROVED,
    is_open: true,
  };

  if (city) filter["address.city"] = new RegExp(`^${escapeRegex(city)}$`, "i");
  if (area) {
    filter.$or = [
      { "address.area": new RegExp(escapeRegex(area), "i") },
      { "address.subarea": new RegExp(escapeRegex(area), "i") },
    ];
  }
  if (hostel_type && ["boys", "girls", "co_ed"].includes(hostel_type)) {
    filter.hostel_type = hostel_type;
  }
  if (typeof max_price === "number" && max_price > 0) {
    filter["rooms.monthly_rent"] = {
      ...(filter["rooms.monthly_rent"] || {}),
      $lte: max_price,
    };
  }
  if (typeof min_price === "number" && min_price > 0) {
    filter["rooms.monthly_rent"] = {
      ...(filter["rooms.monthly_rent"] || {}),
      $gte: min_price,
    };
  }
  if (has_food === true) {
    filter["meal_plans.0"] = { $exists: true };
  }
  if (has_ac === true) {
    filter["rooms.ac"] = true;
  }
  if (has_wifi === true) {
    filter.in_room_amenities = /wi[- ]?fi/i;
  }

  // Default: pull a slightly wider candidate set so we can rank client-side
  // by price (Mongo can't easily sort by the *min* of an array element).
  const fetchLimit = sortBy === "price_asc" || sortBy === "price_desc"
    ? Math.min(Math.max(limit * 4, 12), 60)
    : Math.min(Math.max(limit, 1), 12);

  const docs = await Hostel.find(filter).limit(fetchLimit).lean();

  let ranked = docs;
  if (sortBy === "price_asc") {
    ranked = docs
      .map((d) => ({
        d,
        rent: d.rooms?.length
          ? Math.min(...d.rooms.map((r) => safeNumber(r.monthly_rent, 0)).filter((n) => n > 0))
          : Infinity,
      }))
      .filter((x) => Number.isFinite(x.rent))
      .sort((a, b) => a.rent - b.rent)
      .map((x) => x.d);
  } else if (sortBy === "price_desc") {
    ranked = docs
      .map((d) => ({
        d,
        rent: d.rooms?.length
          ? Math.min(...d.rooms.map((r) => safeNumber(r.monthly_rent, 0)).filter((n) => n > 0))
          : -1,
      }))
      .sort((a, b) => b.rent - a.rent)
      .map((x) => x.d);
  } else if (sortBy === "rating") {
    ranked = docs.sort(
      (a, b) =>
        safeNumber(b.rating_summary?.overall, 0) -
        safeNumber(a.rating_summary?.overall, 0)
    );
  } else if (sortBy === "newest") {
    ranked = docs.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  } else {
    // default: prefer hostels with a real overall score, then most recent.
    ranked = docs.sort(
      (a, b) =>
        safeNumber(b.comparisonMetrics?.overallScore, 0) -
        safeNumber(a.comparisonMetrics?.overallScore, 0) ||
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  return ranked.slice(0, Math.min(Math.max(limit, 1), 12)).map(lowerHostel);
}

/** Compare a set of hostels by id. Returns the same shape as search. */
export async function getHostelsByIds(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const valid = ids.filter((id) => typeof id === "string" && id.length === 24);
  if (!valid.length) return [];
  const docs = await Hostel.find({
    _id: { $in: valid },
    status: HOSTEL_STATUS.APPROVED,
  }).lean();
  return docs.map(lowerHostel);
}

// ─────────────────────────────────────────────────────────────────────────
// INSTITUTES
// ─────────────────────────────────────────────────────────────────────────

/**
 * @param {Object} params
 * @param {string} [params.city]
 * @param {string} [params.area]
 * @param {string} [params.course]       rough substring match against Course.name
 * @param {boolean}[params.approved_only]
 * @param {number} [params.limit]
 */
export async function searchInstitutes(params = {}) {
  const { city, area, course, limit = 8 } = params;

  const filter = { isActive: true, isApproved: true };
  // The schema has TWO shapes for location fields: `city/area/subarea`
  // (ObjectId refs to City/Area/SubArea models) AND `cityName/areaName/
  // subareaName` (plain strings the owner types in). When the pet passes a
  // string we ONLY query the *Name variants — Mongoose would otherwise try to
  // cast the regex to an ObjectId and throw. If callers ever supply a 24-char
  // hex id, the ObjectId branch is fine.
  if (city) {
    const or = [];
    if (/^[0-9a-fA-F]{24}$/.test(city)) {
      or.push({ "location.city": city });
    }
    or.push({ "location.cityName": new RegExp(escapeRegex(city), "i") });
    filter.$or = or;
  }
  if (area) {
    const or = filter.$or ? [...filter.$or] : [];
    if (/^[0-9a-fA-F]{24}$/.test(area)) {
      or.push({ "location.area": area });
      or.push({ "location.subarea": area });
    }
    or.push({ "location.areaName": new RegExp(escapeRegex(area), "i") });
    or.push({ "location.subareaName": new RegExp(escapeRegex(area), "i") });
    filter.$or = or;
  }

  let docs = await Institute.find(filter)
    .populate({ path: "courses", select: "name", options: { lean: true }, strictPopulate: false })
    .sort({ "comparisonMetrics.overallScore": -1, createdAt: -1 })
    .limit(Math.min(Math.max(limit * 2, 4), 30)) // fetch more, narrow client-side
    .lean();

  if (course) {
    const rx = new RegExp(escapeRegex(course), "i");
    docs = docs.filter((d) =>
      (d.courses || []).some((c) => rx.test(c?.name || "")) ||
      rx.test(d.about || "") ||
      rx.test(d.facilityList?.join(" ") || "")
    );
  }

  return docs.slice(0, Math.min(Math.max(limit, 1), 12)).map(lowerInstitute);
}

export async function getInstitutesByIds(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const valid = ids.filter((id) => typeof id === "string" && id.length === 24);
  if (!valid.length) return [];
  const docs = await Institute.find({
    _id: { $in: valid },
    isActive: true,
    isApproved: true,
  })
    .populate({ path: "courses", select: "name", options: { lean: true }, strictPopulate: false })
    .lean();
  return docs.map(lowerInstitute);
}

// ─────────────────────────────────────────────────────────────────────────
// COLLEGES
// ─────────────────────────────────────────────────────────────────────────

/**
 * The public college API uses the legacy `college.model.js` ("CollegeProfile").
 * We search that collection here so the pet reflects exactly what students
 * see on /colleges.
 */
export async function searchColleges(params = {}) {
  const { city, state, course, collegeType, limit = 8 } = params;

  const query = {
    $and: [
      { $or: [{ isApproved: { $exists: false } }, { isApproved: { $ne: false } }] },
      { $or: [{ isActive: { $exists: false } }, { isActive: { $ne: true } }] },
    ],
  };

  if (city) {
    query["contact.address"] = new RegExp(escapeRegex(city), "i");
  }
  if (state) {
    query["contact.address"] = new RegExp(escapeRegex(state), "i");
  }
  if (collegeType) {
    query.collegeType = new RegExp(`^${escapeRegex(collegeType)}$`, "i");
  }

  let docs = await CollegeProfile.find(query)
    .populate({
      path: "coursesOffered.course",
      model: "CollegeCourse",
      select: "courseName degreeType stream specialization",
      strictPopulate: false,
    })
    .limit(Math.min(Math.max(limit * 2, 4), 30))
    .lean();

  if (course) {
    const rx = new RegExp(escapeRegex(course), "i");
    docs = docs.filter((d) =>
      (d.coursesOffered || []).some((co) =>
        rx.test(co.course?.courseName || "") ||
        rx.test(co.course?.stream || "") ||
        rx.test(co.course?.specialization || "") ||
        rx.test(co.courseName || "")
      ) ||
      rx.test(d.name || "") ||
      rx.test(d.about || "")
    );
  }

  // Also try the newer College schema for any match (so the pet stays current
  // once the migration completes).
  if (docs.length < limit) {
    const newQuery = { status: "published" };
    if (city) newQuery["location.city"] = new RegExp(escapeRegex(city), "i");
    if (collegeType) newQuery.collegeType = collegeType;
    const newDocs = await College.find(newQuery).limit(limit - docs.length).lean();
    for (const d of newDocs) {
      if (!docs.find((x) => String(x._id) === String(d._id))) docs.push(d);
    }
  }

  return docs.slice(0, Math.min(Math.max(limit, 1), 12)).map(lowerCollege).filter(Boolean);
}

export async function getCollegesByIds(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const valid = ids.filter((id) => typeof id === "string" && id.length === 24);
  if (!valid.length) return [];
  const [legacy, newer] = await Promise.all([
    CollegeProfile.find({
      _id: { $in: valid },
      $and: [
        { $or: [{ isApproved: { $exists: false } }, { isApproved: { $ne: false } }] },
        { $or: [{ isActive: { $exists: false } }, { isActive: { $ne: true } }] },
      ],
    }).lean(),
    College.find({ _id: { $in: valid }, status: "published" }).lean(),
  ]);
  const merged = [...legacy];
  for (const d of newer) if (!merged.find((x) => String(x._id) === String(d._id))) merged.push(d);
  return merged.map(lowerCollege).filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────
// COURSES (catalog)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Find CollegeCourse records and the colleges that offer each.
 */
export async function searchCourses(params = {}) {
  const { courseName, stream, degreeType, limit = 6 } = params;
  const filter = {};
  if (courseName) filter.courseName = new RegExp(escapeRegex(courseName), "i");
  if (stream) filter.stream = new RegExp(escapeRegex(stream), "i");
  if (degreeType) filter.degreeType = new RegExp(`^${escapeRegex(degreeType)}$`, "i");

  const courses = await CollegeCourse.find(filter)
    .limit(Math.min(Math.max(limit, 1), 12))
    .lean();

  return courses.map((c) => ({
    courseName: c.courseName,
    fullForm: c.fullForm,
    degreeType: c.degreeType,
    stream: c.stream,
    specialization: c.specialization,
    duration: c.duration,
    semesters: c.semesters,
    eligibility: c.eligibility,
    requiredSubjects: c.requiredSubjects || [],
    entranceExamsAccepted: c.entranceExamsAccepted || [],
    intakeSeats: c.intakeSeats,
    detailUrl: `/career-explorer`,
    listingId: String(c._id),
  }));
}

// ─────────────────────────────────────────────────────────────────────────
// Location lookups (used for "what cities do we have")
// ─────────────────────────────────────────────────────────────────────────

export async function getAvailableCities() {
  const [hostelCities, instCities, collegeCities] = await Promise.all([
    Hostel.distinct("address.city", { status: HOSTEL_STATUS.APPROVED }),
    Institute.distinct("location.cityName", { isActive: true, isApproved: true }),
    CollegeProfile.distinct("contact.address"),
  ]);
  // CollegeProfile.contact.address is free-text; just grab a city-like suffix.
  const fromColleges = collegeCities
    .map((s) => {
      if (!s) return null;
      const m = String(s).match(/,\s*([A-Za-z][A-Za-z\s]+?)\s*(?:,|\.|$)/);
      return m ? m[1].trim() : null;
    })
    .filter(Boolean);

  const set = new Set([
    ...hostelCities.filter(Boolean),
    ...instCities.filter(Boolean),
    ...fromColleges,
  ]);
  return Array.from(set).sort();
}