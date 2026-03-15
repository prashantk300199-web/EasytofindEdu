// Career Guidance Module - Constants & Enums
// Production-grade enum definitions

export const QUALIFICATION_LEVELS = {
  CLASS_8TH: "class_8th",
  CLASS_10TH: "class_10th",
  CLASS_12TH: "class_12th",
  DIPLOMA: "diploma",
  BACHELOR: "bachelor",
  MASTER: "master",
  PHD: "phd",
  CERTIFICATION: "certification",
};

export const STREAMS = {
  PCM: "pcm", // Physics, Chemistry, Math
  PCB: "pcb", // Physics, Chemistry, Biology
  COMMERCE: "commerce",
  ARTS: "arts",
  ENGINEERING: "engineering",
  MEDICAL: "medical",
  LAW: "law",
  MANAGEMENT: "management",
  GENERAL: "general",
};

export const EXAM_TYPES = {
  ENTRANCE_EXAM: "entrance_exam",
  COMPETITIVE_EXAM: "competitive_exam",
  PROFESSIONAL_EXAM: "professional_exam",
  CERTIFICATION_EXAM: "certification_exam",
  BOARD_EXAM: "board_exam",
};

export const COURSE_TYPES = {
  DEGREE: "degree",
  DIPLOMA: "diploma",
  CERTIFICATE: "certificate",
  SPECIALIZATION: "specialization",
  COMBINED: "combined", // Like 5-year integrated programs
};

export const FINANCIAL_CAPACITY = {
  LOW: "low", // 0-3 lakhs/year
  LOWER_MIDDLE: "lower_middle", // 3-5 lakhs/year
  MIDDLE: "middle", // 5-7 lakhs/year
  UPPER_MIDDLE: "upper_middle", // 7-10 lakhs/year
  HIGH: "high", // 10+ lakhs/year
};

export const RELOCATION_PREFERENCE = {
  YES: "yes",
  NO: "no",
  MAYBE: "maybe",
};

export const TIMEFRAME = {
  IMMEDIATE: "immediate", // 0-6 months
  SHORT_TERM: "short_term", // 6-12 months
  MEDIUM_TERM: "medium_term", // 1-2 years
  LONG_TERM: "long_term", // 2+ years
};

export const CAREER_OUTCOMES = {
  GOVERNMENT_JOB: "government_job",
  PRIVATE_JOB: "private_job",
  ENTREPRENEURSHIP: "entrepreneurship",
  FREELANCING: "freelancing",
  HIGHER_STUDIES: "higher_studies",
  PROFESSIONAL_PRACTICE: "professional_practice",
};

export const NODE_TYPES = {
  QUALIFICATION: "qualification", // 10th, 12th, etc
  STREAM_CHOICE: "stream_choice", // Choose PCM/PCB
  ENTRANCE_EXAM: "entrance_exam", // NEET, JEE
  COURSE: "course", // B.Tech, MBBS
  SPECIALIZATION: "specialization", // CSE, ECE
  PROFESSIONAL_CERT: "professional_cert", // CA, GATE
  CAREER_PATH: "career_path", // Job roles
};

export const QUESTION_TYPES = {
  SINGLE_SELECT: "single_select", // Radio buttons
  MULTI_SELECT: "multi_select", // Checkboxes
  DROPDOWN: "dropdown",
  TEXT_INPUT: "text_input",
  RANGE: "range", // Slider
};

export const QUESTION_CATEGORIES = {
  QUALIFICATION: "qualification",
  STREAM: "stream",
  RELOCATION: "relocation",
  LOCATION: "location",
  FINANCE: "finance",
  TIMEFRAME: "timeframe",
  CAREER_GOAL: "career_goal",
  EXPERTISE: "expertise",
};

export const ADMIN_CAREER_PERMISSIONS = {
  VIEW_QUESTIONS: "view_questions",
  CREATE_QUESTION: "create_question",
  EDIT_QUESTION: "edit_question",
  DELETE_QUESTION: "delete_question",
  VIEW_NODES: "view_nodes",
  CREATE_NODE: "create_node",
  EDIT_NODE: "edit_node",
  DELETE_NODE: "delete_node",
  VIEW_TREE: "view_tree",
  BULK_IMPORT: "bulk_import",
  VIEW_ANALYTICS: "view_analytics",
};

export const NODE_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  ARCHIVED: "archived",
  DRAFT: "draft",
};

export const DIFFICULTY_LEVEL = {
  EASY: "easy",
  MODERATE: "moderate",
  HARD: "hard",
  VERY_HARD: "very_hard",
};

