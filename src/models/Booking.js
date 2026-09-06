import mongoose from "mongoose";
import { BOOKING_STATUS } from "../constants/enums.js";

const bookingSchema = new mongoose.Schema({
  hostel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hostel",
    required: true,
    index: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  guest_name: {
    type: String,
    required: true,
    trim: true,
  },
  guest_email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  guest_phone: {
    type: String,
    required: true,
    trim: true,
  },
  room_type: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    default: "",
    maxlength: 500,
  },
  status: {
    type: String,
    enum: Object.values(BOOKING_STATUS),
    default: BOOKING_STATUS.PENDING,
  },
  check_in_date: {
    type: Date,
  },
  check_out_date: {
    type: Date,
  },
  monthly_rent: {
    type: Number,
    required: true,
  },
  admin_notes: {
    type: String,
    default: "",
  },
}, { timestamps: true });

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;