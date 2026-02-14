import mongoose from "mongoose";
import { HOSTEL_TYPE, ROOM_TYPE, HOSTEL_STATUS, GUEST_POLICY } from "../constants/enums.js";

const roomSchema = new mongoose.Schema({
  room_type: { type: String, enum: Object.values(ROOM_TYPE), required: true },
  total_beds: { type: Number, required: true, min: 1 }, // Updated from 'beds'
  available_beds: { type: Number, required: true, min: 0 },
  attached_bathroom: { type: Boolean, default: false },
  ac: { type: Boolean, default: false },
  cooler: { type: Boolean, default: false }, // New field
}, { _id: true });

const nearbySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  distance_km: { type: Number, required: true, min: 0 },
}, { _id: true });

const hostelSchema = new mongoose.Schema({
  // 1. Basic Details
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 200 },
  masked_name: { type: String, trim: true },
  slug: { type: String, unique: true, lowercase: true, index: true },
  hostel_type: { type: String, enum: [...Object.values(HOSTEL_TYPE), "co-ed"], required: true }, // Added co-ed
  description: { type: String, required: true, maxlength: 2000 },
  is_open: { type: Boolean, default: true },
  status: { type: String, enum: Object.values(HOSTEL_STATUS), default: HOSTEL_STATUS.PENDING },

  // 2. Media
  photos: [{
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  }],
  video_url: { type: String, default: "" }, // New field

  // 3. Address
  address: {
    area: { type: String, required: true }, // New field
    subarea: { type: String, default: "" }, // New field
    locality: { type: String, default: "" }, // New field
    line1: { type: String, required: true },
    line2: { type: String, default: "" },
    city: { type: String, required: true, index: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" },
  },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
  },
  search_tags: [{ type: String }],

  // 4. Rent & Charges
  rent: {
    monthly: { type: Number, required: true, min: 0 },
    security_deposit: { type: Number, default: 0, min: 0 },
    maintenance_charge: { type: Number, default: 0, min: 0 },
    electricity_included: { type: Boolean, default: false },
    notice_period_days: { type: Number, default: 30, min: 0 },
  },

  // 5. Room Details
  rooms: [roomSchema],

  // 6. Meal Plan
  meal_plan: {
    breakfast: { type: Boolean, default: false },
    lunch: { type: Boolean, default: false },
    dinner: { type: Boolean, default: false },
    meals_per_day: { type: Number, enum: [2, 3, 4], default: 3 },
    veg_only: { type: Boolean, default: false },
    non_veg_available: { type: Boolean, default: false },
    monthly_food_charge: { type: Number, default: 0, min: 0 },
    dining_hall: { type: Boolean, default: false },
    kitchen_available: { type: Boolean, default: false },
    tiffin_service: { type: Boolean, default: false },
  },

  // 7 & 8. Amenities (Arrays for flexibility)
  in_room_amenities: [{ type: String }], // mattress, pillow, study_table, etc.
  common_amenities: [{ type: String }], // wifi, ro_water, power_backup, etc.

  // 9. Laundry
  laundry: {
    washing_machine: { type: Boolean, default: false },
    paid_laundry_service: { type: Boolean, default: false },
    drying_area: { type: Boolean, default: false },
  },

  // 10. Recreation & Facilities
  recreation: [{ type: String }], // library, gym, terrace_access, etc.

  // 11. Washroom Details
  washroom_details: {
    indian_toilet: { type: Boolean, default: false },
    western_toilet: { type: Boolean, default: false },
    attached_washroom_available: { type: Boolean, default: false },
    washroom_to_student_ratio: { type: String, default: "" },
  },

  // 12. Security
  security: {
    full_time_warden: { type: Boolean, default: false },
    cctv: { type: Boolean, default: false },
    security_guard_24x7: { type: Boolean, default: false },
    biometric_entry: { type: Boolean, default: false },
    visitor_register: { type: Boolean, default: false },
    first_aid_kit: { type: Boolean, default: false },
  },

  // 13. Rules
  rules: {
    gate_close_time: { type: String, default: "22:00" },
    late_entry_allowed: { type: Boolean, default: false },
    smoking_allowed: { type: Boolean, default: false },
    alcohol_allowed: { type: Boolean, default: false },
    guest_policy: {
      type: String,
      enum: ["not_allowed", "day_only", "allowed"],
      default: "day_only",
    },
    pets_allowed: { type: Boolean, default: false },
    custom_rules: [{ type: String }],
  },

  // 14. Nearby Distances
  nearby_distances: {
    college_distance_km: { type: Number, default: null },
    coaching_distance_km: { type: Number, default: null },
    metro_distance_km: { type: Number, default: null },
    bus_stop_distance_km: { type: Number, default: null },
    railway_station_distance_km: { type: Number, default: null },
    airport_distance_km: { type: Number, default: null },
    hospital_distance_km: { type: Number, default: null },
    police_station_distance_km: { type: Number, default: null },
    main_road_distance_km: { type: Number, default: null },
    city_center_distance_km: { type: Number, default: null },
    mall_distance_km: { type: Number, default: null },
    park_distance_km: { type: Number, default: null },
    library_distance_km: { type: Number, default: null },
    custom: [nearbySchema],
  },

  // 15. Building Details
  building_details: {
    building_age_years: { type: Number, min: 0 },
    flooring_type: { type: String, enum: ["tiles", "marble", "granite", "mosaic"] },
    number_of_floors: { type: Number, min: 1 },
  },

  // 16. Legal Documents
  legal_docs: {
    hostel_registration: { type: Boolean, default: false },
    form_c: { type: Boolean, default: false },
    food_license: { type: Boolean, default: false },
    character_certificate: { type: Boolean, default: false },
    trade_license: { type: Boolean, default: false },
    fire_noc: { type: Boolean, default: false },
    hostel_association_member: { type: Boolean, default: false },
  },

  // Analytics & Sorting
  rating_summary: {
    overall: { type: Number, default: 0 },
    total_reviews: { type: Number, default: 0 },
  },
  views_count: { type: Number, default: 0 },
  leads_count: { type: Number, default: 0 },
  sort_priority: { type: Number, default: 0 },

}, { timestamps: true });

// Indexes for performance
hostelSchema.index({ location: "2dsphere" });
hostelSchema.index({ name: "text", "address.city": "text", search_tags: "text" });

const Hostel = mongoose.model("Hostel", hostelSchema);
export default Hostel;