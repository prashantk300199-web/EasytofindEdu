import mongoose from "mongoose";
import {
  SCHOLARSHIP_TYPES,
  SCHOLARSHIP_STATUS,
  SCHOLARSHIP_SOURCE_TYPES,
  SCHOLARSHIP_CATEGORIES,
  SCHOLARSHIP_GENDERS,
  FREQUENCY_BENEFIT,
  QUALIFICATION_LEVELS,
} from "../constants/careerGuidance.constants.js";

const eligibilitySchema = new mongoose.Schema(
  {
    educationLevels: {
      type: [String],
      enum: Object.values(QUALIFICATION_LEVELS).concat(["any"]),
      default: [],
    },
    streams: {
      type: [String],
      default: [], // pcm, pcb, commerce, arts, engineering, medical, law, management, any
    },
    courses: { type: [String], default: [] },
    categories: {
      type: [String],
      enum: ["general", "sc", "st", "obc", "ews", "minority", "pwd", "women", "any"],
      default: ["any"],
    },
    gender: {
      type: String,
      enum: Object.values(SCHOLARSHIP_GENDERS),
      default: SCHOLARSHIP_GENDERS.ANY,
    },
    states: { type: [String], default: [] }, // empty = All India
    nationality: { type: String, default: "Indian" },
    minPercentage: { type: Number, default: null },
    maxFamilyIncome: { type: Number, default: null }, // annual INR
    minAge: { type: Number, default: null },
    maxAge: { type: Number, default: null },
    disability: { type: Boolean, default: false },
    otherRequirements: { type: String, default: "" },
  },
  { _id: false }
);

