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
  establishedYear: { type: Number, required: true },
  directorName: String,
  websiteUrl: String,
  totalBranches: Number,
  about: String,
  avgFacultyExperience: Number,

  location: locationSchema,
  facilities: facilitySchema,
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
