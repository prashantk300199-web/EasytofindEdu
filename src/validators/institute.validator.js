import Joi from 'joi';

export const createInstituteValidator = Joi.object({
  name: Joi.string().required(),
  establishedYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).required(),
  directorName: Joi.string(),
  websiteUrl: Joi.string().uri(),
  totalBranches: Joi.number(),
  about: Joi.string(),
  avgFacultyExperience: Joi.number(),

  // Accept both JSON strings and objects
  location: Joi.alternatives().try(
    Joi.object({
      state: Joi.string().default("Bihar"),
      city: Joi.string().hex().length(24).required(),
      area: Joi.string().hex().length(24).required(),
      subarea: Joi.string().hex().length(24).required(),
      fullAddress: Joi.string().required(),
      landmark: Joi.string()
    }),
    Joi.string().custom((value, helpers) => {
      try {
        const parsed = JSON.parse(value);
        // Validate the parsed object structure here if needed
        return parsed;
      } catch (e) {
        return helpers.error('any.invalid');
      }
    })
  ).required(),

  facilities: Joi.alternatives().try(
    Joi.object({
      smartClass: Joi.boolean(),
      wifiCampus: Joi.boolean(),
      biometricAttendance: Joi.boolean(),
      cctv: Joi.boolean(),
      library: Joi.boolean(),
      hostel: Joi.boolean(),
      canteen: Joi.boolean(),
      parking: Joi.boolean(),
      acClassroom: Joi.boolean(),
      generatorBackup: Joi.boolean(),
      doubtFaculty: Joi.boolean(),
      recordedLecture: Joi.boolean(),
      testSeries: Joi.boolean(),
      mockTest: Joi.boolean(),
      parentMonitoring: Joi.boolean(),
      firstAidKit: Joi.boolean(),
      studentSupport: Joi.boolean(),
      careerCounseling: Joi.boolean(),
      digitalBoard: Joi.boolean(),
      appAccess: Joi.boolean()
    }),
    Joi.string().custom((value, helpers) => {
      try {
        return JSON.parse(value);
      } catch (e) {
        return helpers.error('any.invalid');
      }
    })
  ),

  academicInfo: Joi.alternatives().try(
    Joi.object({
      studentFacultyRatio: Joi.string(),
      teachingMethodology: Joi.string(),
      mockTestFrequency: Joi.string(),
      remedialClasses: Joi.boolean(),
      parentTeacherMeeting: Joi.boolean(),
      dropoutRate: Joi.number(),
      residentialProgram: Joi.boolean()
    }),
    Joi.string().custom((value, helpers) => {
      try {
        return JSON.parse(value);
      } catch (e) {
        return helpers.error('any.invalid');
      }
    })
  ),

  transparency: Joi.alternatives().try(
    Joi.object({
      admissionProcess: Joi.string(),
      feeClarity: Joi.string(),
      refundPolicy: Joi.string(),
      termsAndConditions: Joi.string(),
      codeOfConduct: Joi.string(),
      grievanceSystem: Joi.string()
    }),
    Joi.string().custom((value, helpers) => {
      try {
        return JSON.parse(value);
      } catch (e) {
        return helpers.error('any.invalid');
      }
    })
  )
});
export const createCourseValidator = Joi.object({
  name: Joi.string().required(),
  description: Joi.string(),
  mode: Joi.string().valid('English', 'Hindi', 'Hinglish').required()
});

export const createBatchValidator = Joi.object({
  institute: Joi.string().hex().length(24).required(),
  course: Joi.string().hex().length(24).required(),
  batchName: Joi.string().required(),
  startDate: Joi.date(),
  timing: Joi.string(),
  duration: Joi.string(),
  studentsPerBatch: Joi.number(),
  mode: Joi.string().valid('Online', 'Offline').required(),
  totalSeats: Joi.number().required()
});

export const createFeeStructureValidator = Joi.object({
  institute: Joi.string().hex().length(24).required(),
  course: Joi.string().hex().length(24).required(),
  actualFee: Joi.number().required(),
  registrationAmount: Joi.number(),
  installmentAvailable: Joi.boolean(),
  installmentDetails: Joi.array().items(Joi.object({
    amount: Joi.number(),
    dueDate: Joi.date()
  })),
  scholarshipAvailable: Joi.boolean(),
  scholarshipPercentage: Joi.number().min(0).max(100),
  scholarshipEligibility: Joi.string(),
  easyToFindOfferPrice: Joi.number(),
  refundPolicy: Joi.string()
});

export const createResultValidator = Joi.object({
  institute: Joi.string().hex().length(24).required(),
  year: Joi.number().required(),
  examType: Joi.string().required(),
  totalStudentsQualified: Joi.number().required().min(0),
  achievementSummary: Joi.string().optional(),
});