const amountSchema = new mongoose.Schema(
  {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    frequency: {
      type: String,
      enum: Object.values(FREQUENCY_BENEFIT),
      default: FREQUENCY_BENEFIT.ANNUAL,
    },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const deadlineSchema = new mongoose.Schema(
  {
    applicationStartDate: { type: Date, default: null },
    applicationEndDate: { type: Date, default: null },
    typicalWindow: { type: String, default: "" }, // e.g. "October – December each year"
    isRecurring: { type: Boolean, default: true },
    isExactDateConfirmed: { type: Boolean, default: false }, // false means "typical window only"
  },
  { _id: false }
);

const sourceSchema = new mongoose.Schema(
  {
    sourceName: { type: String, required: true, trim: true },
    sourceUrl: { type: String, required: true, trim: true },
    officialApplicationUrl: { type: String, required: true, trim: true },
    sourceType: {
      type: String,
      enum: Object.values(SCHOLARSHIP_SOURCE_TYPES),
      required: true,
    },
    lastVerifiedAt: { type: Date, required: true, default: Date.now },
    contactPhone: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    contactWebsite: { type: String, default: "" },
  },
  { _id: false }
);

const scholarshipSchema = new mongoose.Schema(
  {
    // ============= BASIC INFO =============
    name: {
      type: String,
      required: [true, "Scholarship name is required"],
      trim: true,
      maxlength: 250,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    shortDescription: {
      type: String,
      maxlength: 600,
      default: "",
    },
    description: {
      type: String,
      maxlength: 4000,
      default: "",
    },

    // ============= CATEGORIZATION =============
    scholarshipType: {
      type: String,
      enum: Object.values(SCHOLARSHIP_TYPES),
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: Object.values(SCHOLARSHIP_CATEGORIES),
      required: true,
      index: true,
    },
    tags: { type: [String], default: [], index: true },

    // ============= AMOUNT / BENEFIT =============
    amount: {
      type: amountSchema,
      default: () => ({}),
    },

    // ============= ELIGIBILITY =============
    eligibility: {
      type: eligibilitySchema,
      default: () => ({}),
    },

    // ============= DEADLINE =============
    deadline: {
      type: deadlineSchema,
      default: () => ({}),
    },

    // ============= REQUIRED DOCUMENTS =============
    requiredDocuments: { type: [String], default: [] },

    // ============= APPLICATION PROCESS =============
    applicationProcess: { type: String, default: "" },

    // ============= SOURCE / VERIFICATION =============
    source: {
      type: sourceSchema,
      required: true,
    },

    // ============= STATUS =============
    status: {
      type: String,
      enum: Object.values(SCHOLARSHIP_STATUS),
      default: SCHOLARSHIP_STATUS.ACTIVE,
      index: true,
    },
    computedStatus: {
      type: String,
      enum: ["active", "upcoming", "closing_soon", "closed", "expired", "unknown"],
      default: "unknown",
      index: true,
    },

    // ============= DISPLAY =============
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 999,
    },
    priority: {
      type: Number,
      default: 0,
    },

    // ============= SEO =============
    keywords: { type: [String], default: [] },

    // ============= ADMIN METADATA =============
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    notes: { type: String, default: "" },

    // ============= ANALYTICS =============
    viewCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
    saveCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============= INDEXES =============
scholarshipSchema.index({ status: 1, computedStatus: 1, isFeatured: -1 });
scholarshipSchema.index({ category: 1, status: 1 });
scholarshipSchema.index({ scholarshipType: 1, status: 1 });
scholarshipSchema.index({ "eligibility.educationLevels": 1, status: 1 });
scholarshipSchema.index({ "eligibility.states": 1, status: 1 });
scholarshipSchema.index({ "eligibility.categories": 1, status: 1 });
scholarshipSchema.index({ "deadline.applicationEndDate": 1 });
scholarshipSchema.index({ name: "text", shortDescription: "text", description: "text", keywords: "text", tags: "text" });

// ============= VIRTUALS =============
scholarshipSchema.virtual("amountLabel").get(function () {
  if (!this.amount) return "Amount not specified";
  const { min, max, currency, frequency, note } = this.amount;
  const sym = currency === "INR" ? "₹" : currency + " ";
  let label = "";
  if (min && max && min !== max) {
    label = `${sym}${min.toLocaleString("en-IN")} – ${sym}${max.toLocaleString("en-IN")}`;
  } else if (min) {
    label = `${sym}${min.toLocaleString("en-IN")}`;
  } else if (max) {
    label = `Up to ${sym}${max.toLocaleString("en-IN")}`;
  } else {
    label = "Amount not specified";
  }
  if (frequency && label !== "Amount not specified") {
    label += ` ${frequency.replace("_", " ")}`;
  }
  if (note) label += ` (${note})`;
  return label;
});

scholarshipSchema.virtual("deadlineLabel").get(function () {
  if (!this.deadline) return "Deadline not specified";
  if (this.deadline.typicalWindow && !this.deadline.isExactDateConfirmed) {
    return `Typical window: ${this.deadline.typicalWindow}`;
  }
  if (this.deadline.applicationEndDate) {
    const d = new Date(this.deadline.applicationEndDate);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  }
  return "Deadline not specified";
});

// ============= METHODS =============
scholarshipSchema.methods.computeStatus = function (now = new Date()) {
  // If the record is administratively set to inactive/closed/expired, keep that.
  if (this.status === "inactive" || this.status === "draft") return "unknown";
  if (this.status === "closed") return "closed";
  if (this.status === "expired") return "expired";

  const { applicationStartDate, applicationEndDate, isRecurring, typicalWindow, isExactDateConfirmed } = this.deadline || {};
  if (!applicationEndDate && !typicalWindow) return "unknown";

  if (!applicationEndDate) {
    // We only have a typical window — cannot compute precisely.
    return isRecurring ? "active" : "unknown";
  }

  const start = applicationStartDate ? new Date(applicationStartDate) : null;
  const end = new Date(applicationEndDate);

  if (now > end) return isRecurring ? "active" : "expired"; // recurring schemes reopen each year
  if (start && now < start) return "upcoming";
  const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 14) return "closing_soon";
  return "active";
};

// ============= MIDDLEWARE =============
// Auto-generate slug from name if missing
scholarshipSchema.pre("validate", function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .substring(0, 240);
  }
  next();
});

// Compute status before save
scholarshipSchema.pre("save", function (next) {
  this.computedStatus = this.computeStatus();
  next();
});

const Scholarship = mongoose.model("Scholarship", scholarshipSchema);

export default Scholarship;
