import Joi from "joi";
import { HOSTEL_TYPE, ROOM_TYPE, GUEST_POLICY } from "../constants/enums.js";
import { AMENITY_KEYS } from "../constants/amenities.js";

const roomItemSchema = Joi.object({
  room_type: Joi.string().valid(...Object.values(ROOM_TYPE)).required(),
  total_beds: Joi.number().integer().min(1).required(),
  available_beds: Joi.number().integer().min(0).required(),
  attached_bathroom: Joi.boolean().default(false),
  ac: Joi.boolean().default(false),
  cooler: Joi.boolean().default(false),
});

const nearbyCustomSchema = Joi.object({
  name: Joi.string().trim().required(),
  distance_km: Joi.number().min(0).required(),
});

export const createHostelSchema = Joi.object({
  // 1. Basic Details
  name: Joi.string().trim().max(200).required(),
  masked_name: Joi.string().trim().allow(""),
  hostel_type: Joi.string().valid(...Object.values(HOSTEL_TYPE), "co-ed").required(),
  description: Joi.string().trim().max(2000).required(),
  is_open: Joi.boolean().default(true),

  // 2. Media
  video_url: Joi.string().uri().allow("").default(""),

  // 3. Address & Geo-Location (FIXED)
  address: Joi.object({
    area: Joi.string().trim().required(),
    subarea: Joi.string().trim().allow(""),
    locality: Joi.string().trim().allow(""),
    line1: Joi.string().trim().required(),
    line2: Joi.string().trim().allow(""),
    city: Joi.string().trim().required(),
    state: Joi.string().trim().required(),
    pincode: Joi.string().trim().required(),
    country: Joi.string().trim().default("India"),
  }).required(),

  location: Joi.object({
    type: Joi.string().valid("Point").default("Point"),
    coordinates: Joi.array().items(Joi.number()).length(2).required(), // [lng, lat]
  }).required(),

  search_tags: Joi.array().items(Joi.string().trim()).default([]),

  // 4. Rent & Charges
  rent: Joi.object({
    monthly: Joi.number().min(0).required(),
    security_deposit: Joi.number().min(0).default(0),
    maintenance_charge: Joi.number().min(0).default(0),
    electricity_included: Joi.boolean().default(false),
    notice_period_days: Joi.number().integer().min(0).default(30),
  }).required(),

  // 5. Room Details
  rooms: Joi.array().items(roomItemSchema).min(1).required(),

  // 6. Meal Plan
  meal_plan: Joi.object({
    breakfast: Joi.boolean().default(false),
    lunch: Joi.boolean().default(false),
    dinner: Joi.boolean().default(false),
    meals_per_day: Joi.number().valid(2, 3, 4).default(3),
    veg_only: Joi.boolean().default(false),
    non_veg_available: Joi.boolean().default(false),
    monthly_food_charge: Joi.number().min(0).default(0),
    dining_hall: Joi.boolean().default(false),
    kitchen_available: Joi.boolean().default(false),
    tiffin_service: Joi.boolean().default(false),
  }).default({}),

  // 7, 8, 10. Amenities
  in_room_amenities: Joi.array().items(Joi.string().valid(...AMENITY_KEYS)).default([]),
  common_amenities: Joi.array().items(Joi.string().valid(...AMENITY_KEYS)).default([]),
  recreation: Joi.array().items(Joi.string().valid(...AMENITY_KEYS)).default([]),

  // 9. Laundry
  laundry: Joi.object({
    washing_machine: Joi.boolean().default(false),
    paid_laundry_service: Joi.boolean().default(false),
    drying_area: Joi.boolean().default(false),
  }).default({}),

  // 11. Washroom Details
  washroom_details: Joi.object({
    indian_toilet: Joi.boolean().default(false),
    western_toilet: Joi.boolean().default(false),
    attached_washroom_available: Joi.boolean().default(false),
    washroom_to_student_ratio: Joi.string().trim().allow(""),
  }).default({}),

  // 12. Security
  security: Joi.object({
    full_time_warden: Joi.boolean().default(false),
    cctv: Joi.boolean().default(false),
    security_guard_24x7: Joi.boolean().default(false),
    biometric_entry: Joi.boolean().default(false),
    visitor_register: Joi.boolean().default(false),
    first_aid_kit: Joi.boolean().default(false),
  }).default({}),

  // 13. Rules
  rules: Joi.object({
    gate_close_time: Joi.string().default("22:00"),
    late_entry_allowed: Joi.boolean().default(false),
    smoking_allowed: Joi.boolean().default(false),
    alcohol_allowed: Joi.boolean().default(false),
    guest_policy: Joi.string().valid("not_allowed", "day_only", "allowed").default("day_only"),
    pets_allowed: Joi.boolean().default(false),
    custom_rules: Joi.array().items(Joi.string().trim()).default([]),
  }).default({}),

  // 14. Proximity
  nearby_distances: Joi.object({
    college_distance_km: Joi.number().min(0).allow(null, 0),
    coaching_distance_km: Joi.number().min(0).allow(null, 0),
    metro_distance_km: Joi.number().min(0).allow(null, 0),
    bus_stop_distance_km: Joi.number().min(0).allow(null, 0),
    railway_station_distance_km: Joi.number().min(0).allow(null, 0),
    airport_distance_km: Joi.number().min(0).allow(null, 0),
    hospital_distance_km: Joi.number().min(0).allow(null, 0),
    police_station_distance_km: Joi.number().min(0).allow(null, 0),
    main_road_distance_km: Joi.number().min(0).allow(null, 0),
    city_center_distance_km: Joi.number().min(0).allow(null, 0),
    mall_distance_km: Joi.number().min(0).allow(null, 0),
    park_distance_km: Joi.number().min(0).allow(null, 0),
    library_distance_km: Joi.number().min(0).allow(null, 0),
    custom: Joi.array().items(nearbyCustomSchema).default([]),
  }).default({}),

  // 15. Building
  building_details: Joi.object({
    building_age_years: Joi.number().min(0).default(0),
    flooring_type: Joi.string().valid("tiles", "marble", "granite", "mosaic").default("tiles"),
    number_of_floors: Joi.number().min(1).default(1),
  }).default({}),

  // 16. Legal
  legal_docs: Joi.object({
    hostel_registration: Joi.boolean().default(false),
    form_c: Joi.boolean().default(false),
    food_license: Joi.boolean().default(false),
    character_certificate: Joi.boolean().default(false),
    trade_license: Joi.boolean().default(false),
    fire_noc: Joi.boolean().default(false),
    hostel_association_member: Joi.boolean().default(false),
  }).default({}),
});

export const updateHostelSchema = createHostelSchema.fork(
  ["name", "hostel_type", "description", "address", "location", "rent", "rooms"],
  (schema) => schema.optional()
);