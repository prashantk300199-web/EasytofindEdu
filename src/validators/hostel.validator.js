import Joi from "joi";
import { HOSTEL_TYPE } from "../constants/enums.js";
import { AMENITY_KEYS } from "../constants/amenities.js";

/* -------------------------------------------------------------------------- */
/*                          🔥 GLOBAL HELPERS (IMPORTANT)                     */
/* -------------------------------------------------------------------------- */

const joiBoolean = Joi.boolean()
  .truthy("true", "TRUE", "True")
  .falsy("false", "FALSE", "False");

// Converts numeric strings to numbers
const joiNumber = Joi.number();

// Parses JSON strings if form-data sends stringified objects/arrays
const parseJSON = (value, helpers) => {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return helpers.error("any.invalid");
    }
  }
  return value;
};

/* -------------------------------------------------------------------------- */
/*                              ENUM CONSTANTS                                */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                              ROOM SCHEMA                                   */
/* -------------------------------------------------------------------------- */

const roomItemSchema = Joi.object({
  room_type: Joi.string().valid(...ROOM_TYPES).required(),

  total_beds: joiNumber.integer().min(1).required(),

  monthly_rent: joiNumber.min(0).required(),

  is_available: joiBoolean.required(),

  available_beds_count: joiNumber.integer().min(0).default(0),

  ac: joiBoolean.default(false),
});

/* -------------------------------------------------------------------------- */
/*                           MEAL PLAN SCHEMA                                 */
/* -------------------------------------------------------------------------- */

const mealPlanItemSchema = Joi.object({
  frequency: Joi.string().valid("2_times", "3_times", "4_times").required(),

  meal_type: Joi.string().valid("veg", "non_veg", "both").required(),

  service_type: Joi.string()
    .valid("in_house_kitchen", "tiffin_service")
    .required(),

  menu_card: Joi.object({
    url: Joi.string().uri().allow(""),
    publicId: Joi.string().allow(""),
  }).optional(),
});

/* -------------------------------------------------------------------------- */
/*                           DISTANCE SCHEMA                                  */
/* -------------------------------------------------------------------------- */

const distanceItemSchema = Joi.object({
  name: Joi.string().trim().required(),
  distance_km: joiNumber.min(0).required(),
});

/* -------------------------------------------------------------------------- */
/*                           CREATE HOSTEL SCHEMA                             */
/* -------------------------------------------------------------------------- */

