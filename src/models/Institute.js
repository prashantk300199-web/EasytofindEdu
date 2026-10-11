import mongoose from 'mongoose';

const facilitySchema = new mongoose.Schema({
  smartClass: Boolean,
  wifiCampus: Boolean,
  biometricAttendance: Boolean,
  cctv: Boolean,
  library: Boolean,
  hostel: Boolean,
  canteen: Boolean,
  parking: Boolean,
  acClassroom: Boolean,
  generatorBackup: Boolean,
  doubtFaculty: Boolean,
  recordedLecture: Boolean,
  testSeries: Boolean,
  mockTest: Boolean,
  parentMonitoring: Boolean,
  firstAidKit: Boolean,
  studentSupport: Boolean,
  careerCounseling: Boolean,
  digitalBoard: Boolean,
  appAccess: Boolean,
}, { _id: false });

const locationSchema = new mongoose.Schema({
  state: { type: String, default: "Bihar" },
  // Support either a DB reference (ObjectId) or a plain name string when city/area/subarea
  city: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
  cityName: { type: String },
  area: { type: mongoose.Schema.Types.ObjectId, ref: 'Area' },
  areaName: { type: String },
  subarea: { type: mongoose.Schema.Types.ObjectId, ref: 'SubArea' },
  subareaName: { type: String },
  fullAddress: String,
  landmark: String,
  // Google Maps coordinates — both optional. Stored as numbers when
  // the owner provided them; left undefined when they didn't. Don't
  // infer (0, 0) when missing.
  latitude: { type: Number },
  longitude: { type: Number },
  distanceFromLandmarks: [{
    landmarkName: String,
    distanceInKm: Number
  }]
}, { _id: false });

const transparencySchema = new mongoose.Schema({
  admissionProcess: String,
  feeClarity: String,
  refundPolicy: String,
  termsAndConditions: String,
  codeOfConduct: String,
  grievanceSystem: String
}, { _id: false });

const academicSchema = new mongoose.Schema({
  studentFacultyRatio: String,
  teachingMethodology: String,
  mockTestFrequency: String,
  remedialClasses: Boolean,
  parentTeacherMeeting: Boolean,
  dropoutRate: Number,
  residentialProgram: Boolean
}, { _id: false });

const instituteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logo: {
    publicId: String,
    url: String
  },
  coverImage: {
    publicId: String,
    url: String
  },
  // Additive — gallery block on the public detail page reads this.
  // Populated from step13Gallery.galleryFiles by the approval transform.
  galleryImages: [{
    publicId: String,
    url: String
  }],
  establishedYear: { type: Number, required: true },
  directorName: String,
  websiteUrl: String,
  totalBranches: Number,
  about: String,
  avgFacultyExperience: Number,

  location: locationSchema,
  facilities: facilitySchema,
  // Additive — preserves custom facility strings (e.g. "Dance Studio")
  // that don't map to the booleans object above.
  facilityList: [String],
  academicInfo: academicSchema,
  transparency: transparencySchema,
  
  comparisonMetrics: {
    academicScore: { type: Number, default: 0 },
    facultyScore: { type: Number, default: 0 },
    infrastructureScore: { type: Number, default: 0 },
    transparencyScore: { type: Number, default: 0 },
    careerOutcomesScore: { type: Number, default: 0 },
    overallScore: { type: Number, default: 0 }
  },

  // Top-level category the institute belongs to (e.g. "Medical Coaching",
  // "Engineering Coaching"). Optional; existing records without this
  // field remain readable.
  category: { type: String, trim: true, default: '' },

  // Target examinations / programs the institute prepares students for.
  // Stored as an array of free-form strings so it works for predefined
  // examinations (e.g. "NEET UG", "JEE Main") and custom ones.
  subcategories: { type: [String], default: [] },

  // Per-course category values, surfaced from the embedded course list.
  courseCategories: { type: [String], default: [] },

  // Per-course fee structure (one entry per course the institute
  // offers). Each entry carries the full fee breakdown plus the
  // explicit feeIncludesGst boolean. Older records without this
  // field are still readable; downstream pages just render nothing.
  courseFees: [{
    courseId: String,
    courseName: String,
    registrationFee: { type: String, default: '' },
    admissionFee: { type: String, default: '' },
    courseFee: { type: String, default: '' },
    monthlyFee: { type: String, default: '' },
    quarterlyFee: { type: String, default: '' },
    materialFee: { type: String, default: '' },
    kitFee: { type: String, default: '' },
    examFee: { type: String, default: '' },
    certificationFee: { type: String, default: '' },
    otherCharges: { type: String, default: '' },
    totalPayableAmount: { type: String, default: '' },
    feeIncludesGst: { type: Boolean, default: false }
  }],

  // Whether the listed fee amount already includes GST. Boolean so the
  // UI and downstream consumers can render "incl. GST" / "+ GST"
  // unambiguously without inferring from the amount. Optional for
  // older records; new per-course fees carry the canonical
  // `courseFees[].feeIncludesGst` flag.
  feeIncludesGst: { type: Boolean, default: false },

  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'InstituteOwner' },

  isActive: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false },
  rejectionReason: { type: String }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

instituteSchema.virtual('instituteAge').get(function () {
  return new Date().getFullYear() - this.establishedYear;
});

export default mongoose.model('Institute', instituteSchema);
