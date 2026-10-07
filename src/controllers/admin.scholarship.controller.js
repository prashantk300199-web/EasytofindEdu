import Scholarship from "../models/Scholarship.js";
import Admin from "../models/Admin.js";
import {
  SCHOLARSHIP_STATUS,
  SCHOLARSHIP_AUDIT_ACTIONS,
  SCHOLARSHIP_DEFAULT_LIMIT,
  SCHOLARSHIP_DEFAULT_PAGE,
  SCHOLARSHIP_MAX_LIMIT,
} from "../constants/careerGuidance.constants.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const logger = {
  info: (msg, data = {}) => console.log(`[INFO] ${msg}`, data),
  error: (msg, error = {}) => console.error(`[ERROR] ${msg}`, error),
};

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * GET /api/v1/admin/career/scholarships
 * Admin list with full filters incl. status (any), pagination.
 */
export const adminListScholarships = asyncHandler(async (req, res) => {
  const {
    query,
    category,
    scholarshipType,
    status,
    isFeatured,
    sortBy = "newest",
    page = SCHOLARSHIP_DEFAULT_PAGE,
    limit = SCHOLARSHIP_DEFAULT_LIMIT,
  } = req.query;

  const filter = {};
  if (query) {
    const q = String(query).trim();
    filter.$or = [
      { name: { $regex: escapeRegex(q), $options: "i" } },
      { shortDescription: { $regex: escapeRegex(q), $options: "i" } },
      { "source.sourceName": { $regex: escapeRegex(q), $options: "i" } },
    ];
  }
  if (category) filter.category = category;
  if (scholarshipType) filter.scholarshipType = scholarshipType;
  if (status) filter.status = status;
  if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";

  let sort = { createdAt: -1 };
  if (sortBy === "oldest") sort = { createdAt: 1 };
  if (sortBy === "deadline_soonest") sort = { "deadline.applicationEndDate": 1 };
  if (sortBy === "name_asc") sort = { name: 1 };

  const safeLimit = Math.min(Math.max(parseInt(limit) || SCHOLARSHIP_DEFAULT_LIMIT, 1), SCHOLARSHIP_MAX_LIMIT);
  const safePage = Math.max(parseInt(page) || 1, 1);
  const skip = (safePage - 1) * safeLimit;

  const [items, total] = await Promise.all([
    Scholarship.find(filter).sort(sort).skip(skip).limit(safeLimit).lean(),
    Scholarship.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit) || 1,
      },
    }, "Scholarships retrieved (admin)")
  );
});

/**
 * GET /api/v1/admin/career/scholarships/:id
 * Admin single record (full fields incl. notes).
 */
export const adminGetScholarship = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doc = await Scholarship.findById(id);
  if (!doc) throw new ApiError(404, "Scholarship not found");
  res.status(200).json(new ApiResponse(200, doc.toJSON(), "Scholarship retrieved"));
});

/**
 * POST /api/v1/admin/career/scholarships
 * Create a new scholarship (SuperAdmin only).
 */
export const adminCreateScholarship = asyncHandler(async (req, res) => {
  if (req.admin?.role !== "superadmin") {
    throw new ApiError(403, "Only SuperAdmin can create scholarships");
  }
  const payload = req.body || {};
  if (!payload.name) throw new ApiError(400, "name is required");
  if (!payload.source || !payload.source.sourceName || !payload.source.sourceUrl || !payload.source.officialApplicationUrl) {
    throw new ApiError(400, "source.sourceName, source.sourceUrl and source.officialApplicationUrl are required");
  }
  if (payload.source && !payload.source.sourceType) {
    payload.source.sourceType = "government";
  }
  if (payload.source && !payload.source.lastVerifiedAt) {
    payload.source.lastVerifiedAt = new Date();
  }
  if (payload.scholarshipType) payload.scholarshipType = String(payload.scholarshipType).toLowerCase();
  if (payload.category) payload.category = String(payload.category).toLowerCase();

  payload.createdBy = req.admin._id;
  payload.updatedBy = req.admin._id;

  const doc = await Scholarship.create(payload);
  res.status(201).json(new ApiResponse(201, doc.toJSON(), "Scholarship created"));
});

/**
 * PUT /api/v1/admin/career/scholarships/:id
 * Update an existing scholarship (SuperAdmin only).
 */
export const adminUpdateScholarship = asyncHandler(async (req, res) => {
  if (req.admin?.role !== "superadmin") {
    throw new ApiError(403, "Only SuperAdmin can edit scholarships");
  }
  const { id } = req.params;
  const doc = await Scholarship.findById(id);
  if (!doc) throw new ApiError(404, "Scholarship not found");

  const allowed = [
    "name",
    "shortDescription",
    "description",
    "scholarshipType",
    "category",
    "tags",
    "amount",
    "eligibility",
    "deadline",
    "requiredDocuments",
    "applicationProcess",
    "source",
    "status",
    "isFeatured",
    "displayOrder",
    "priority",
    "keywords",
    "notes",
  ];
  for (const key of allowed) {
    if (req.body && Object.prototype.hasOwnProperty.call(req.body, key)) {
      doc[key] = req.body[key];
    }
  }
  doc.updatedBy = req.admin._id;
  await doc.save();

  res.status(200).json(new ApiResponse(200, doc.toJSON(), "Scholarship updated"));
});

