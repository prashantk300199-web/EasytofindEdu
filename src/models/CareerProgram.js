import mongoose from "mongoose";

const careerProgramSchema = new mongoose.Schema(
  {
    // ============= BASIC INFO =============
    title: {
      type: String,
      required: [true, "Program title is required"],
      trim: true,
      unique: true,
      index: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
      minlength: [3, "Title must be at least 3 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    overview: {
      type: String,
      maxlength: [2000, "Overview cannot exceed 2000 characters"],
    },

    // ============= CATEGORIZATION =============
    category: {
      type: String,
      enum: [
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
      ],
      required: [true, "Category is required"],
      index: true,
    },
    tags: [
      {
        type: String,
        enum: [
          "after_10th",
          "after_12th",
          "pcm",
          "pcb",
          "commerce",
          "arts",
          "not_sure",
          "featured",
          "trending",
          "high_placement",
        ],
        index: true,
      },
    ],

    // ============= REQUIREMENTS =============
    requiredQualification: {
      type: String,
      enum: ["10th_pass", "12th_pass", "bachelor", "master", "phd", "any"],
      default: "12th_pass",
      index: true,
    },
    requiredStream: {
      type: String,
      enum: ["pcm", "pcb", "commerce", "arts", "any"],
      default: "any",
      index: true,
    },
    minPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    otherEligibility: String,

    // ============= DURATION =============
    duration: {
      min: {
        type: Number,
        required: [true, "Minimum duration is required"],
        min: 1,
      },
      max: {
        type: Number,
        required: [true, "Maximum duration is required"],
        min: 1,
      },
      unit: {
        type: String,
        enum: ["months", "years"],
        default: "months",
      },
    },

    // ============= COST/FEES =============
    fees: {
      min: {
        type: Number,
        required: [true, "Minimum fee is required"],
        min: 0,
      },
      max: {
        type: Number,
        required: [true, "Maximum fee is required"],
        min: 0,
      },
      average: Number,
      currency: {
        type: String,
        default: "INR",
      },
      frequency: {
        type: String,
        enum: ["per-year", "one-time", "per-month"],
        default: "per-year",
      },
    },

    // ============= SALARY/OUTCOME =============
    salary: {
      minLPA: {
        type: Number,
        required: [true, "Minimum salary is required"],
        min: 0,
      },
      maxLPA: {
        type: Number,
        required: [true, "Maximum salary is required"],
        min: 0,
      },
      currency: {
        type: String,
        default: "INR",
      },
    },

    // ============= JOB OUTCOMES =============
    jobRoles: [
      {
        title: {
          type: String,
          required: true,
        },
        description: String,
        avgSalaryLPA: Number,
        demandLevel: {
          type: String,
          enum: ["low", "moderate", "high", "very_high"],
        },
        _id: false,
      },
    ],
    placementRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // ============= ENTRANCE EXAMS (References) =============
    entranceExams: [
      {
        examId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "EntranceExam",
          required: true,
        },
        isMandatory: {
          type: Boolean,
          default: false,
        },
        notes: String,
        _id: false,
      },
    ],

    // ============= TOP COLLEGES (References) =============
    topColleges: [
      {
        collegeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "College",
          required: true,
        },
        rank: Number,
        cutoff: String, // e.g., "JEE Main score: 98"
        _id: false,
      },
    ],

    // ============= GOVT OPPORTUNITIES =============
    govtOpportunities: [
      {
        title: String,
        description: String,
        examName: String,
        salaryRange: String,
        department: String,
        link: String,
        _id: false,
      },
    ],

    // ============= CAREER PATH =============
    futureGrowth: String,
    growthRate: {
      type: String,
      enum: ["Excellent", "Good", "Steady", "Declining"],
    },
    growthDescription: String,

    // ============= NEXT STEPS (Link to other programs) =============
    nextPrograms: [
      {
        programId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "CareerProgram",
        },
        relationship: {
          type: String,
          enum: [
            "specialization",
            "postgraduate",
            "certification",
            "skill_add",
            "related",
          ],
        },
        notes: String,
        _id: false,
      },
    ],

    // ============= PREREQUISITES =============
    prerequisitePrograms: [
      {
        programId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "CareerProgram",
        },
        _id: false,
      },
    ],

    // ============= DIFFICULTY & DEMAND =============
    difficultyLevel: {
      type: String,
      enum: ["easy", "moderate", "hard", "very_hard"],
      default: "moderate",
    },
    industryDemand: {
      type: String,
      enum: ["very_low", "low", "moderate", "high", "very_high"],
      default: "moderate",
      index: true,
    },

    // ============= DISPLAY & FEATURED =============
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isHighlighted: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 999,
    },

    // ============= STATUS =============
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    publishedAt: Date,

    // ============= SEO =============
    seoTitle: String,
    seoDescription: String,
    seoKeywords: [String],

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
    notes: String, // Internal admin notes

    // ============= ANALYTICS =============
    viewCount: {
      type: Number,
      default: 0,
    },
    clickCount: {
      type: Number,
      default: 0,
    },
    searchCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============= INDEXES =============