export const SUCCESS_RATE_BENCHMARKS = {
  VERY_LOW: { min: 0, max: 10 },
  LOW: { min: 10, max: 25 },
  MODERATE: { min: 25, max: 50 },
  HIGH: { min: 50, max: 75 },
  VERY_HIGH: { min: 75, max: 100 },
};

export const COST_RANGE = {
  VERY_LOW: { min: 0, max: 50000 },
  LOW: { min: 50000, max: 150000 },
  MODERATE: { min: 150000, max: 500000 },
  HIGH: { min: 500000, max: 1500000 },
  VERY_HIGH: { min: 1500000, max: Infinity },
};

export const DURATION_UNITS = {
  MONTHS: "months",
  YEARS: "years",
};

export const VISIBILITY_STATUS = {
  PUBLIC: "public",
  RESTRICTED: "restricted", // Only for certain qualifications
  PREMIUM: "premium", // Only for premium users (future)
};

export const SORTING_OPTIONS = {
  RELEVANCE: "relevance",
  POPULARITY: "popularity",
  SUCCESS_RATE: "success_rate",
  COST_LOW_TO_HIGH: "cost_low_to_high",
  COST_HIGH_TO_LOW: "cost_high_to_low",
  DURATION_SHORT: "duration_short",
  NEWLY_ADDED: "newly_added",
};

// Default Configuration
export const DEFAULT_CONFIG = {
  MAX_RECOMMENDATIONS: 10,
  MIN_MATCH_SCORE: 50, // Percentage
  PAGINATION_LIMIT: 20,
  CACHE_TTL: 3600, // 1 hour in seconds
  ENABLE_ANALYTICS: true,
  ENABLE_AUDIT_LOG: true,
};

// Error Messages
export const CAREER_GUIDANCE_ERRORS = {
  INVALID_QUALIFICATION: "Invalid qualification level",
  INVALID_STREAM: "Invalid stream selection",
  INVALID_NODE_ID: "Node not found",
  INVALID_ANSWERS: "Invalid questionnaire answers",
  NO_RECOMMENDATIONS: "No matching career paths found",
  INSUFFICIENT_DATA: "Insufficient data for recommendations",
  UNAUTHORIZED_ADMIN: "Unauthorized - SuperAdmin access required",
  TREE_CONFLICT: "Circular dependency detected in tree",
  DUPLICATE_NODE: "Node with this title already exists",
};

// Success Messages
export const CAREER_GUIDANCE_SUCCESS = {
  QUESTIONS_RETRIEVED: "Questions retrieved successfully",
  ANSWERS_SUBMITTED: "Answers submitted successfully",
  RECOMMENDATIONS_GENERATED: "Recommendations generated successfully",
  NODE_CREATED: "Career path node created successfully",
  NODE_UPDATED: "Career path node updated successfully",
  NODE_DELETED: "Career path node deleted successfully",
  DATA_IMPORTED: "Career guidance data imported successfully",
};

// Validation Rules
export const VALIDATION_RULES = {
  MIN_TITLE_LENGTH: 3,
  MAX_TITLE_LENGTH: 200,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 5000,
  MIN_DURATION_MONTHS: 1,
  MAX_DURATION_MONTHS: 240, // 20 years
  MIN_COST: 0,
  MAX_COST: 5000000,
  MIN_SUCCESS_RATE: 0,
  MAX_SUCCESS_RATE: 100,
  MIN_SYLLABUS_ITEMS: 1,
  MAX_SYLLABUS_ITEMS: 100,
};

// Performance & Caching
export const CACHE_KEYS = {
  FEATURED_COURSES: "featured_courses",
  ALL_QUESTIONS: "all_questions",
  TREE_STRUCTURE: "tree_structure",
  NODE_DETAILS: (nodeId) => `node_details_${nodeId}`,
  RECOMMENDATIONS: (studentId) => `recommendations_${studentId}`,
};

export default {
  QUALIFICATION_LEVELS,
  STREAMS,
  EXAM_TYPES,
  COURSE_TYPES,
  FINANCIAL_CAPACITY,
  RELOCATION_PREFERENCE,
  TIMEFRAME,
  CAREER_OUTCOMES,
  NODE_TYPES,
  QUESTION_TYPES,
  QUESTION_CATEGORIES,
  ADMIN_CAREER_PERMISSIONS,
  NODE_STATUS,
  DIFFICULTY_LEVEL,
  SUCCESS_RATE_BENCHMARKS,
  COST_RANGE,
  DURATION_UNITS,
  VISIBILITY_STATUS,
  SORTING_OPTIONS,
  DEFAULT_CONFIG,
  CAREER_GUIDANCE_ERRORS,
  CAREER_GUIDANCE_SUCCESS,
  VALIDATION_RULES,
  CACHE_KEYS,
};