export const createHostelSchema = Joi.object({
  /* ---------------------------- General Info ---------------------------- */

  name: Joi.string().trim().max(200).required(),

  masked_name: Joi.string().trim().allow(""),

  hostel_type: Joi.string()
    .valid(...Object.values(HOSTEL_TYPE), "co-ed")
    .required(),

  description: Joi.string().trim().max(2000).required(),

  is_open: joiBoolean.default(true),

  /* ------------------------------ Address ------------------------------- */

  address: Joi.alternatives()
    .try(
      Joi.object({
        line1: Joi.string().trim().required(),
        line2: Joi.string().trim().allow(""),
        area: Joi.string().trim().required(),
        subarea: Joi.string().trim().required(),
        pincode: Joi.string().trim().length(6).required(),
        city: Joi.string().trim().required(),
        state: Joi.string().trim().required(),
        country: Joi.string().trim().default("India"),
      }),
      Joi.string().custom(parseJSON)
    )
    .required(),

  /* ----------------------------- Location ------------------------------- */

  location: Joi.alternatives()
    .try(
      Joi.object({
        type: Joi.string().valid("Point").default("Point"),
        coordinates: Joi.array()
          .items(joiNumber)
          .length(2)
          .required(),
      }),
      Joi.string().custom(parseJSON)
    )
    .required(),

  /* ------------------------------- Rent -------------------------------- */

  rent: Joi.alternatives()
    .try(
      Joi.object({
        security_deposit_type: Joi.string()
          .valid(
            "two_month_fee",
            "one_month_fee",
            "15_day_fee",
            "no_deposit"
          )
          .required(),

        registration_fee: joiNumber.min(0).default(0),
      }),
      Joi.string().custom(parseJSON)
    )
    .required(),

  /* ------------------------------ Rooms -------------------------------- */

  rooms: Joi.alternatives()
    .try(
      Joi.array().items(roomItemSchema).min(1),
      Joi.string().custom(parseJSON)
    )
    .required(),

  /* ---------------------------- Meal Plans ------------------------------ */

  meal_plans: Joi.alternatives()
    .try(
      Joi.array().items(mealPlanItemSchema),
      Joi.string().custom(parseJSON)
    )
    .default([]),

  /* ---------------------------- Amenities ------------------------------- */

  in_room_amenities: Joi.array()
    .items(Joi.string().valid(...AMENITY_KEYS))
    .default([]),

  common_amenities: Joi.array()
    .items(Joi.string().valid(...AMENITY_KEYS))
    .default([]),

  recreation: Joi.array()
    .items(Joi.string().valid(...AMENITY_KEYS))
    .default([]),

  /* ----------------------------- Laundry -------------------------------- */

  laundry: Joi.object({
    washing_machine: joiBoolean.default(false),
    paid_laundry_service: joiBoolean.default(false),
    drying_area: joiBoolean.default(false),
  }).default({}),

  /* ----------------------------- Security ------------------------------- */

  security: Joi.object({
    full_time_warden: joiBoolean.default(false),
    cctv: joiBoolean.default(false),
    security_guard_24x7: joiBoolean.default(false),
    biometric_entry: joiBoolean.default(false),
    visitor_register: joiBoolean.default(false),
    first_aid_kit: joiBoolean.default(false),
  }).default({}),

  /* --------------------------- Washroom -------------------------------- */

  washroom_details: Joi.object({
    indian_toilet: joiBoolean.default(false),
    western_toilet: joiBoolean.default(false),
    attached_washroom_available: joiBoolean.default(false),
    washroom_to_student_ratio: Joi.string().trim().allow(""),
  }).default({}),

  /* ----------------------------- Rules ---------------------------------- */

  rules: Joi.object({
    gate_close_time: Joi.string().default("22:00"),
    late_entry_allowed: joiBoolean.default(false),
    smoking_allowed: joiBoolean.default(false),
    alcohol_allowed: joiBoolean.default(false),

    guest_policy: Joi.string()
      .valid(
        "family_only",
        "friends_only",
        "both_allowed",
        "no_one_allowed"
      )
      .default("family_only"),

    pets_allowed: joiBoolean.default(false),

    custom_rules: Joi.array().items(Joi.string().trim()).default([]),
  }).default({}),

  /* ------------------------ Building & Legal ---------------------------- */

  building_details: Joi.object({
    building_age_years: joiNumber.min(0).default(0),
    flooring_type: Joi.string()
      .valid("tiles", "marble", "granite", "mosaic")
      .default("tiles"),
    number_of_floors: joiNumber.min(1).default(1),
  }).default({}),

  legal_docs: Joi.object({
    hostel_registration: joiBoolean.default(false),
    form_3: joiBoolean.default(false),
    food_license: joiBoolean.default(false),
    character_certificate: joiBoolean.default(false),
    trade_license: joiBoolean.default(false),
    fire_noc: joiBoolean.default(false),
    hostel_association_member: joiBoolean.default(false),
  }).default({}),

  notice_period_days: joiNumber.integer().min(0).default(30),

  search_tags: Joi.array().items(Joi.string().trim()).default([]),
});

/* -------------------------------------------------------------------------- */
/*                            UPDATE SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const updateHostelSchema = createHostelSchema.fork(
  ["name", "hostel_type", "description", "address", "location", "rent", "rooms"],
  (schema) => schema.optional()
);