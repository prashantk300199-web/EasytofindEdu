import mongoose from "mongoose";

/**
 * CollegeDraft — the rich, draft-only document the owner fills in over 12 steps.
 * Mirrors InstituteDraft.js. Once verified, the public CollegeProfile (college.model.js)
 * is upserted via buildCollegeUpdateFromDraft in utils/collegeTransform.js.
 */

const courseSchema = new mongoose.Schema({
  id: String,
  courseName: { type: String, required: true },
  degree: String,            // B.Tech, M.Tech, MBA, etc.
  stream: String,            // Engineering, Medical, Management, etc.
  specialization: String,
  duration: String,          // e.g. "4 years"
  durationType: String,      // years | months | semesters
  eligibility: String,
  admissionMode: String,     // Entrance | Merit | Direct | Management
  entranceExam: String,      // JEE, NEET, CAT, etc.
  intakeSeats: Number,
  courseFee: Number,         // total fee in INR
  applicationDeadline: Date,
  description: String,
  brochureFile: String,      // Cloudinary URL
}, { _id: false });

const scholarshipSchema = new mongoose.Schema({
  id: String,
  name: String,
  eligibility: String,
  amount: String,            // free-form like "₹50,000" or "100% tuition"
  applicationProcess: String,
  deadline: Date,
  description: String,
}, { _id: false });

const documentSchema = new mongoose.Schema({
  id: String,
  category: String,          // Registration | Affiliation | Recognition | Accreditation | Other
  documentName: String,
  documentFile: String,      // Cloudinary URL
  documentPreview: String,
  status: { type: String, enum: ['Pending', 'Uploaded', 'Verified', 'Rejected', 'Changes Required'], default: 'Pending' },
  uploadedAt: { type: Date, default: Date.now },
  notes: String,
}, { _id: false });

const collegeDraftSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollegeOwner',
    required: true,
    index: true,
  },

  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected'],
    default: 'draft',
  },

  currentStep: {
    type: Number,
    default: 1,
    min: 1,
    max: 13,
  },
  completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
  lastSavedAt: { type: Date, default: Date.now },

  // STEP 1 — Basic Information
  step1BasicInfo: {
    collegeName: String,
    shortName: String,
    logoFile: String,
    logoPreview: String,
    coverImageFile: String,
    coverImagePreview: String,
    establishedYear: Number,
    institutionType: String,      // Engineering, Medical, Management, Law, Arts, etc.
    ownershipType: String,        // Public, Private, PPP, Government
    about: String,
    website: String,
    contactEmail: String,
    contactPhone: String,
  },

  // STEP 2 — Location & Campus
  step2Location: {
    fullAddress: String,
    city: String,
    district: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' },
    googleMapsLink: String,
    campusName: String,
    campusType: String,
    campusDescription: String,
  },

  // STEP 3 — Affiliation & Recognition
  step3Affiliation: {
    affiliatedUniversity: String,
    ugcRecognized: Boolean,
    aicteApproved: Boolean,
    naacAccredited: Boolean,
    nbaAccredited: Boolean,
    nirfRank: Number,
    otherRecognition: String,
    accreditationGrade: String,    // A++, A+, A, B++, B, C
    affiliationDocument: String,
    recognitionDocument: String,
    accreditationDocument: String,
  },

  // STEP 4 — Courses & Programs
  step4Courses: {
    courses: [courseSchema],
  },

  // STEP 5 — Fees & Admissions
  step5AdmissionFees: {
    admissionProcess: String,
    admissionStartDate: Date,
    admissionEndDate: Date,
    entranceExams: String,
    eligibilityRequirements: String,
    applicationProcedure: String,
    feeStructureNote: String,
    importantInfo: String,
  },

  // STEP 6 — Facilities
  step6Facilities: {
    library: Boolean,
    laboratories: Boolean,
    sportsFacilities: Boolean,
    cafeteria: Boolean,
    auditorium: Boolean,
    medicalFacilities: Boolean,
    wifi: Boolean,
    transportation: Boolean,
    clubsActivities: Boolean,
    otherFacilities: String,
  },

  // STEP 7 — Hostel
  step7Hostel: {
    isAvailable: Boolean,
    boysHostel: Boolean,
    girlsHostel: Boolean,
    totalCapacity: Number,
    hostelFees: Number,
    roomTypes: String,
    hostelFacilities: String,
    hostelRules: String,
    contactPerson: String,
    contactPhone: String,
  },

  // STEP 8 — Placements
  step8Placements: {
    placementCell: Boolean,
    placementAssistance: Boolean,
    averagePackage: Number,        // LPA
    highestPackage: Number,        // LPA
    placementRate: Number,         // percentage
    topRecruiters: String,         // free text or comma list
    internshipOpportunities: Boolean,
    placementDescription: String,
    placementReportFile: String,
  },

  // STEP 9 — Scholarships
  step9Scholarships: {
    scholarships: [scholarshipSchema],
  },

  // STEP 10 — Gallery & Media
  step10Gallery: {
    galleryFiles: [String],         // array of Cloudinary URLs (no overwrite bug)
    galleryPreviews: [String],
    videoUrl: String,
    website: String,
    instagram: String,
    facebook: String,
    linkedin: String,
    youtube: String,
  },

  // STEP 11 — Official Documents (categorised)
  step11Documents: {
    documents: [documentSchema],
  },

  // STEP 12 — Review & submit happens in the frontend; status flips here.

  // Verification Workflow Fields
  verificationStatus: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'changes_requested', 'verified', 'rejected', 'suspended'],
    default: 'draft',
  },
  verifiedAt: Date,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  adminFeedback: String,
  rejectionReason: String,
  suspensionReason: String,
  submittedAt: Date,
  verificationHistory: [{
    action: String,
    status: String,
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    adminName: String,
    reason: String,
    timestamp: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

collegeDraftSchema.index({ owner: 1, status: 1 });
collegeDraftSchema.index({ lastSavedAt: -1 });

collegeDraftSchema.methods.updateLastSaved = function () {
  this.lastSavedAt = new Date();
  return this.save();
};

collegeDraftSchema.methods.calculateCompletion = function () {
  let completedSteps = 0;
  const totalSteps = 12;

  if (this.step1BasicInfo?.collegeName) completedSteps++;
  if (this.step2Location?.fullAddress) completedSteps++;
  if (this.step3Affiliation?.affiliatedUniversity) completedSteps++;
  if (this.step4Courses?.courses?.length > 0) completedSteps++;
  if (this.step5AdmissionFees?.admissionProcess) completedSteps++;
  if (this.step6Facilities) completedSteps++;
  if (this.step7Hostel) completedSteps++;
  if (this.step8Placements) completedSteps++;
  if (this.step9Scholarships?.scholarships?.length > 0) completedSteps++;
  if (this.step10Gallery?.galleryPreviews?.length > 0) completedSteps++;
  if (this.step11Documents?.documents?.length > 0) completedSteps++;
  if (this.step12Submitted) completedSteps++; // legacy field, never set; kept for symmetry

  this.completionPercentage = Math.round((completedSteps / totalSteps) * 100);
  return this.completionPercentage;
};

export default mongoose.model('CollegeDraft', collegeDraftSchema);