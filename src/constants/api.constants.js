/**
 * API Constants and Configuration
 * Production-grade constants for the Vidya Marg API
 */

// API Version
export const API_VERSION = "1.0.0";
export const API_PREFIX = "/api/v1";

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  RATE_LIMIT_EXCEEDED: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Request/Response Headers
export const HEADERS = {
  REQUEST_ID: "X-Request-ID",
  RESPONSE_TIME: "X-Response-Time",
  RATE_LIMIT: "X-RateLimit-Limit",
  RATE_LIMIT_REMAINING: "X-RateLimit-Remaining",
  RATE_LIMIT_RESET: "X-RateLimit-Reset",
  CONTENT_TYPE: "Content-Type",
  AUTHORIZATION: "Authorization",
};

// Hostel Constants
export const HOSTEL_CONSTANTS = {
  MIN_NAME_LENGTH: 3,
  MAX_NAME_LENGTH: 200,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_PHOTOS: 5,
  MIN_PHOTOS: 1,
  MAX_CUSTOM_RULES: 10,
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MIN_LIMIT: 1,
  MAX_LIMIT: 100,
};

// File Upload
export const FILE_UPLOAD = {
  PROFILE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  HOSTEL_PHOTO_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIMES: ["image/jpeg", "image/png", "image/webp"],
  MAX_PHOTOS_PER_REQUEST: 5,
};

// Rate Limiting (requests per window)
export const RATE_LIMITS = {
  AUTH: {
    requests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  HOSTEL_CREATE: {
    requests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  HOSTEL_UPDATE: {
    requests: 30,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  HOSTEL_LIST: {
    requests: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  DEFAULT: {
    requests: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
};

// Hostel Status
export const HOSTEL_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  DELETED: "deleted",
};

// User Roles
export const USER_ROLES = {
  OWNER: "owner",
  CUSTOMER: "customer",
  ADMIN: "admin",
  SUPER_ADMIN: "superadmin",
};

// Account Status
export const ACCOUNT_STATUS = {
  ACTIVE: "active",
  BLOCKED: "blocked",
  SUSPENDED: "suspended",
  DELETED: "deleted",
};

// Error Codes
export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMIT: "RATE_LIMIT",
  FILE_UPLOAD_ERROR: "FILE_UPLOAD_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
};

// Email Templates
export const EMAIL_TEMPLATES = {
  HOSTEL_CREATED: "hostel_created",
  HOSTEL_APPROVED: "hostel_approved",
  HOSTEL_REJECTED: "hostel_rejected",
  NEW_LEAD: "new_lead",
  BOOKING_REQUEST: "booking_request",
  BOOKING_CONFIRMED: "booking_confirmed",
};

// Cache Keys
export const CACHE_KEYS = {
  HOSTEL: (id) => `hostel:${id}`,
  HOSTELS_BY_OWNER: (userId) => `hostels:owner:${userId}`,
  HOSTEL_ANALYTICS: (id) => `analytics:${id}`,
  SEARCH_RESULTS: (query) => `search:${query}`,
};

// Cache Durations (in seconds)
export const CACHE_DURATION = {
  SHORT: 5 * 60, // 5 minutes
  MEDIUM: 30 * 60, // 30 minutes
  LONG: 60 * 60, // 1 hour
  VERY_LONG: 24 * 60 * 60, // 1 day
};

// Validation Messages
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: "This field is required",
  INVALID_FORMAT: "Invalid format",
  MIN_LENGTH: (min) => `Minimum ${min} characters required`,
  MAX_LENGTH: (max) => `Maximum ${max} characters allowed`,
  INVALID_EMAIL: "Invalid email address",
  INVALID_PHONE: "Invalid phone number",
  INVALID_URL: "Invalid URL format",
  PASSWORD_WEAK: "Password must be at least 8 characters with uppercase, lowercase, number, and special character",
};

// Logging Levels
export const LOG_LEVELS = {
  DEBUG: "DEBUG",
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
  CRITICAL: "CRITICAL",
};

// Environment
export const ENVIRONMENTS = {
  DEVELOPMENT: "development",
  STAGING: "staging",
  PRODUCTION: "production",
};

export default {
  API_VERSION,
  API_PREFIX,
  HTTP_STATUS,
  HEADERS,
  HOSTEL_CONSTANTS,
  PAGINATION,
  FILE_UPLOAD,
  RATE_LIMITS,
  HOSTEL_STATUS,
  USER_ROLES,
  ACCOUNT_STATUS,
  ERROR_CODES,
  EMAIL_TEMPLATES,
  CACHE_KEYS,
  CACHE_DURATION,
  VALIDATION_MESSAGES,
  LOG_LEVELS,
  ENVIRONMENTS,
};
