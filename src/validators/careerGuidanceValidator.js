import Joi from "joi";
import {
  QUESTION_TYPES,
  QUESTION_CATEGORIES,
  QUALIFICATION_LEVELS,
  STREAMS,
  FINANCIAL_CAPACITY,
  RELOCATION_PREFERENCE,
  TIMEFRAME,
} from "../constants/careerGuidance.constants.js";

// ============= QUESTION VALIDATORS =============

export const createQuestionValidator = Joi.object({
  questionNumber: Joi.number().required().min(1).max(1000),
  questionText: Joi.string().required().trim().max(500),
  questionType: Joi.string()
    .required()
    .valid(...Object.values(QUESTION_TYPES)),
  category: Joi.string()
    .required()
    .valid(...Object.values(QUESTION_CATEGORIES)),
  options: Joi.array()
    .items(
      Joi.object({
        label: Joi.string().required().trim(),
        value: Joi.string().required().trim().lowercase(),
        description: Joi.string().optional(),
      })
    )
    .when("questionType", {
      is: Joi.string().valid(
        QUESTION_TYPES.SINGLE_SELECT,
        QUESTION_TYPES.MULTI_SELECT,
        QUESTION_TYPES.DROPDOWN
      ),
      then: Joi.array().required().min(1),
      otherwise: Joi.array().optional(),
    }),
  isRequired: Joi.boolean().default(false),
  minSelections: Joi.number().min(0).default(0),
  maxSelections: Joi.number().min(0),
  helpText: Joi.string().optional().max(300),
  placeholder: Joi.string().optional(),
  isActive: Joi.boolean().default(true),
  displayOrder: Joi.number().default(0),
  tags: Joi.array().items(Joi.string()),
});

export const updateQuestionValidator = Joi.object({
  questionText: Joi.string().optional().trim().max(500),
  questionType: Joi.string()
    .optional()
    .valid(...Object.values(QUESTION_TYPES)),
  category: Joi.string()
    .optional()
    .valid(...Object.values(QUESTION_CATEGORIES)),
  options: Joi.array()
    .optional()
    .items(
      Joi.object({
        label: Joi.string().required().trim(),
        value: Joi.string().required().trim().lowercase(),
        description: Joi.string().optional(),
      })
    ),
  isRequired: Joi.boolean(),
  minSelections: Joi.number().min(0),
  maxSelections: Joi.number().min(0),
  helpText: Joi.string().optional().max(300),
  placeholder: Joi.string().optional(),
  isActive: Joi.boolean(),
  displayOrder: Joi.number(),
  tags: Joi.array().items(Joi.string()),
}).min(1);

// ============= ANSWER SUBMISSION VALIDATOR =============

export const submitAnswersValidator = Joi.object({
  answers: Joi.object({
    qualification: Joi.string()
      .required()
      .valid(...Object.values(QUALIFICATION_LEVELS)),
    stream: Joi.string().optional().valid(...Object.values(STREAMS)),
    relocationWilling: Joi.string()
      .optional()
      .valid(...Object.values(RELOCATION_PREFERENCE)),
    preferredCities: Joi.array()
      .optional()
      .items(Joi.string().trim())
      .max(5),
    financialCapacity: Joi.string()
      .optional()
      .valid(...Object.values(FINANCIAL_CAPACITY)),
    timeframe: Joi.string()
      .optional()
      .valid(...Object.values(TIMEFRAME)),
    careerGoal: Joi.string().optional().trim().max(200),
    expertiseSubject: Joi.string().optional().trim().max(100),
    customAnswers: Joi.object().optional(),
  }).required(),
});

// ============= SEARCH & FILTER VALIDATOR =============

export const searchCoursesValidator = Joi.object({
  query: Joi.string().optional().trim().max(100),
  qualification: Joi.string()
    .optional()
    .valid(...Object.values(QUALIFICATION_LEVELS)),
  stream: Joi.string().optional().valid(...Object.values(STREAMS)),
  minCost: Joi.number().optional().min(0),
  maxCost: Joi.number().optional().min(0),
  minSuccessRate: Joi.number().optional().min(0).max(100),
  maxSuccessRate: Joi.number().optional().min(0).max(100),
  duration: Joi.number().optional().min(1).max(240),
  region: Joi.string().optional(),
  sortBy: Joi.string()
    .optional()
    .valid(
      "relevance",
      "popularity",
      "success_rate",
      "cost_low_to_high",
      "cost_high_to_low",
      "duration_short"
    ),
  page: Joi.number().optional().min(1).default(1),
  limit: Joi.number().optional().min(1).max(100).default(20),
});

// ============= SAVE PATH VALIDATOR =============

export const savePathValidator = Joi.object({
  nodeId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/).messages({
    "string.pattern.base": "Invalid Node ID format",
  }),
  status: Joi.string()
    .optional()
    .valid("interested", "exploring", "decided", "pursuing"),
  notes: Joi.string().optional().max(500),
});

// ============= PAGINATION VALIDATOR =============

export const paginationValidator = Joi.object({
  page: Joi.number().optional().min(1).default(1),
  limit: Joi.number().optional().min(1).max(100).default(20),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().optional().valid("asc", "desc").default("desc"),
});

export default {
  createQuestionValidator,
  updateQuestionValidator,
  submitAnswersValidator,
  searchCoursesValidator,
  savePathValidator,
  paginationValidator,
};