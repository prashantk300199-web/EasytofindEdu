import mongoose from "mongoose";

const entranceExamSchema = new mongoose.Schema(
  {
    // ============= BASIC INFO =============
    name: {
      type: String,
      required: [true, "Exam name is required"],
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
    overview: String,

    // ============= EXAM TYPE & CATEGORY =============
    type: {
      type: String,
      enum: [
        "engineering",
        "medical",
        "law",
        "banking",
        "govt",
        "management",
        "other",
      ],
      required: [true, "Exam type is required"],
      index: true,
    },

    // ============= ELIGIBILITY =============
    eligibility: {
      minQualification: {
        type: String,
        enum: ["10th_pass", "12th_pass", "bachelor", "master"],
      },
      requiredStream: String,
      minPercentage: Number,
      age: {
        min: Number,
        max: Number,
      },
      otherRequirements: String,
    },

    // ============= EXAM STRUCTURE =============
    duration: {
      preparationMonths: {
        type: Number,
        default: 6,
      },
      examDurationMinutes: Number, // Duration of actual exam
    },

    examDates: [
      {
        year: Number,
        startDate: Date,
        endDate: Date,
        registrationStartDate: Date,
        registrationEndDate: Date,
        resultDate: Date,
        _id: false,
      },
    ],

    frequency: {
      type: String,
      enum: ["once_a_year", "twice_a_year", "multiple", "ongoing"],
      default: "once_a_year",
    },

    // ============= COSTS =============
    applicationFee: {
      type: Number,
      default: 0,
    },
    coachingCost: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },

    // ============= DIFFICULTY & SUCCESS RATE =============
    difficultyLevel: {
      type: String,
      enum: ["easy", "moderate", "hard", "very_hard"],
      default: "hard",
    },

    // Success metrics
    successRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    passRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    acceptanceRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // ============= SYLLABUS & CONTENT =============
    syllabus: {
      description: String,
      topics: [String],
      totalTopics: Number,
      importantBooks: [String],
      resources: [
        {
          title: String,
          type: String, // "book", "website", "video", "course"
          url: String,
          _id: false,
        },
      ],
    },

    // ============= LINKED PROGRAMS =============
    linkedPrograms: [
      {
        programId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "CareerProgram",
        },
        isMandatory: {
          type: Boolean,
          default: false,
        },
        _id: false,
      },
    ],

    // ============= OFFICIAL DETAILS =============
    officialWebsite: String,
    registrationPortal: String,
    resultsPortal: String,
    conductingBody: String, // e.g., "NTA", "AICTE", "ICAI"

    // ============= STATS =============
    totalApplicants: {
      type: Number,
      default: 0,
    },
    qualifiedCandidates: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
    },

    // ============= LOCATION INFO =============
    examinationCenters: [String], // List of cities where exam is conducted

    // ============= STATUS =============
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },

    // ============= ADMIN METADATA =============
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
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
entranceExamSchema.index({ type: 1, status: 1 });
entranceExamSchema.index({ difficultyLevel: 1 });
entranceExamSchema.index({ slug: 1, status: 1 });

// ============= MIDDLEWARE =============
entranceExamSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = require("../utils/slugify").default(this.name);
  }
  next();
});

export default mongoose.model("EntranceExam", entranceExamSchema);