/**
 * DELETE /api/v1/admin/career/scholarships/:id
 * Delete a scholarship (SuperAdmin only).
 */
export const adminDeleteScholarship = asyncHandler(async (req, res) => {
  if (req.admin?.role !== "superadmin") {
    throw new ApiError(403, "Only SuperAdmin can delete scholarships");
  }
  const { id } = req.params;
  const doc = await Scholarship.findByIdAndDelete(id);
  if (!doc) throw new ApiError(404, "Scholarship not found");
  res.status(200).json(new ApiResponse(200, { _id: id }, "Scholarship deleted"));
});

/**
 * PATCH /api/v1/admin/career/scholarships/:id/verify
 * Re-mark a scholarship as verified (refresh lastVerifiedAt).
 */
export const adminVerifyScholarship = asyncHandler(async (req, res) => {
  if (req.admin?.role !== "superadmin") {
    throw new ApiError(403, "Only SuperAdmin can verify scholarships");
  }
  const { id } = req.params;
  const doc = await Scholarship.findById(id);
  if (!doc) throw new ApiError(404, "Scholarship not found");

  if (!doc.source) doc.source = {};
  doc.source.lastVerifiedAt = new Date();
  doc.updatedBy = req.admin._id;
  if (doc.status === SCHOLARSHIP_STATUS.EXPIRED) doc.status = SCHOLARSHIP_STATUS.ACTIVE;
  await doc.save();

  res.status(200).json(new ApiResponse(200, doc.toJSON(), "Scholarship marked verified"));
});

/**
 * PATCH /api/v1/admin/career/scholarships/:id/status
 * Set status (active / closed / expired / inactive / draft).
 */
export const adminSetStatus = asyncHandler(async (req, res) => {
  if (req.admin?.role !== "superadmin") {
    throw new ApiError(403, "Only SuperAdmin can change status");
  }
  const { id } = req.params;
  const { status } = req.body || {};
  const allowedStatuses = Object.values(SCHOLARSHIP_STATUS);
  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, `status must be one of: ${allowedStatuses.join(", ")}`);
  }
  const doc = await Scholarship.findById(id);
  if (!doc) throw new ApiError(404, "Scholarship not found");
  doc.status = status;
  doc.updatedBy = req.admin._id;
  await doc.save();
  res.status(200).json(new ApiResponse(200, doc.toJSON(), "Scholarship status updated"));
});

/**
 * PATCH /api/v1/admin/career/scholarships/:id/feature
 * Toggle isFeatured.
 */
export const adminToggleFeature = asyncHandler(async (req, res) => {
  if (req.admin?.role !== "superadmin") {
    throw new ApiError(403, "Only SuperAdmin can feature scholarships");
  }
  const { id } = req.params;
  const doc = await Scholarship.findById(id);
  if (!doc) throw new ApiError(404, "Scholarship not found");
  doc.isFeatured = !doc.isFeatured;
  doc.updatedBy = req.admin._id;
  await doc.save();
  res.status(200).json(new ApiResponse(200, doc.toJSON(), `Scholarship ${doc.isFeatured ? "featured" : "unfeatured"}`));
});

/**
 * GET /api/v1/admin/career/scholarships/stats
 * Aggregate counts (admin dashboard quick view).
 */
export const adminStats = asyncHandler(async (req, res) => {
  const [total, active, draft, closed, expired, featured, byStatus, byCategory, bySource] = await Promise.all([
    Scholarship.countDocuments(),
    Scholarship.countDocuments({ status: SCHOLARSHIP_STATUS.ACTIVE }),
    Scholarship.countDocuments({ status: SCHOLARSHIP_STATUS.DRAFT }),
    Scholarship.countDocuments({ status: SCHOLARSHIP_STATUS.CLOSED }),
    Scholarship.countDocuments({ status: SCHOLARSHIP_STATUS.EXPIRED }),
    Scholarship.countDocuments({ isFeatured: true }),
    Scholarship.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Scholarship.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
    Scholarship.aggregate([{ $group: { _id: "$source.sourceType", count: { $sum: 1 } } }]),
  ]);
  res.status(200).json(
    new ApiResponse(200, {
      total,
      active,
      draft,
      closed,
      expired,
      featured,
      byStatus: Object.fromEntries(byStatus.map((x) => [x._id, x.count])),
      byCategory: Object.fromEntries(byCategory.map((x) => [x._id, x.count])),
      bySource: Object.fromEntries(bySource.map((x) => [x._id, x.count])),
    }, "Scholarship stats retrieved")
  );
});
