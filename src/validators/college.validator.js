import Joi from "joi";

export const collegeValidationSchema = Joi.object({
  // ==========================================
  // BASIC DETAILS
  // ==========================================

  name: Joi.string().required().messages({
    "string.empty": "College Name is strictly required",
  }),

  shortName: Joi.string().allow("", null).optional(),

  about: Joi.string().required().messages({
    "string.empty": "About College is strictly required",
  }),

  logo: Joi.string().allow("", null).optional(),

  bannerImages: Joi.array().items(Joi.string()).optional(),

  videoUrl: Joi.string().allow("", null).optional(),

  establishedYear: Joi.number()
    .empty("")
    .allow(null)
    .optional(),

  ownershipType: Joi.string()
    .valid("Public", "Private", "PPP", "Government")
    .allow("", null)
    .optional(),

  affiliationType: Joi.string()
    .valid("Autonomous", "Affiliated", "Deemed", "University")
    .allow("", null)
    .optional(),

  affiliatedUniversity: Joi.string()
    .allow("", null)
    .optional(),

  campusSize: Joi.string()
    .allow("", null)
    .optional(),

  collegeType: Joi.string()
    .allow("", null)
    .optional(),

  // ==========================================
  // APPROVALS & RANKINGS
  // ==========================================

  approvedBy: Joi.array()
    .items(Joi.string())
    .optional(),

  accreditation: Joi.array()
    .items(Joi.string())
    .optional(),

  naacGrade: Joi.string()
    .allow("", null)
    .optional(),

  rankings: Joi.object({
    nirf: Joi.number()
      .empty("")
      .allow(null)
      .optional(),

    iirf: Joi.number()
      .empty("")
      .allow(null)
      .optional(),

    qs: Joi.number()
      .empty("")
      .allow(null)
      .optional(),
  }).optional(),

  // ==========================================
  // CONTACT
  // ==========================================

  contact: Joi.object({
    website: Joi.string()
      .allow("", null)
      .optional(),

    email: Joi.string()
      .email()
      .allow("", null)
      .optional(),

    address: Joi.string().required().messages({
      "string.empty":
        "Full Address is required in Contact Details",
    }),
  }).required(),

  // ==========================================
  // ADMISSION
  // ==========================================

  admission: Joi.object({
    process: Joi.string()
      .allow("", null)
      .optional(),

    quotas: Joi.object({
      directAdmissionAvailable:
        Joi.boolean().default(false),

      managementQuota:
        Joi.boolean().default(false),

      nriQuota:
        Joi.boolean().default(false),

      stateQuota:
        Joi.boolean().default(false),

      aiqQuota:
        Joi.boolean().default(false),

      scholarshipAdmission:
        Joi.boolean().default(false),
    }).optional(),
  }).optional(),

  // ==========================================
  // PLACEMENTS
  // ==========================================

  placements: Joi.object({
    placementPercentage: Joi.number()
      .empty("")
      .allow(null)
      .optional(),

    internshipPercentage: Joi.number()
      .empty("")
      .allow(null)
      .optional(),

    eligibleStudents: Joi.number()
      .empty("")
      .allow(null)
      .optional(),

    studentsPlaced: Joi.number()
      .empty("")
      .allow(null)
      .optional(),

    highestPackage: Joi.number()
      .empty("")
      .allow(null)
      .optional(),

    averagePackage: Joi.number()
      .empty("")
      .allow(null)
      .optional(),

    internationalPackage: Joi.number()
      .empty("")
      .allow(null)
      .optional(),

    topRecruiters: Joi.array()
      .items(Joi.string())
      .optional(),
  }).optional(),

  // ==========================================
  // HOSTEL
  // ==========================================

  hostel: Joi.object({
    isAvailable:
      Joi.boolean().default(false),

    monthlyFee: Joi.number()
      .empty("")
      .allow(null)
      .optional(),

    yearlyFee: Joi.number()
      .empty("")
      .allow(null)
      .optional(),

    foodIncluded:
      Joi.boolean().default(false),

    otherFees: Joi.number()
      .empty("")
      .allow(null)
      .optional(),
  }).optional(),

  // ==========================================
  // COURSES OFFERED
  // ==========================================

  coursesOffered: Joi.array().items(
    Joi.object({
      // 🔥 FIXED COURSE FIELD
      course: Joi.alternatives()
        .try(
          Joi.string(),

          Joi.object({
            _id: Joi.string().required(),
          })
        )
        .required()
        .messages({
          "any.required":
            "Master Course selection is required",
        }),

      examsAccepted: Joi.array()
        .items(
          Joi.string().allow("", null)
        )
        .optional(),

      fees: Joi.object({
        tuitionFee: Joi.number()
          .empty("")
          .required()
          .messages({
            "number.base":
              "Tuition fee must be a number",
            "any.required":
              "Tuition fee is required",
          }),

        totalYearlyExpense: Joi.number()
          .empty("")
          .required()
          .messages({
            "number.base":
              "Total yearly expense must be a number",
            "any.required":
              "Total yearly expense is required",
          }),

        examFee: Joi.number()
          .empty("")
          .default(0),

        securityFee: Joi.number()
          .empty("")
          .default(0),

        developmentFee: Joi.number()
          .empty("")
          .default(0),

        uniformLabCharges: Joi.number()
          .empty("")
          .default(0),

        otherFees: Joi.number()
          .empty("")
          .default(0),
      }).required(),
    })
  ).optional(),
}).unknown(true);