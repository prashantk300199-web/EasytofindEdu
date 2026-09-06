import mongoose from 'mongoose';

const trainerSchema = new mongoose.Schema({
  id: String,
  name: String,
  qualification: String,
  experience: String,
  specialization: String,
  industryExperience: String,
  certifications: String,
  achievements: String,
  bio: String,
  photoFile: String,
  photoPreview: String
}, { _id: false });

const courseSchema = new mongoose.Schema({
  id: String,
  courseName: String,
  courseCode: String,
  category: String,
  duration: String,
  durationType: String,
  mode: String,
  level: String,
  eligibility: String,
  syllabus: String,
  description: String,
  certificationAvailable: Boolean,
  certificateAuthority: String,
  trialAvailable: Boolean,
  practicalTraining: Boolean,
  entranceExamRequired: Boolean,
  entranceExamName: String,
  outcomes: String,
  skills: String
}, { _id: false });

const batchSchema = new mongoose.Schema({
  id: String,
  batchName: String,
  courseId: String,
  courseName: String,
  startDate: String,
  endDate: String,
  daysOfWeek: [String],
  classTiming: String,
  classDuration: String,
  classesPerWeek: Number,
  batchSize: Number,
  seatsAvailable: Number,
  scheduleType: String, // Weekday/Weekend
  timeSlot: String, // Morning/Afternoon/Evening
  mode: String, // Online/Offline/Hybrid
  trialAvailable: Boolean,
  status: String // Upcoming/Ongoing/Full/Closed
}, { _id: false });

const resultSchema = new mongoose.Schema({
  id: String,
  exam: String,
  year: String,
  studentsAppeared: Number,
  qualified: Number,
  selected: Number,
  highestRank: String,
  topScores: String,
  selectionPercentage: Number,
  airStateRank: String,
  supportingDocFile: String,
  supportingDocPreview: String
}, { _id: false });

const instituteDraftSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InstituteOwner',
    required: true,
    index: true
  },

  // Registration status
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected'],
    default: 'draft'
  },

  currentStep: {
    type: Number,
    default: 1,
    min: 1,
    max: 15
  },

  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  lastSavedAt: {
    type: Date,
    default: Date.now
  },

  // Step 1: Institute Information
  step1InstituteInfo: {
    instituteName: String,
    establishedYear: Number,
    registrationNumber: String,
    logoFile: String,
    logoPreview: String,
    coverImageFile: String,
    coverImagePreview: String,
    about: String,
    totalBranches: Number,
    totalStudents: Number,
    websiteUrl: String,
    awards: String,
    achievements: String
  },

  // Step 2: Category Selection
  step2Category: {
    primaryCategory: String,
    subcategories: [String],
    categorySpecificData: mongoose.Schema.Types.Mixed
  },

  // Step 3: Location & Contact
  step3LocationContact: {
    state: String,
    city: String,
    area: String,
    subarea: String,
    fullAddress: String,
    landmark: String,
    pincode: String,
    googleMapsLink: String,
    phone: String,
    alternatePhone: String,
    email: String,
    whatsapp: String
  },

  // Step 4: Courses/Programs
  step4Courses: {
    courses: [courseSchema]
  },

  // Step 5: Batches & Schedule
  step5Batches: {
    batches: [batchSchema]
  },

  // Step 6: Learning Experience
  step6LearningExperience: {
    liveClasses: Boolean,
    recordedClasses: Boolean,
    practicalTraining: Boolean,
    liveProjects: Boolean,
    assignments: Boolean,
    tests: Boolean,
    mockTests: Boolean,
    doubtSessions: Boolean,
    personalMentorship: Boolean,
    oneToOneClasses: Boolean,
    studyMaterial: Boolean,
    workshops: Boolean,
    events: Boolean,
    competitions: Boolean,
    performanceOpportunities: Boolean,
    communityAccess: Boolean,
    learningPlatform: Boolean,
    mobileApp: Boolean,
    webPortal: Boolean,
    onlineTests: Boolean,
    whatsappSupport: Boolean,
    technicalSupport: Boolean
  },

  // Step 7: Facilities
  step7Facilities: {
    facilities: [String],
    otherFacilities: String
  },

  // Step 8: Faculty/Trainers
  step8Faculty: {
    totalFaculty: Number,
    trainerStudentRatio: String,
    teachingMethod: [String],
    studentSupport: String,
    doubtSupport: Boolean,
    oneToOneMentoring: Boolean,
    trainers: [trainerSchema]
  },

  // Step 9: Fees & Scholarships
  step9Fees: {
    registrationFee: String,
    admissionFee: String,
    courseFee: String,
    monthlyFee: String,
    quarterlyFee: String,
    materialFee: String,
    kitFee: String,
    examFee: String,
    certificationFee: String,
    otherCharges: String,
    totalPayableAmount: String,
    scholarshipAvailable: Boolean,
    scholarshipDetails: String,
    installmentAvailable: Boolean,
    installmentSchedule: String,
    emiProvider: String,
    refundPolicy: String,
    cancellationPolicy: String
  },

  // Step 10: Admission/Enrollment
  step10Admission: {
    admissionType: String,
    admissionProcess: String,
    admissionStartDate: String,
    admissionEndDate: String,
    nextBatchStartDate: String,
    registrationDeadline: String,
    applicationLink: String,
    applicationFee: String,
    requiredDocuments: String,
    admissionContactPerson: String,
    admissionContactNumber: String,
    walkInAvailable: Boolean,
    demoAvailable: Boolean
  },

  // Step 11: Career & Outcomes
  step11Career: {
    placementAssistance: Boolean,
    jobAssistance: Boolean,
    internshipAssistance: Boolean,
    freelancingSupport: Boolean,
    businessSupport: Boolean,
    careerCounselling: Boolean,
    industryConnections: Boolean,
    portfolioDevelopment: Boolean,
    certification: Boolean,
    performanceOpportunities: Boolean,
    competitionOpportunities: Boolean,
    furtherEducationGuidance: Boolean,
    topRecruiters: String,
    industryPartners: String,
    averagePackage: String,
    highestPackage: String,
    placementRate: Number,
    careerOutcomes: String
  },

  // Step 12: Results & Achievements
  step12Results: {
    results: [resultSchema],
    awards: String,
    competitionWins: String,
    studentAchievements: String,
    successStories: String,
    certifications: String,
    careerOutcomes: String
  },

  // Step 13: Gallery & Online Presence
  step13Gallery: {
    galleryFiles: [String],
    galleryPreviews: [String],
    videoUrl: String,
    website: String,
    instagram: String,
    facebook: String,
    linkedin: String,
    youtube: String
  },

  // Step 14: Verification
  step14Verification: {
    ownerName: String,
    designation: String,
    idProofFile: String,
    idProofPreview: String,
    registrationDocFile: String,
    registrationDocPreview: String,
    gstNumber: String,
    panNumber: String,
    accreditation: String,
    affiliation: String,
    certificationAuthority: String,
    governmentRecognition: String,
    licenseNumber: String,
    addressProofFile: String,
    addressProofPreview: String
  },

  // Verification Workflow Fields
  verificationStatus: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'changes_requested', 'verified', 'rejected', 'suspended'],
    default: 'draft'
  },
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  adminFeedback: String,
  rejectionReason: String,
  suspensionReason: String,
  verificationHistory: [{
    action: String,
    status: String,
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    adminName: String,
    reason: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster queries
instituteDraftSchema.index({ owner: 1, status: 1 });
instituteDraftSchema.index({ lastSavedAt: -1 });

// Method to update last saved timestamp
instituteDraftSchema.methods.updateLastSaved = function() {
  this.lastSavedAt = new Date();
  return this.save();
};

// Method to calculate completion percentage
instituteDraftSchema.methods.calculateCompletion = function() {
  let completedSteps = 0;
  const totalSteps = 14;

  // Check each step for completion
  if (this.step1InstituteInfo?.instituteName) completedSteps++;
  if (this.step2Category?.primaryCategory) completedSteps++;
  if (this.step3LocationContact?.fullAddress) completedSteps++;
  if (this.step4Courses?.courses?.length > 0) completedSteps++;
  if (this.step5Batches?.batches?.length > 0) completedSteps++;
  if (this.step6LearningExperience) completedSteps++;
  if (this.step7Facilities?.facilities?.length > 0) completedSteps++;
  if (this.step8Faculty?.totalFaculty) completedSteps++;
  if (this.step9Fees?.totalPayableAmount || this.step9Fees?.courseFee) completedSteps++;
  if (this.step10Admission?.admissionType) completedSteps++;
  if (this.step11Career) completedSteps++;
  if (this.step12Results) completedSteps++;
  if (this.step13Gallery?.galleryPreviews?.length > 0 || this.step13Gallery?.website) completedSteps++;
  if (this.step14Verification?.ownerName && this.step14Verification?.idProofPreview) completedSteps++;

  this.completionPercentage = Math.round((completedSteps / totalSteps) * 100);
  return this.completionPercentage;
};

export default mongoose.model('InstituteDraft', instituteDraftSchema);