careerProgramSchema.index({ category: 1, status: 1 });
careerProgramSchema.index({ tags: 1, status: 1 });
careerProgramSchema.index({ requiredStream: 1, status: 1 });
careerProgramSchema.index({ isFeatured: 1, status: 1 });
careerProgramSchema.index({ industryDemand: 1, status: 1 });
careerProgramSchema.index({ createdAt: -1 });
careerProgramSchema.index({ slug: 1, status: 1 });

// ============= VIRTUALS =============
careerProgramSchema.virtual("durationLabel").get(function () {
  return `${this.duration.min}${this.duration.min === this.duration.max ? "" : "-" + this.duration.max} ${this.duration.unit}`;
});

careerProgramSchema.virtual("feesLabel").get(function () {
  return `₹${(this.fees.min / 100000).toFixed(2)}-₹${(this.fees.max / 100000).toFixed(2)} ${this.duration.unit === "years" ? "LPA" : ""}`;
});

careerProgramSchema.virtual("salaryLabel").get(function () {
  return `₹${this.salary.minLPA}-₹${this.salary.maxLPA} LPA`;
});

// ============= MIDDLEWARE =============
// Auto-generate slug if title changes
careerProgramSchema.pre("save", function (next) {
  if (this.isModified("title")) {
    this.slug = require("../utils/slugify").default(this.title);
  }
  next();
});

// Validate that max >= min
careerProgramSchema.pre("save", function (next) {
  if (this.duration.max < this.duration.min) {
    throw new Error("Maximum duration must be >= minimum duration");
  }
  if (this.fees.max < this.fees.min) {
    throw new Error("Maximum fee must be >= minimum fee");
  }
  if (this.salary.maxLPA < this.salary.minLPA) {
    throw new Error("Maximum salary must be >= minimum salary");
  }
  next();
});

// Auto-calculate average fees if not provided
careerProgramSchema.pre("save", function (next) {
  if (!this.fees.average) {
    this.fees.average = (this.fees.min + this.fees.max) / 2;
  }
  next();
});

// ============= STATICS =============
careerProgramSchema.statics.getFeaturedPrograms = async function (limit = 10) {
  return this.find({ status: "published", isFeatured: true })
    .sort({ displayOrder: 1 })
    .limit(limit)
    .select("title slug category durationLabel salaryLabel tags");
};

careerProgramSchema.statics.searchByStream = async function (stream, limit = 20) {
  return this.find({
    status: "published",
    $or: [{ requiredStream: stream }, { requiredStream: "any" }],
  })
    .limit(limit)
    .select("title slug category durationLabel salaryLabel");
};

export default mongoose.model("CareerProgram", careerProgramSchema);