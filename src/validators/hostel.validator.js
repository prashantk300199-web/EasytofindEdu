import Joi from "joi";
import { HOSTEL_TYPE } from "../constants/enums.js";
import { AMENITY_KEYS } from "../constants/amenities.js";

// Industry Standard Room Types
const ROOM_TYPES = [
  "single_sharing_wall",
  "single_sharing_partition",
  "single_sharing_attached_washroom",
  "double_sharing_wall",
  "double_sharing_partition",
  "double_sharing_attached_washroom",
  "triple_sharing_wall",
  "triple_sharing_partition",
  "triple_sharing_attached_washroom",
  "quad_sharing_wall",
  "quad_sharing_attached_washroom",
];

// 1. Room Item Schema (Beds & Availability focus)
const roomItemSchema = Joi.object({
  room_type: Joi.string().valid(...ROOM_TYPES).required(),
  total_beds: Joi.number().integer().min(1).required(),
  monthly_rent: Joi.number().min(0).required(),
  is_available: Joi.boolean().required(),
  available_beds_count: Joi.number().integer().min(0).default(0),
  ac: Joi.boolean().default(false),
});

// 2. Meal Plan Item Schema (Menu Card focus)
const mealPlanItemSchema = Joi.object({
  frequency: Joi.string().valid("2_times", "3_times", "4_times").required(),
  meal_type: Joi.string().valid("veg", "non_veg", "both").required(),
  service_type: Joi.string().valid("in_house_kitchen", "tiffin_service").required(),
  // Price removed, handled via Menu Card image metadata
  menu_card: Joi.object({
    url: Joi.string().uri().allow(""),
    publicId: Joi.string().allow("")
  }).optional()
});

// 3. Categorized Proximity Schema
const distanceItemSchema = Joi.object({
  name: Joi.string().trim().required(),
  distance_km: Joi.number().min(0).required(),
});

export const createHostelSchema = Joi.object({
  // --- General Identity ---
  name: Joi.string().trim().max(200).required(),
  masked_name: Joi.string().trim().allow(""),
  hostel_type: Joi.string().valid(...Object.values(HOSTEL_TYPE), "co-ed").required(),
  description: Joi.string().trim().max(2000).required(),
  is_open: Joi.boolean().default(true),

  // --- Dynamic Address (Boring Road, Gandhi Maidan etc.) ---
  address: Joi.object({
    line1: Joi.string().trim().required(),
    line2: Joi.string().trim().allow(""),
    area: Joi.string().trim().required(),
    subarea: Joi.string().trim().required(),
    pincode: Joi.string().trim().length(6).required(),
    city: Joi.string().trim().required(),
    state: Joi.string().trim().required(),
    country: Joi.string().trim().default("India"),
  }).required(),

  // --- Live Location (GPS Coordinates) ---
  location: Joi.object({
    type: Joi.string().valid("Point").default("Point"),
    coordinates: Joi.array().items(Joi.number()).length(2).required(), // [lng, lat]
  }).required(),

  // --- Pricing & Charges (Security Deposit Dropdown) ---
  rent: Joi.object({
    security_deposit_type: Joi.string().valid(
      "two_month_fee",
      "one_month_fee",
      "15_day_fee",
      "no_deposit"
    ).required(),
    registration_fee: Joi.number().min(0).default(0),
    // electricity_included removed per request
  }).required(),

  // --- Inventory & Meals ---
  rooms: Joi.array().items(roomItemSchema).min(1).required(),
  meal_plans: Joi.array().items(mealPlanItemSchema).default([]),

  // --- Amenities & Services ---
  in_room_amenities: Joi.array().items(Joi.string().valid(...AMENITY_KEYS)).default([]),
  common_amenities: Joi.array().items(Joi.string().valid(...AMENITY_KEYS)).default([]),
  recreation: Joi.array().items(Joi.string().valid(...AMENITY_KEYS)).default([]),
  laundry: Joi.object({
    washing_machine: Joi.boolean().default(false),
    paid_laundry_service: Joi.boolean().default(false),
    drying_area: Joi.boolean().default(false),
  }).default({}),

  // --- Security & Washroom ---
  security: Joi.object({
    full_time_warden: Joi.boolean().default(false),
    cctv: Joi.boolean().default(false),
    security_guard_24x7: Joi.boolean().default(false),
    biometric_entry: Joi.boolean().default(false),
    visitor_register: Joi.boolean().default(false),
    first_aid_kit: Joi.boolean().default(false),
  }).default({}),

  washroom_details: Joi.object({
    indian_toilet: Joi.boolean().default(false),
    western_toilet: Joi.boolean().default(false),
    attached_washroom_available: Joi.boolean().default(false),
    washroom_to_student_ratio: Joi.string().trim().allow(""),
  }).default({}),

  // --- Rules & Guest Policy (4 Options) ---
  rules: Joi.object({
    gate_close_time: Joi.string().default("22:00"),
    late_entry_allowed: Joi.boolean().default(false),
    smoking_allowed: Joi.boolean().default(false),
    alcohol_allowed: Joi.boolean().default(false),
    guest_policy: Joi.string().valid(
      "family_only",
      "friends_only",
      "both_allowed",
      "no_one_allowed"
    ).default("family_only"),
    pets_allowed: Joi.boolean().default(false),
    custom_rules: Joi.array().items(Joi.string().trim()).default([]),
  }).default({}),

  // --- Categorized Proximity (PW, Allen, Station) ---
  nearby_distances: Joi.object({
    institutes: Joi.array().items(distanceItemSchema).default([]),
    landmarks: Joi.array().items(distanceItemSchema).default([]),
  }).default({}),

  // --- Building & Legal ---
  building_details: Joi.object({
    building_age_years: Joi.number().min(0).default(0),
    flooring_type: Joi.string().valid("tiles", "marble", "granite", "mosaic").default("tiles"),
    number_of_floors: Joi.number().min(1).default(1),
  }).default({}),

  legal_docs: Joi.object({
    hostel_registration: Joi.boolean().default(false),
    form_3: Joi.boolean().default(false),
    food_license: Joi.boolean().default(false),
    character_certificate: Joi.boolean().default(false),
    trade_license: Joi.boolean().default(false),
    fire_noc: Joi.boolean().default(false),
    hostel_association_member: Joi.boolean().default(false),
  }).default({}),

  notice_period_days: Joi.number().integer().min(0).default(30),
  search_tags: Joi.array().items(Joi.string().trim()).default([]),
});

export const updateHostelSchema = createHostelSchema.fork(
  ["name", "hostel_type", "description", "address", "location", "rent", "rooms"],
  (schema) => schema.optional()
);