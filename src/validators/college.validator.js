// src/validators/college.validator.js

import Joi from "joi";

export const collegeValidationSchema = Joi.object({
  // Basic Details
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

  establishedYear: Joi.number().allow("", null).optional(),

  ownershipType: Joi.string()
    .valid("Public", "Private", "PPP", "Government")
    .allow("", null)
    .optional(),

  affiliationType: Joi.string()
    .valid("Autonomous", "Affiliated", "Deemed", "University")
    .allow("", null)
    .optional(),

  affiliatedUniversity: Joi.string().allow("", null).optional(),

  campusSize: Joi.string().allow("", null).optional(),

  collegeType: Joi.string().allow("", null).optional(),

  // Rankings
  approvedBy: Joi.array().items(Joi.string()).optional(),

  accreditation: Joi.array().items(Joi.string()).optional(),

  naacGrade: Joi.string().allow("", null).optional(),

  rankings: Joi.object({
    nirf: Joi.number().allow("", null).optional(),
    iirf: Joi.number().allow("", null).optional(),
    qs: Joi.number().allow("", null).optional(),
  }).optional(),

  // Contact
  contact: Joi.object({
    website: Joi.string().allow("", null).optional(),

    email: Joi.string().email().allow("", null).optional(),

    address: Joi.string().required().messages({
      "string.empty": "Full Address is required in Contact Details",
    }),
  }).required(),

  // Admission
  admission: Joi.object({
    process: Joi.string().allow("", null).optional(),

    quotas: Joi.object({
      directAdmissionAvailable: Joi.boolean().default(false),

      managementQuota: Joi.boolean().default(false),

      nriQuota: Joi.boolean().default(false),

      stateQuota: Joi.boolean().default(false),

      aiqQuota: Joi.boolean().default(false),

      scholarshipAdmission: Joi.boolean().default(false),
    }).optional(),
  }).optional(),

  // Placements
  placements: Joi.object({
    placementPercentage: Joi.number().allow("", null).optional(),

    internshipPercentage: Joi.number().allow("", null).optional(),

    eligibleStudents: Joi.number().allow("", null).optional(),

    studentsPlaced: Joi.number().allow("", null).optional(),

    highestPackage: Joi.number().allow("", null).optional(),

    averagePackage: Joi.number().allow("", null).optional(),

    internationalPackage: Joi.number().allow("", null).optional(),

    topRecruiters: Joi.array().items(Joi.string()).optional(),
  }).optional(),

  // Hostel
  hostel: Joi.object({
    isAvailable: Joi.boolean().default(false),

    monthlyFee: Joi.number().allow("", null).optional(),

    yearlyFee: Joi.number().allow("", null).optional(),

    foodIncluded: Joi.boolean().default(false),

    otherFees: Joi.number().allow("", null).optional(),
  }).optional(),

  // Courses Offered
  coursesOffered: Joi.array().items(
    Joi.object({
      course: Joi.string().required().messages({
        "string.empty": "Master Course selection is required",
      }),

      // EXAM VALIDATION REMOVED
      // Now any exam name/string is allowed
      examsAccepted: Joi.array()
        .items(Joi.string().allow("", null))
        .optional(),

      fees: Joi.object({
        tuitionFee: Joi.number().required().messages({
          "number.base": "Tuition fee must be a number",
        }),

        totalYearlyExpense: Joi.number().required(),

        examFee: Joi.number().default(0),

        securityFee: Joi.number().default(0),

        developmentFee: Joi.number().default(0),

        uniformLabCharges: Joi.number().default(0),

        otherFees: Joi.number().default(0),
      }).required(),
    })
  ).optional(),
});