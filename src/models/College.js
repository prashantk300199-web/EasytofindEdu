import mongoose from "mongoose";

const collegeSchema = new mongoose.Schema(
  {
    // ============= BASIC INFO =============
    name: {
      type: String,
      required: [true, "College name is required"],
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
    about: String,

    // ============= LOCATION =============
    location: {
      city: {
        type: String,
        required: [true, "City is required"],
        index: true,
      },
      state: {
        type: String,
        required: [true, "State is required"],
        index: true,
      },
      country: {
        type: String,
        default: "India",
      },
      address: String,
      latitude: Number,
      longitude: Number,
    },

    // ============= COLLEGE TYPE =============
    collegeType: {
      type: String,
      enum: ["govt", "private", "deemed", "autonomous", "national"],
      required: [true, "College type is required"],
      index: true,
    },

    // ============= RECOGNITION & APPROVALS =============
    approvals: [String], // e.g., "AICTE", "UGC", "NAAC"
    accreditation: {
      naacGrade: String, // e.g., "A", "B+"
      accreditationBody: String,
      validUpto: Date,
    },

    // ============= RANKING =============
    ranking: {
      nirf: {
        rank: Number,
        category: String, // "Overall", "Engineering", "Medical"
        year: Number,
      },
      nationalRank: Number,
      stateRank: Number,
      worldRank: Number,
    },

    // ============= CONTACT & WEB =============
    contact: {
      website: String,
      admissionPortal: String,
      email: String,
      phone: [String],
      admissionEmail: String,
    },

    // ============= ACADEMIC DETAILS =============
    programs: [
      {
        programId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "CareerProgram",
        },
        cutoff: String, // e.g., "JEE Main: 98 percentile"
        seats: Number,
        category: String, // "General", "SC", "ST", "OBC"
        _id: false,
      },
    ],

    // ============= PLACEMENTS & OUTCOMES =============
    placements: {
      placementRate: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      averagePackage: {
        type: Number,
        default: 0,
      },
      highestPackage: {
        type: Number,
        default: 0,
      },
      lowestPackage: {
        type: Number,
        default: 0,
      },
      median: {
        type: Number,
        default: 0,
      },
      topRecruiters: [String], // e.g., ["Google", "Amazon", "Microsoft"]
    },

    // ============= INFRASTRUCTURE =============
    infrastructure: {
      totalStudents: Number,
      facultyCount: Number,
      studentFacultyRatio: String,
      classrooms: Number,
      computerLabs: Number,
      libraryBooks: Number,
      hostels: {
        boys: Number,
        girls: Number,
      },
      highlights: [String], // e.g., "Modern labs", "Sports facilities", "Wi-Fi campus"
    },

    // ============= FEATURES & HIGHLIGHTS =============
    strengths: [String],
    features: [
      {
        title: String,
        description: String,
        _id: false,
      },
    ],

    // ============= FEE STRUCTURE =============
    feeStructure: {
      entranceFee: Number,
      tuitionFeePerYear: {
        min: Number,
        max: Number,
      },
      hostelFeePerYear: Number,
      otherFees: Number,
      totalCostPerYear: Number,
    },

    // ============= SCHOLARSHIPS =============
    scholarships: [
      {
        name: String,
        amount: Number,
        eligibility: String,
        _id: false,
      },
    ],

    // ============= FACULTY =============
    facultyProfile: {
      doctorateholders: Number, // percentage
      phd: Number, // percentage
      internationalQualifications: Number,
    },

    // ============= RESEARCH & INNOVATION =============
    research: {
      publicationsPerYear: Number,
      patentsPerYear: Number,
      researchCenters: [String],
    },

    // ============= SOCIAL PRESENCE =============
    socialMedia: {
      facebook: String,
      twitter: String,
      linkedin: String,
      youtube: String,
    },

    // ============= MEDIA =============
    images: [String], // URLs
    videos: [String], // YouTube links

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
    favoriteCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ============= INDEXES =============
collegeSchema.index({ "location.city": 1, collegeType: 1 });
collegeSchema.index({ "ranking.nirf.rank": 1 });
collegeSchema.index({ slug: 1, status: 1 });

// ============= MIDDLEWARE =============
collegeSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = require("../utils/slugify").default(this.name);
  }
  next();
});

// ============= STATICS =============
collegeSchema.statics.getTopColleges = async function (limit = 10) {
  return this.find({ status: "published" })
    .sort({ "ranking.nirf.rank": 1 })
    .limit(limit)
    .select("name city state collegeType ranking placements");
};

collegeSchema.statics.getCollegersByCity = async function (city, limit = 20) {
  return this.find({ "location.city": city, status: "published" })
    .limit(limit)
    .select("name city state collegeType ranking placements");
};

export default mongoose.model("College", collegeSchema);