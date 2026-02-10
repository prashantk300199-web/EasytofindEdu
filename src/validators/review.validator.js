import Joi from "joi";

export const createReviewSchema = Joi.object({
  reviewer_name: Joi.string().trim().min(2).max(100).required(),
  reviewer_email: Joi.string().email().lowercase().trim().required(),
  ratings: Joi.object({
    overall: Joi.number().min(1).max(5).required(),
    cleanliness: Joi.number().min(1).max(5).required(),
    food: Joi.number().min(1).max(5).required(),
    location: Joi.number().min(1).max(5).required(),
    value_for_money: Joi.number().min(1).max(5).required(),
  }).required(),
  comment: Joi.string().trim().min(10).max(1000).required(),
});