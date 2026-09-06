import mongoose from "mongoose";

const collegeSchema = new mongoose.Schema(
  {
    // ── 1. BASIC DETAILS ──
    name: { type: String, required: true, trim: true, index: true },
    shortName: { type: String, trim: true },
    about: { type: String, required: true },
    logo: { type: String }, // Cloudinary URL
    bannerImages: [{ type: String }],
    videoUrl: { type: String },
    establishedYear: { type: Number },
    ownershipType: { type: String, enum: ["Public", "Private", "PPP", "Government"] },
    affiliationType: { type: String, enum: ["Autonomous", "Affiliated", "Deemed", "University"] },
    affiliatedUniversity: { type: String },
    approvedBy: [{ type: String }], // e.g., ["AICTE", "UGC", "MCI"]
    accreditation: [{ type: String }], // e.g., ["NBA"]
    naacGrade: { type: String },
    
    // Rankings
    rankings: {
      nirf: { type: Number },
      iirf: { type: Number },
      qs: { type: Number }
    },
    
    campusSize: { type: String }, // e.g., "150 Acres"
    collegeType: { type: String }, // e.g., "Engineering", "Medical", "Management"
    
    // Contact Info
    contact: {
      website: { type: String },
      email: { type: String },
      address: { type: String, required: true }
    },

    // ── 2. GLOBAL ADMISSION & QUOTAS ──
    admission: {
      process: { type: String },
      importantDates: [
        {
          event: { type: String }, // e.g., "Registration Starts"
          date: { type: Date }
        }
      ],
      quotas: {
        directAdmissionAvailable: { type: Boolean, default: false },
        managementQuota: { type: Boolean, default: false },
        nriQuota: { type: Boolean, default: false },
        stateQuota: { type: Boolean, default: false },
        aiqQuota: { type: Boolean, default: false },
        scholarshipAdmission: { type: Boolean, default: false }
      }
    },

    // ── 3. OVERALL COLLEGE PLACEMENTS ──
    placements: {
      placementPercentage: { type: Number }, // e.g., 95
      eligibleStudents: { type: Number },
      studentsPlaced: { type: Number },
      highestPackage: { type: Number }, // In LPA
      averagePackage: { type: Number }, // In LPA
      internationalPackage: { type: Number }, // In LPA
      topRecruiters: [{ type: String }],
      internshipPercentage: { type: Number }
    },

    // ── 4. HOSTEL DETAILS ──
    hostel: {
      isAvailable: { type: Boolean, default: false },
      monthlyFee: { type: Number },
      yearlyFee: { type: Number },
      foodIncluded: { type: Boolean, default: false }, // "Good included" / Food
      otherFees: { type: Number, default: 0 }
    },

    // ── 5. COURSES OFFERED (Linked with Master Course DB) ──
    coursesOffered: [
      {
        // Reference to the Master Course
        course: { type: mongoose.Schema.Types.ObjectId, ref: "CollegeCourse", required: true },
        
        // Accepted Exams exactly as you requested
        examsAccepted: [{
          type: String, 
        }],

        // Detailed Fee Structure
        fees: {
          tuitionFee: { type: Number, required: true },
          examFee: { type: Number, default: 0 },
          securityFee: { type: Number, default: 0 },
          developmentFee: { type: Number, default: 0 },
          uniformLabCharges: { type: Number, default: 0 },
          otherFees: { type: Number, default: 0 },
          totalYearlyExpense: { type: Number, required: true }
        },
        
        // Exhaustive Cutoff Data
        cutoffs: [
          {
            year: { type: Number, required: true },
            round: { type: String }, // e.g., "Round 1", "Round 2"
            category: { type: String }, // e.g., "General", "OBC", "SC", "ST"
            quota: { type: String }, // "State", "AIQ", "Home State"
            stateQuotaCutoff: { type: Number },
            aiqCutoff: { type: Number },
            openingRank: { type: Number },
            closingRank: { type: Number },
            percentile: { type: Number } // Percentile vs Rank Data
          }
        ]
      }
    ]
  },
  { 
    timestamps: true 
  }
);

// Optimize searches
collegeSchema.index({ name: 'text', shortName: 'text' });

// 🚀 FIX: Renamed the model to "CollegeProfile" to avoid conflicts with any older schemas
const CollegeProfile = mongoose.models.CollegeProfile || mongoose.model("CollegeProfile", collegeSchema);

export default CollegeProfile;