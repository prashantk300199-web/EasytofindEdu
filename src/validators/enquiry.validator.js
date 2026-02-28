import Joi from "joi";

export const createEnquiryValidator = Joi.object({
  message: Joi.string().max(1000).optional().allow(""),

  preferredContactTime: Joi.string()
    .valid("Morning (9AM-12PM)", "Afternoon (12PM-4PM)", "Evening (4PM-8PM)", "Any Time")
    .default("Any Time"),

  willingToVisit: Joi.boolean().default(false),

  expectedJoiningDate: Joi.string()
    .valid("Immediately", "Within 1 Month", "Within 3 Months", "Just Exploring")
    .default("Just Exploring"),
});

export const updateEnquiryStatusValidator = Joi.object({
  status: Joi.string()
    .valid("pending", "contacted", "enrolled", "closed")
    .required(),
  adminNote: Joi.string().max(500).optional().allow(""),
});