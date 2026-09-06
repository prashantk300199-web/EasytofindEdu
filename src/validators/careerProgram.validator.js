import { body } from "express-validator";

/**
 * Validation rules for creating a career program
 */
export const createProgramValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters"),

  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isIn([
      "Diploma & Skill",
      "Engineering",
      "Medical & Allied",
      "Science",
      "Commerce",
      "Arts & Humanities",
      "Law",
      "Professional Certification",
      "Postgraduate",
      "Specialization",
      "ITI Trade",
      "Other",
    ])
    .withMessage("Invalid category"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),

  body("overview")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Overview cannot exceed 2000 characters"),

  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array"),

  body("requiredStream")
    .optional()
    .isIn(["pcm", "pcb", "commerce", "arts", "any"])
    .withMessage("Invalid stream"),

  body("requiredQualification")
    .optional()
    .isIn(["10th_pass", "12th_pass", "bachelor", "master", "phd", "any"])
    .withMessage("Invalid qualification"),

  body("minPercentage")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Min percentage must be between 0 and 100"),

  // Duration validation
  body("duration.min")
    .notEmpty()
    .withMessage("Duration min is required")
    .isInt({ min: 1 })
    .withMessage("Duration min must be at least 1"),

  body("duration.max")
    .notEmpty()
    .withMessage("Duration max is required")
    .isInt({ min: 1 })
    .withMessage("Duration max must be at least 1"),

  body("duration.unit")
    .optional()
    .isIn(["months", "years"])
    .withMessage("Duration unit must be months or years"),

  // Custom validator: max >= min
  body("duration")
    .custom((duration) => {
      if (duration.max < duration.min) {
        throw new Error("Max duration must be >= min duration");
      }
      return true;
    }),

  // Fees validation
  body("fees.min")
    .notEmpty()
    .withMessage("Fees min is required")
    .isInt({ min: 0 })
    .withMessage("Fees min must be >= 0"),

  body("fees.max")
    .notEmpty()
    .withMessage("Fees max is required")
    .isInt({ min: 0 })
    .withMessage("Fees max must be >= 0"),

  body("fees.frequency")
    .optional()
    .isIn(["per-year", "one-time", "per-month"])
    .withMessage("Invalid frequency"),

  // Custom validator: fees max >= min
  body("fees")
    .custom((fees) => {
      if (fees.max < fees.min) {
        throw new Error("Max fee must be >= min fee");
      }
      return true;
    }),

  // Salary validation
  body("salary.minLPA")
    .notEmpty()
    .withMessage("Salary minLPA is required")
    .isFloat({ min: 0 })
    .withMessage("Salary must be >= 0"),

  body("salary.maxLPA")
    .notEmpty()
    .withMessage("Salary maxLPA is required")
    .isFloat({ min: 0 })
    .withMessage("Salary must be >= 0"),

  // Custom validator: salary max >= min
  body("salary")
    .custom((salary) => {
      if (salary.maxLPA < salary.minLPA) {
        throw new Error("Max salary must be >= min salary");
      }
      return true;
    }),

  body("placementRate")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Placement rate must be between 0 and 100"),

  body("difficultyLevel")
    .optional()
    .isIn(["easy", "moderate", "hard", "very_hard"])
    .withMessage("Invalid difficulty level"),

  body("industryDemand")
    .optional()
    .isIn(["very_low", "low", "moderate", "high", "very_high"])
    .withMessage("Invalid industry demand"),

  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage("isFeatured must be boolean"),
];

/**
 * Validation rules for updating a career program
 */
export const updateProgramValidator = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters"),

  body("category")
    .optional()
    .isIn([
      "Diploma & Skill",
      "Engineering",
      "Medical & Allied",
      "Science",
      "Commerce",
      "Arts & Humanities",
      "Law",
      "Professional Certification",
      "Postgraduate",
      "Specialization",
      "ITI Trade",
      "Other",
    ])
    .withMessage("Invalid category"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),

  body("overview")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Overview cannot exceed 2000 characters"),

  body("requiredStream")
    .optional()
    .isIn(["pcm", "pcb", "commerce", "arts", "any"])
    .withMessage("Invalid stream"),

  body("status")
    .optional()
    .isIn(["draft", "published", "archived"])
    .withMessage("Invalid status"),

  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage("isFeatured must be boolean"),
];

/**
 * Validation rules for exam operations
 */
export const createExamValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Exam name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Exam name must be between 2 and 100 characters"),

  body("type")
    .notEmpty()
    .withMessage("Exam type is required")
    .isIn(["engineering", "medical", "law", "banking", "govt", "management", "other"])
    .withMessage("Invalid exam type"),

  body("description")
    .optional()
    .trim(),

  body("difficultyLevel")
    .optional()
    .isIn(["easy", "moderate", "hard", "very_hard"])
    .withMessage("Invalid difficulty level"),

  body("successRate")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Success rate must be between 0 and 100"),

  body("passRate")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Pass rate must be between 0 and 100"),

  body("applicationFee")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Application fee must be >= 0"),
];

/**
 * Validation rules for college operations
 */
export const createCollegeValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("College name is required")
    .isLength({ min: 2, max: 200 })
    .withMessage("College name must be between 2 and 200 characters"),

  body("location.city")
    .notEmpty()
    .withMessage("City is required"),

  body("location.state")
    .notEmpty()
    .withMessage("State is required"),

  body("collegeType")
    .notEmpty()
    .withMessage("College type is required")
    .isIn(["govt", "private", "deemed", "autonomous", "national"])
    .withMessage("Invalid college type"),

  body("placements.placementRate")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Placement rate must be between 0 and 100"),

  body("placements.averagePackage")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Average package must be >= 0"),

  body("contact.website")
    .optional()
    .isURL()
    .withMessage("Website must be a valid URL"),
];