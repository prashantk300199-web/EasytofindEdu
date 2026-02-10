import Booking from "../models/Booking.js";
import Hostel from "../models/Hostel.js";
import { HOSTEL_STATUS, BOOKING_STATUS } from "../constants/enums.js";
import { trackLead } from "../services/analytics.service.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createBooking = asyncHandler(async (req, res) => {
  const hostel = await Hostel.findById(req.params.hostelId);

  if (!hostel) {
    throw new ApiError(404, "Hostel not found.");
  }

  if (hostel.status !== HOSTEL_STATUS.APPROVED) {
    throw new ApiError(400, "Hostel is not available for booking.");
  }

  if (!hostel.is_open) {
    throw new ApiError(400, "Hostel is currently closed for new bookings.");
  }

  const existingBooking = await Booking.findOne({
    hostel: hostel._id,
    guest_email: req.body.guest_email,
    status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED] },
  });

  if (existingBooking) {
    throw new ApiError(409, "You already have an active booking for this hostel.");
  }

  const booking = await Booking.create({
    hostel: hostel._id,
    owner: hostel.owner,
    guest_name: req.body.guest_name,
    guest_email: req.body.guest_email,
    guest_phone: req.body.guest_phone,
    room_type: req.body.room_type,
    message: req.body.message,
    check_in_date: req.body.check_in_date,
    monthly_rent: hostel.rent.monthly,
  });

  await trackLead(hostel._id);

  res.status(201).json(
    new ApiResponse(201, "Booking request submitted.", booking)
  );
});

export const getOwnerBookings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, hostelId } = req.query;

  const filter = { owner: req.user._id };
  if (status) filter.status = status;
  if (hostelId) filter.hostel = hostelId;

  const skip = (Number(page) - 1) * Number(limit);

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("hostel", "name masked_name slug")
      .lean(),
    Booking.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, "Bookings fetched.", {
      bookings,
      pagination: {
        current_page: Number(page),
        total_pages: Math.ceil(total / Number(limit)),
        total_results: total,
        per_page: Number(limit),
      },
    })
  );
});

export const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({
    _id: req.params.id,
    owner: req.user._id,
  }).populate("hostel", "name masked_name slug address");

  if (!booking) {
    throw new ApiError(404, "Booking not found.");
  }

  res.status(200).json(
    new ApiResponse(200, "Booking fetched.", booking)
  );
});

export const updateBookingStatus = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({
    _id: req.params.id,
    owner: req.user._id,
  });

  if (!booking) {
    throw new ApiError(404, "Booking not found.");
  }

  const { status, admin_notes } = req.body;

  const validTransitions = {
    [BOOKING_STATUS.PENDING]: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CANCELLED],
    [BOOKING_STATUS.CONFIRMED]: [BOOKING_STATUS.CHECKED_IN, BOOKING_STATUS.CANCELLED],
    [BOOKING_STATUS.CHECKED_IN]: [BOOKING_STATUS.CHECKED_OUT],
  };

  const allowedNext = validTransitions[booking.status];
  if (!allowedNext || !allowedNext.includes(status)) {
    throw new ApiError(400, `Cannot transition from ${booking.status} to ${status}.`);
  }

  booking.status = status;
  if (admin_notes) booking.admin_notes = admin_notes;
  if (status === BOOKING_STATUS.CHECKED_OUT && !booking.check_out_date) {
    booking.check_out_date = new Date();
  }

  await booking.save();

  res.status(200).json(
    new ApiResponse(200, "Booking status updated.", booking)
  );
});