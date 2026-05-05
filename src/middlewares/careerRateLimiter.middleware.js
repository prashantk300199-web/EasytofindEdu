import rateLimit from "express-rate-limit";

// Rate limiters for career guidance public endpoints
export const careerPublicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  keyGenerator: (req) => req.ip,
  validate: false,
  message:
    "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => req.user && req.user.role === "admin", // Skip for admins
});

export const questionSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Each user can submit answers 10 times per hour
  keyGenerator: (req) => {
    // Use studentId if logged in, otherwise use IP
    return (req.user?._id?.toString()) || req.ip;
  },
  validate: false,
  message: "Too many questionnaire submissions, please try again later",
});

export const searchLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 searches per 5 minutes
  keyGenerator: (req) => {
    return (req.user?._id?.toString()) || req.ip;
  },
  validate: false,
  message: "Too many search requests, please try again later",
});

export const adminModificationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 modifications per minute
  keyGenerator: (req) => (req.admin?._id?.toString()) || req.ip,
  validate: false,
  message: "Too many modifications, please try again later",
  skip: (req) => {
    // Only apply to non-superadmin users
    return req.admin?.role === "superadmin";
  },
});

export const bulkImportLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // 5 bulk imports per day
  keyGenerator: (req) => (req.admin?._id?.toString()) || req.ip,
  validate: false,
  message: "Bulk import limit exceeded. Try again tomorrow",
});

export default {
  careerPublicLimiter,
  questionSubmissionLimiter,
  searchLimiter,
  adminModificationLimiter,
  bulkImportLimiter,
};
