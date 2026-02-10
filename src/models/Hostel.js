import mongoose from "mongoose";
import { HOSTEL_TYPE, ROOM_TYPE, HOSTEL_STATUS, GUEST_POLICY } from "../constants/enums.js";
import { AMENITY_KEYS } from "../constants/amenities.js";
import { RULE_KEYS } from "../constants/rules.js";

const roomSchema = new mongoose.Schema({
  room_type: {
    type: String,
    enum: Object.values(ROOM_TYPE),
    required: true,
  },
  beds: {
    type: Number,
    required: true,
    min: 1,
  },
  available_beds: {
    type: Number,
    required: true,
    min: 0,
  },
  attached_bathroom: {
    type: Boolean,
    default: false,
  },
  ac: {
    type: Boolean,
    default: false,
  },
}, { _id: true });

const nearbySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  distance_km: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: true });

const hostelSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  masked_name: {
    type: String,
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true,
  },
  hostel_type: {
    type: String,
    enum: Object.values(HOSTEL_TYPE),
    required: true,
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  photos: [{
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  }],
  address: {
    line1: { type: String, required: true },
    line2: { type: String, default: "" },
    city: { type: String, required: true, index: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" },
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  },
  rent: {
    monthly: { type: Number, required: true, min: 0 },
    security_deposit: { type: Number, default: 0, min: 0 },
    maintenance_charge: { type: Number, default: 0, min: 0 },
    electricity_included: { type: Boolean, default: false },
  },
  rooms: [roomSchema],
  amenities: [{
    type: String,
    enum: AMENITY_KEYS,
  }],
  nearby: {
    college_distance_km: { type: Number, default: null },
    metro_distance_km: { type: Number, default: null },
    bus_stop_distance_km: { type: Number, default: null },
    railway_station_distance_km: { type: Number, default: null },
    custom: [nearbySchema],
  },
  rules: {
    gate_close_time: { type: String, default: "22:00" },
    late_entry_allowed: { type: Boolean, default: false },
    smoking: { type: Boolean, default: false },
    alcohol: { type: Boolean, default: false },
    guests: {
      type: String,
      enum: Object.values(GUEST_POLICY),
      default: GUEST_POLICY.DAY_ONLY,
    },
    pets_allowed: { type: Boolean, default: false },
    custom_rules: [{
      type: String,
      enum: RULE_KEYS,
    }],
  },
  meal_plan: {
    breakfast: { type: Boolean, default: false },
    lunch: { type: Boolean, default: false },
    dinner: { type: Boolean, default: false },
    veg_only: { type: Boolean, default: false },
    monthly_food_charge: { type: Number, default: 0, min: 0 },
  },
  notice_period_days: {
    type: Number,
    default: 30,
    min: 0,
  },
  rating_summary: {
    overall: { type: Number, default: 0, min: 0, max: 5 },
    cleanliness: { type: Number, default: 0, min: 0, max: 5 },
    food: { type: Number, default: 0, min: 0, max: 5 },
    location: { type: Number, default: 0, min: 0, max: 5 },
    value_for_money: { type: Number, default: 0, min: 0, max: 5 },
    total_reviews: { type: Number, default: 0 },
  },
  search_tags: [{ type: String }],
  sort_priority: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: Object.values(HOSTEL_STATUS),
    default: HOSTEL_STATUS.PENDING,
  },
  is_open: {
    type: Boolean,
    default: true,
  },
  views_count: {
    type: Number,
    default: 0,
  },
  leads_count: {
    type: Number,
    default: 0,
  },
  last_viewed_at: {
    type: Date,
  },
  rejection_reason: {
    type: String,
    default: "",
  },
}, { timestamps: true });

hostelSchema.index({ location: "2dsphere" });
hostelSchema.index({ name: "text", description: "text", search_tags: "text", "address.city": "text" });
hostelSchema.index({ status: 1, hostel_type: 1, "address.city": 1 });
hostelSchema.index({ "rent.monthly": 1 });
hostelSchema.index({ "rating_summary.overall": -1 });

const Hostel = mongoose.model("Hostel", hostelSchema);

export default Hostel;