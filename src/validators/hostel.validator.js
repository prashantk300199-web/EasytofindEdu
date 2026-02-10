import Joi from "joi";
import { HOSTEL_TYPE, ROOM_TYPE, GUEST_POLICY } from "../constants/enums.js";
import { AMENITY_KEYS } from "../constants/amenities.js";
import { RULE_KEYS } from "../constants/rules.js";

const roomItemSchema = Joi.object({
  room_type: Joi.string().valid(...Object.values(ROOM_TYPE)).required(),
  beds: Joi.number().integer().min(1).required(),
  available_beds: Joi.number().integer().min(0).required(),
  attached_bathroom: Joi.boolean().default(false),
  ac: Joi.boolean().default(false),
});

const nearbyCustomSchema = Joi.object({
  name: Joi.string().trim().required(),
  distance_km: Joi.number().min(0).required(),
});

export const createHostelSchema = Joi.object({
  name: Joi.string().trim().max(200).required(),
  hostel_type: Joi.string().valid(...Object.values(HOSTEL_TYPE)).required(),
  description: Joi.string().trim().max(2000).required(),
  address: Joi.object({
    line1: Joi.string().trim().required(),
    line2: Joi.string().trim().allow("").default(""),
    city: Joi.string().trim().required(),
    state: Joi.string().trim().required(),
    pincode: Joi.string().trim().required(),
    country: Joi.string().trim().default("India"),
  }).required(),
  coordinates: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
  }).required(),
  rent: Joi.object({
    monthly: Joi.number().min(0).required(),
    security_deposit: Joi.number().min(0).default(0),
    maintenance_charge: Joi.number().min(0).default(0),
    electricity_included: Joi.boolean().default(false),
  }).required(),
  rooms: Joi.array().items(roomItemSchema).min(1).required(),
  amenities: Joi.array().items(Joi.string().valid(...AMENITY_KEYS)).default([]),
  nearby: Joi.object({
    college_distance_km: Joi.number().min(0).allow(null).default(null),
    metro_distance_km: Joi.number().min(0).allow(null).default(null),
    bus_stop_distance_km: Joi.number().min(0).allow(null).default(null),
    railway_station_distance_km: Joi.number().min(0).allow(null).default(null),
    custom: Joi.array().items(nearbyCustomSchema).default([]),
  }).default({}),
  rules: Joi.object({
    gate_close_time: Joi.string().default("22:00"),
    late_entry_allowed: Joi.boolean().default(false),
    smoking: Joi.boolean().default(false),
    alcohol: Joi.boolean().default(false),
    guests: Joi.string().valid(...Object.values(GUEST_POLICY)).default(GUEST_POLICY.DAY_ONLY),
    pets_allowed: Joi.boolean().default(false),
    custom_rules: Joi.array().items(Joi.string().valid(...RULE_KEYS)).default([]),
  }).default({}),
  meal_plan: Joi.object({
    breakfast: Joi.boolean().default(false),
    lunch: Joi.boolean().default(false),
    dinner: Joi.boolean().default(false),
    veg_only: Joi.boolean().default(false),
    monthly_food_charge: Joi.number().min(0).default(0),
  }).default({}),
  notice_period_days: Joi.number().integer().min(0).default(30),
});

export const updateHostelSchema = createHostelSchema.fork(
  ["name", "hostel_type", "description", "address", "coordinates", "rent", "rooms"],
  (schema) => schema.optional()
);