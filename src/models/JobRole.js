import mongoose from "mongoose";

const jobRoleSchema = new mongoose.Schema(
  {
    // ============= BASIC INFO =============
    title: {
      type: String,
      required: [true, "Job role title is required"],
      unique: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: String,
    responsibilities: [String],

    // ============= SALARY & COMPENSATION =============
    salary: {
      entryLevelLPA: {
        type: Number,
        default: 0,
      },
      midLevelLPA: {
        type: Number,
        default: 0,
      },
      seniorLevelLPA: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: "INR",
      },
    },

    // ============= INDUSTRY & SECTORS =============
    industries: [String], // e.g., ["IT", "Finance", "Healthcare", "Retail"]
    sectors: [String],

    // ============= SKILLS REQUIRED =============
    requiredSkills: [
      {
        skillName: String,
        proficiency: {
          type: String,
          enum: ["beginner", "intermediate", "advanced", "expert"],
        },
        _id: false,
      },
    ],
    technicalSkills: [String],
    softSkills: [String],

    // ============= QUALIFICATIONS =============
    requiredEducation: [String], // e.g., ["B.Tech", "B.Com", "MBA"]
    preferredCertifications: [String],

    // ============= EXPERIENCE =============
    minExperienceYears: {
      type: Number,
      default: 0,
    },
    maxExperienceYears: Number,

    // ============= CAREER GROWTH =============
    demandLevel: {
      type: String,
      enum: ["low", "moderate", "high", "very_high"],
      default: "moderate",
      index: true,
    },
    growthPotential: {
      type: String,
      enum: ["low", "moderate", "high", "very_high"],
    },
    futureGrowthDescription: String,

    // ============= JOB AVAILABILITY =============
    companiesHiring: [String], // e.g., ["Google", "Amazon", "Microsoft"]
    openPositions: {
      type: Number,
      default: 0,
    },
    jobMarketOutlook: String,

    // ============= LINKED PROGRAMS =============
    linkedPrograms: [
      {
        programId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "CareerProgram",
        },
        _id: false,
      },
    ],

    // ============= CAREER PATHS =============
    entryPoints: [String], // Programs that lead to this role
    promotionPath: [String], // Next roles after this one
    alternativeRoles: [String], // Similar roles

    // ============= WORK ENVIRONMENT =============
    workEnvironment: {
      type: String,
      enum: ["office", "remote", "hybrid", "field"],
    },
    workLifeBalance: {
      type: String,
      enum: ["excellent", "good", "moderate", "demanding"],
    },
    travelRequired: Boolean,

    // ============= STATUS =============
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
      index: true,
    },

    // ============= ADMIN METADATA =============
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },

    // ============= ANALYTICS =============
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ============= INDEXES =============
jobRoleSchema.index({ industries: 1, status: 1 });
jobRoleSchema.index({ demandLevel: 1, status: 1 });
jobRoleSchema.index({ slug: 1, status: 1 });

// ============= MIDDLEWARE =============
jobRoleSchema.pre("save", function (next) {
  if (this.isModified("title")) {
    this.slug = require("../utils/slugify").default(this.title);
  }
  next();
});

// ============= STATICS =============
jobRoleSchema.statics.getHighDemandRoles = async function (limit = 10) {
  return this.find({ status: "published", demandLevel: "very_high" })
    .limit(limit)
    .select("title slug salary industries requiredSkills");
};

export default mongoose.model("JobRole", jobRoleSchema);