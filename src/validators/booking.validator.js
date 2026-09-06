import Joi from "joi";
import { BOOKING_STATUS } from "../constants/enums.js";

export const createBookingSchema = Joi.object({
  guest_name: Joi.string().trim().min(2).max(100).required(),
  guest_email: Joi.string().email().lowercase().trim().required(),
  guest_phone: Joi.string().trim().min(10).max(15).required(),
  room_type: Joi.string().required(),
  message: Joi.string().trim().max(500).allow("").default(""),
  check_in_date: Joi.date().iso().required(),
});

export const updateBookingStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(BOOKING_STATUS)).required(),
  admin_notes: Joi.string().trim().max(500).allow("").default(""),
});