import slugify from "./slugify.js";

/**
 * Format duration label
 */
export const formatDurationLabel = (min, max, unit) => {
  if (min === max) {
    return `${min} ${unit}`;
  }
  return `${min}-${max} ${unit}`;
};

/**
 * Format fees label
 */
export const formatFeesLabel = (min, max) => {
  const minLakh = min / 100000;
  const maxLakh = max / 100000;
  return `₹${minLakh.toFixed(2)}-${maxLakh.toFixed(2)} LPA`;
};

/**
 * Format salary label
 */
export const formatSalaryLabel = (minLPA, maxLPA) => {
  return `₹${minLPA}-${maxLPA} LPA`;
};

/**
 * Build program search index (for elastic/mongo text search)
 */
export const buildSearchIndex = (program) => {
  const searchableFields = [
    program.title,
    program.description,
    program.overview,
    program.category,
    ...(program.jobRoles ? program.jobRoles.map((j) => j.title) : []),
    ...(program.tags || []),
  ];

  return searchableFields
    .filter((f) => f)
    .join(" ")
    .toLowerCase();
};

/**
 * Validate program data before saving
 */
export const validateProgramData = (data) => {
  const errors = [];

  if (!data.title) errors.push("Title is required");
  if (!data.category) errors.push("Category is required");
  if (!data.duration || !data.duration.min || !data.duration.max) {
    errors.push("Duration with min and max is required");
  }
  if (!data.fees || !data.fees.min || !data.fees.max) {
    errors.push("Fees with min and max is required");
  }
  if (!data.salary || !data.salary.minLPA || !data.salary.maxLPA) {
    errors.push("Salary with minLPA and maxLPA is required");
  }

  if (data.duration && data.duration.max < data.duration.min) {
    errors.push("Max duration must be >= min duration");
  }
  if (data.fees && data.fees.max < data.fees.min) {
    errors.push("Max fees must be >= min fees");
  }
  if (data.salary && data.salary.maxLPA < data.salary.minLPA) {
    errors.push("Max salary must be >= min salary");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Transform program for user response
 */
export const transformProgramForUser = (program) => {
  return {
    id: program._id,
    title: program.title,
    slug: program.slug,
    category: program.category,
    tags: program.tags,
    description: program.description,
    overview: program.overview,
    requiredStream: program.requiredStream,
    durationLabel: formatDurationLabel(program.duration.min, program.duration.max, program.duration.unit),
    feesLabel: formatFeesLabel(program.fees.min, program.fees.max),
    salaryLabel: formatSalaryLabel(program.salary.minLPA, program.salary.maxLPA),
    jobRoles: program.jobRoles,
    placementRate: program.placementRate,
    difficultyLevel: program.difficultyLevel,
    isFeatured: program.isFeatured,
    viewCount: program.viewCount,
  };
};

/**
 * Transform program for admin response (with full details)
 */
export const transformProgramForAdmin = (program) => {
  return {
    ...transformProgramForUser(program),
    status: program.status,
    publishedAt: program.publishedAt,
    createdBy: program.createdBy,
    updatedBy: program.updatedBy,
    entranceExams: program.entranceExams,
    topColleges: program.topColleges,
    govtOpportunities: program.govtOpportunities,
    nextPrograms: program.nextPrograms,
    ...program.toObject(),
  };
};

/**
 * Calculate statistics for programs
 */
export const calculateProgramStats = (programs) => {
  return {
    total: programs.length,
    byCategory: programs.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {}),
    byStream: programs.reduce((acc, p) => {
      acc[p.requiredStream] = (acc[p.requiredStream] || 0) + 1;
      return acc;
    }, {}),
    avgPlacementRate: Math.round(
      programs.reduce((sum, p) => sum + (p.placementRate || 0), 0) / programs.length
    ),
    avgSalaryMin: Math.round(
      programs.reduce((sum, p) => sum + (p.salary?.minLPA || 0), 0) / programs.length
    ),
    avgSalaryMax: Math.round(
      programs.reduce((sum, p) => sum + (p.salary?.maxLPA || 0), 0) / programs.length
    ),
  };
};