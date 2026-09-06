import Joi from 'joi';

export const googleLoginSchema = Joi.object({
  idToken: Joi.string().required(),
  role: Joi.string().valid('student', 'owner', 'institute_owner').required(),
  referralCode: Joi.string().optional().allow('').trim().uppercase(),
});
