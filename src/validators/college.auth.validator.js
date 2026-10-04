import Joi from 'joi';

// College Owner auth uses the same shape as institute owner but does NOT
// require OTP/email verification — registration creates a verified account
// immediately and returns a JWT.

export const registerValidator = Joi.object({
  name: Joi.string().required().trim().max(100),
  email: Joi.string().email().required().lowercase().trim(),
  phone: Joi.string().required().trim().max(15),
  password: Joi.string().min(6).required(),
  referralCode: Joi.string().optional().allow(''),
});

export const loginValidator = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string().required(),
});

export const adminCreateCollegeOwnerValidator = Joi.object({
  name: Joi.string().required().trim().max(100),
  email: Joi.string().email().required().lowercase().trim(),
  phone: Joi.string().required().trim().max(15),
  password: Joi.string().min(6).required(),
});