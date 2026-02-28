import Joi from 'joi';

export const registerValidator = Joi.object({
  name: Joi.string().required().trim().max(100),
  email: Joi.string().email().required().lowercase().trim(),
  phone: Joi.string().required().trim().max(15),
  password: Joi.string().min(6).required()
});

export const loginValidator = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string().required()
});

export const verifyOtpValidator = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
  otp: Joi.string().length(6).required()
});

export const resendOtpValidator = Joi.object({
  email: Joi.string().email().required().lowercase().trim()
});

export const adminCreateInstituteOwnerValidator = Joi.object({
  name: Joi.string().required().trim().max(100),
  email: Joi.string().email().required().lowercase().trim(),
  phone: Joi.string().required().trim().max(15),
  password: Joi.string().min(6).required()
});
