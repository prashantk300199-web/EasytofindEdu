import Joi from "joi";
import {
  NODE_TYPES,
  NODE_STATUS,
  DIFFICULTY_LEVEL,
  STREAMS,
  QUALIFICATION_LEVELS,
  FINANCIAL_CAPACITY,
  TIMEFRAME,
} from "../constants/careerGuidance.constants.js";

const eligibilitySchema = Joi.object({
  qualifications: Joi.array().items(Joi.string()),
  minPercentage: Joi.number().min(0).max(100),
  streams: Joi.array().items(Joi.string()),
  minAge: Joi.number().min(0).max(120),
  maxAge: Joi.number().min(0).max(120),
  otherRequirements: Joi.string().max(500),
});

const durationSchema = Joi.object({
  value: Joi.number().required().min(1).max(240),
  unit: Joi.string().valid("months", "years").required(),
});

const costSchema = Joi.object({
  min: Joi.number().min(0),
  max: Joi.number().min(0),
  average: Joi.number().min(0),
  currency: Joi.string().default("INR"),
  frequency: Joi.string().valid("one-time", "per-year").default("per-year"),
  note: Joi.string(),
});

const syllabusSchema = Joi.object({
  description: Joi.string().optional(),
  topics: Joi.array().items(Joi.string()).min(1),
  totalTopics: Joi.number(),
  downloadUrl: Joi.string().uri().optional(),
});

const successMetricsSchema = Joi.object({
  successRate: Joi.number().min(0).max(100),
  passRate: Joi.number().min(0).max(100),
  placementRate: Joi.number().min(0).max(100),
  averagePackage: Joi.number().min(0),
  highestPackage: Joi.number().min(0),
});

const careerOutcomeSchema = Joi.object({
  role: Joi.string().required(),
  avgSalaryMin: Joi.number().min(0),
  avgSalaryMax: Joi.number().min(0),
  currency: Joi.string(),
  industryDemand: Joi.string().valid("high", "medium", "low"),
  companies: Joi.array().items(Joi.string()),
});

const institutionSchema = Joi.object({
  name: Joi.string().required(),
  location: Joi.string(),
  ranking: Joi.number(),
  cutoff: Joi.number(),
  website: Joi.string().uri().optional(),
});

export const createCareerNodeValidator = Joi.object({
  title: Joi.string().required().trim().max(200),
  nodeType: Joi.string()
    .required()
    .valid(...Object.values(NODE_TYPES)),
  description: Joi.string().optional().max(2000),
  overview: Joi.string().optional().max(5000),

  eligibility: eligibilitySchema.optional(),
  duration: durationSchema.required(),
  cost: costSchema.optional(),

  syllabus: syllabusSchema.optional(),
  successMetrics: successMetricsSchema.optional(),
  careerOutcomes: Joi.array().items(careerOutcomeSchema).optional(),

  difficultyLevel: Joi.string()
    .optional()
    .valid(...Object.values(DIFFICULTY_LEVEL)),

  topInstitutions: Joi.array().items(institutionSchema).optional(),

  prerequisiteNodeIds: Joi.array()
    .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
    .optional(),
  nextNodeIds: Joi.array()
    .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
    .optional(),
  parentNodeId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),

  applicableQualifications: Joi.array().items(Joi.string()).optional(),
  applicableStreams: Joi.array().items(Joi.string()).optional(),
  applicableFinancialCategories: Joi.array().items(Joi.string()).optional(),
  applicableRegions: Joi.array().items(Joi.string()).optional(),
  applicableTimeframes: Joi.array().items(Joi.string()).optional(),

  keywords: Joi.array().items(Joi.string()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),

  isFeatured: Joi.boolean().default(false),

  externalLinks: Joi.array()
    .items(
      Joi.object({
        title: Joi.string(),
        url: Joi.string().uri().required(),
        type: Joi.string(),
      })
    )
    .optional(),
});

export const updateCareerNodeValidator = Joi.object({
  title: Joi.string().optional().trim().max(200),
  description: Joi.string().optional().max(2000),
  overview: Joi.string().optional().max(5000),
  eligibility: eligibilitySchema.optional(),
  duration: durationSchema.optional(),
  cost: costSchema.optional(),
  syllabus: syllabusSchema.optional(),
  successMetrics: successMetricsSchema.optional(),
  careerOutcomes: Joi.array().items(careerOutcomeSchema).optional(),
  difficultyLevel: Joi.string()
    .optional()
    .valid(...Object.values(DIFFICULTY_LEVEL)),
  topInstitutions: Joi.array().items(institutionSchema).optional(),
  prerequisiteNodeIds: Joi.array()
    .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
    .optional(),
  nextNodeIds: Joi.array()
    .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
    .optional(),
  applicableQualifications: Joi.array().items(Joi.string()).optional(),
  applicableStreams: Joi.array().items(Joi.string()).optional(),
  applicableFinancialCategories: Joi.array().items(Joi.string()).optional(),
  applicableRegions: Joi.array().items(Joi.string()).optional(),
  applicableTimeframes: Joi.array().items(Joi.string()).optional(),
  keywords: Joi.array().items(Joi.string()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  isFeatured: Joi.boolean().optional(),
  status: Joi.string()
    .optional()
    .valid(...Object.values(NODE_STATUS)),
  externalLinks: Joi.array()
    .items(
      Joi.object({
        title: Joi.string(),
        url: Joi.string().uri().required(),
        type: Joi.string(),
      })
    )
    .optional(),
}).min(1);

export default {
  createCareerNodeValidator,
  updateCareerNodeValidator,
};