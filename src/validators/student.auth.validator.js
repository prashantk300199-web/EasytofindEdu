import Joi from "joi";

export const registerValidator = Joi.object({
  name: Joi.string().required().trim().max(100),
  email: Joi.string().email().required().lowercase().trim(),
  phone: Joi.string().required().trim().max(15),
  password: Joi.string().min(6).required(),
  gender: Joi.string().valid("male", "female", "other", "").optional().allow(""),
  lastQualification: Joi.string()
    .valid("10th", "12th", "Graduation", "Post Graduation", "Other", "")
    .optional()
    .allow(""),
});

export const loginValidator = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string().required(),
});

export const verifyOtpValidator = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
  otp: Joi.string().length(6).required(),
});

export const resendOtpValidator = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
});

export const updateProfileValidator = Joi.object({
  name: Joi.string().trim().max(100).optional(),
  phone: Joi.string().trim().max(15).optional(),
  gender: Joi.string().valid("male", "female", "other", "").optional().allow(""),
  lastQualification: Joi.string()
    .valid("10th", "12th", "Graduation", "Post Graduation", "Other", "")
    .optional()
    .allow(""),
  dateOfBirth: Joi.date().optional().allow(null),
  bio: Joi.string().max(500).optional().allow(""),
  preferredSubjects: Joi.array().items(Joi.string().trim()).optional(),

  // Nested address
  address: Joi.object({
    line1:   Joi.string().optional().allow(""),
    line2:   Joi.string().optional().allow(""),
    city:    Joi.string().optional().allow(""),
    state:   Joi.string().optional().allow(""),
    pincode: Joi.string().optional().allow(""),
    country: Joi.string().optional().allow(""),
  }).optional(),

  // Nested academic details
  academicDetails: Joi.object({
    schoolName:        Joi.string().optional().allow(""),
    boardOrUniversity: Joi.string().optional().allow(""),
    passingYear:       Joi.string().optional().allow(""),
    percentage:        Joi.string().optional().allow(""),
  }).optional(),
});

export const changePasswordValidator = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});