import mongoose from "mongoose";
import { HOSTEL_TYPE, HOSTEL_STATUS } from "../constants/enums.js";

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

const roomSchema = new mongoose.Schema({
  room_type: { type: String, enum: ROOM_TYPES, required: true },
  total_beds: { type: Number, required: true, min: 1 },
  available_beds_count: { type: Number, default: 0 },
  monthly_rent: { type: Number, required: true, min: 0 },
  is_available: { type: Boolean, default: true },
  ac: { type: Boolean, default: false },
}, { _id: true });

const mealPlanSchema = new mongoose.Schema({
  frequency: { type: String, enum: ["2_times", "3_times", "4_times"], required: true },
  meal_type: { type: String, enum: ["veg", "non_veg", "both"], required: true },
  service_type: { type: String, enum: ["in_house_kitchen", "tiffin_service"], required: true },
  menu_card: {
    url: { type: String },
    publicId: { type: String }
  }
}, { _id: true });

const distanceItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  distance_km: { type: Number, required: true, min: 0 }
}, { _id: true });

const hostelSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 200 },
  masked_name: { type: String, trim: true },
  slug: { type: String, unique: true, lowercase: true, index: true },
  hostel_type: { type: String, enum: [...Object.values(HOSTEL_TYPE), "co-ed"], required: true },
  description: { type: String, required: true, maxlength: 2000 },
  photos: [{
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  }],
  address: {
    line1: { type: String, required: true },
    line2: { type: String, default: "" },
    area: { type: String, required: true, index: true },
    subarea: { type: String, required: true },
    city: { type: String, required: true, index: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" },
  },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true },
  },
  rent: {
    security_deposit_type: {
      type: String,
      enum: ["two_month_fee", "one_month_fee", "15_day_fee", "no_deposit"],
      required: true
    },
    registration_fee: { type: Number, default: 0, min: 0 },
  },

  // ADDED FROM YOUR IMAGE: Total Beds in entire hostel
  total_hostel_beds: { type: Number, default: 0 },

  rooms: [roomSchema],
  meal_plans: [mealPlanSchema],
  in_room_amenities: [{ type: String }],
  common_amenities: [{ type: String }],
  recreation: [{ type: String }],
  laundry: {
    washing_machine: { type: Boolean, default: false },
    paid_laundry_service: { type: Boolean, default: false },
    drying_area: { type: Boolean, default: false },
  },

  // UPDATED FROM YOUR IMAGE: Washroom Details
  washroom_details: {
    indian_toilet: { type: Boolean, default: false },
    western_toilet: { type: Boolean, default: false },
    attached_washroom_available: { type: Boolean, default: false },
    total_washrooms: { type: Number, default: 0 }, // New Input
    washroom_to_student_ratio: { type: String, default: "" }, // New Input
  },

  // ADDED FROM YOUR IMAGE: Warden Details
  warden: {
    name: { type: String, trim: true },
    gender: { type: String, enum: ["male", "female", "other"] },
    age: { type: Number, min: 18 },
    contact_number: { type: String, trim: true },
  },

  security: {
    full_time_warden: { type: Boolean, default: false },
    cctv: { type: Boolean, default: false },
    security_guard_24x7: { type: Boolean, default: false },
    biometric_entry: { type: Boolean, default: false },
    visitor_register: { type: Boolean, default: false },
    first_aid_kit: { type: Boolean, default: false },
  },
  rules: {
    gate_close_time: { type: String, default: "22:00" },
    late_entry_allowed: { type: Boolean, default: false },
    smoking_allowed: { type: Boolean, default: false },
    alcohol_allowed: { type: Boolean, default: false },
    guest_policy: {
      type: String,
      enum: ["family_only", "friends_only", "both_allowed", "no_one_allowed"],
      default: "family_only",
    },
    pets_allowed: { type: Boolean, default: false },
    custom_rules: [{ type: String }],
  },
  nearby_distances: {
    institutes: { type: [distanceItemSchema], default: [] },
    landmarks: { type: [distanceItemSchema], default: [] },
  },
  building_details: {
    building_age_years: { type: Number, min: 0, default: 0 },
    flooring_type: { type: String, enum: ["tiles", "marble", "granite", "mosaic"], default: "tiles" },
    number_of_floors: { type: Number, min: 1, default: 1 },
  },
  legal_docs: {
    hostel_registration: { type: Boolean, default: false },
    form_3: { type: Boolean, default: false },
    food_license: { type: Boolean, default: false },
    character_certificate: { type: Boolean, default: false },
    trade_license: { type: Boolean, default: false },
    fire_noc: { type: Boolean, default: false },
    hostel_association_member: { type: Boolean, default: false },
  },
  notice_period_days: { type: Number, default: 30, min: 0 },
  status: { type: String, enum: Object.values(HOSTEL_STATUS), default: HOSTEL_STATUS.PENDING },
  is_open: { type: Boolean, default: true },
}, { timestamps: true });

hostelSchema.index({ location: "2dsphere" });
hostelSchema.index({ name: "text", "address.city": "text", "address.area": "text" });

const Hostel = mongoose.model("Hostel", hostelSchema);
export default Hostel;