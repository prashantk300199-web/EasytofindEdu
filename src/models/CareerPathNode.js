import mongoose from "mongoose";
import {
  NODE_TYPES,
  NODE_STATUS,
  DIFFICULTY_LEVEL,
  COST_RANGE,
} from "../constants/careerGuidance.constants.js";

const eligibilitySchema = new mongoose.Schema(
  {
    qualifications: [String],
    minPercentage: Number,
    streams: [String],
    minAge: Number,
    maxAge: Number,
    otherRequirements: String,
  },
  { _id: false }
);

const durationSchema = new mongoose.Schema(
  {
    value: Number,
    unit: { type: String, enum: ["months", "years"], default: "years" },
  },
  { _id: false }
);

const costSchema = new mongoose.Schema(
  {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    average: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    frequency: { type: String, enum: ["one-time", "per-year"], default: "per-year" },
    note: String,
  },
  { _id: false }
);

const careerOutcomeSchema = new mongoose.Schema(
  {
    role: String,
    avgSalaryMin: Number,
    avgSalaryMax: Number,
    currency: String,
    industryDemand: String, // high, medium, low
    companies: [String],
  },
  { _id: false }
);

const careerPathNodeSchema = new mongoose.Schema(
  {
    // Basic Info
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      unique: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    nodeType: {
      type: String,
      enum: Object.values(NODE_TYPES),
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(NODE_STATUS),
      default: NODE_STATUS.ACTIVE,
      index: true,
    },

    // Description
    description: {
      type: String,
      maxlength: 2000,
    },
    overview: {
      type: String,
      maxlength: 5000,
    },

    // Eligibility
    eligibility: {
      type: eligibilitySchema,
      default: {},
    },

    // Duration
    duration: {
      type: durationSchema,
      required: true,
    },

    // Cost/Fees
    cost: {
      type: costSchema,
      default: {},
    },

    // Content Details
    syllabus: {
      description: String,
      topics: [String],
      totalTopics: Number,
      downloadUrl: String,
    },

    successMetrics: {
      successRate: { type: Number, min: 0, max: 100 },
      passRate: { type: Number, min: 0, max: 100 },
      placementRate: { type: Number, min: 0, max: 100 },
      averagePackage: Number,
      highestPackage: Number,
    },

    careerOutcomes: [careerOutcomeSchema],

    // Difficulty & Reputation
    difficultyLevel: {
      type: String,
      enum: Object.values(DIFFICULTY_LEVEL),
      default: DIFFICULTY_LEVEL.MODERATE,
    },

    // Top Institutions
    topInstitutions: [
      {
        name: String,
        location: String,
        ranking: Number,
        cutoff: Number,
        website: String,
      },
    ],

    // Tree Structure
    prerequisiteNodeIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CareerPathNode",
      },
    ],
    nextNodeIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CareerPathNode",
      },
    ],
    parentNodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CareerPathNode",
      index: true,
    },
    level: {
      type: Number,
      default: 1, // Depth in tree
      index: true,
    },

    // Applicability Filters
    applicableQualifications: [String],
    applicableStreams: [String],
    applicableFinancialCategories: [String], // low, medium, high
    applicableRegions: [String],
    applicableTimeframes: [String],

    // Media
    thumbnail: {
      url: String,
      publicId: String,
    },
    coverImage: {
      url: String,
      publicId: String,
    },

    // SEO & Discoverability
    keywords: [String],
    tags: [String],
    popularityScore: {
      type: Number,
      default: 0,
      index: true,
    },

    // Analytics
    viewCount: {
      type: Number,
      default: 0,
    },
    clickCount: {
      type: Number,
      default: 0,
    },
    saveCount: {
      type: Number,
      default: 0,
    },

    // Admin Info
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },

    // Verification
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: mongoose.Schema.Types.ObjectId,
    verificationDate: Date,

    // Featured Node
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    // External References
    externalLinks: [
      {
        title: String,
        url: String,
        type: String, // resource, official_site, etc
      },
    ],
  },
  {
    timestamps: true,
    indexes: [
      { title: 1 },
      { slug: 1 },
      { nodeType: 1, status: 1 },
      { isFeatured: 1, status: 1 },
      { level: 1 },
      { createdAt: -1 },
    ],
  }
);

// Compound indexes for common queries
careerPathNodeSchema.index({ nodeType: 1, status: 1, isFeatured: 1 });
careerPathNodeSchema.index({ parentNodeId: 1, status: 1 });

// Methods
careerPathNodeSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

careerPathNodeSchema.methods.isEligible = function (studentProfile) {
  // Check if student meets eligibility criteria
  if (
    this.eligibility.qualifications &&
    !this.eligibility.qualifications.includes(studentProfile.lastQualification)
  ) {
    return false;
  }

  if (
    this.eligibility.streams &&
    !this.eligibility.streams.includes(studentProfile.stream)
  ) {
    return false;
  }

  return true;
};

careerPathNodeSchema.methods.matchScore = function (filters) {
  // Calculate match score based on filters
  let score = 100;

  if (
    filters.financialCapacity &&
    this.applicableFinancialCategories?.includes(filters.financialCapacity)
  ) {
    score += 10;
  }

  if (
    filters.preferredCities &&
    this.applicableRegions?.some((r) => filters.preferredCities.includes(r))
  ) {
    score += 15;
  }

  if (
    filters.timeframe &&
    this.applicableTimeframes?.includes(filters.timeframe)
  ) {
    score += 10;
  }

  return Math.min(score, 100);
};

const CareerPathNode = mongoose.model("CareerPathNode", careerPathNodeSchema);

export default CareerPathNode;