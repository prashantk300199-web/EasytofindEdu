import Hostel from "../models/Hostel.js";
import HostelInquiry from "../models/HostelInquiry.js";
import Booking from "../models/Booking.js";
import Review from "../models/Review.js";
import { HOSTEL_STATUS } from "../constants/enums.js";
import { deleteMultipleImages } from "../services/cloudinary.service.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getHostelInquiries = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = { hostel: req.params.id };

  const [inquiries, total] = await Promise.all([
    HostelInquiry.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    HostelInquiry.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, "Inquiries fetched.", {
      inquiries,
      pagination: {
        current_page: Number(page),
        total_pages: Math.ceil(total / Number(limit)),
        total_results: total,
      },
    })
  );
});

export const getAllHostelInquiries = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, status } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = {};
  if (status) filter.status = status;

  const [inquiries, total] = await Promise.all([
    HostelInquiry.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("hostel", "name address.city")
      .lean(),
    HostelInquiry.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, "All inquiries fetched.", {
      inquiries,
      pagination: {
        current_page: Number(page),
        total_pages: Math.ceil(total / Number(limit)),
        total_results: total,
      },
    })
  );
});

export const getAllHostels = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, city, hostel_type, search } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = {};
  if (status) filter.status = status;
  if (city) filter["address.city"] = new RegExp(city, "i");
  if (hostel_type) filter.hostel_type = hostel_type;
  if (search) {
    filter.$or = [
      { name: new RegExp(search, "i") },
      { slug: new RegExp(search, "i") },
      { "address.city": new RegExp(search, "i") },
    ];
  }

  const [hostels, total] = await Promise.all([
    Hostel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("owner", "name email phone")
      .lean(),
    Hostel.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, "Hostels fetched.", {
      hostels,
      pagination: {
        current_page: Number(page),
        total_pages: Math.ceil(total / Number(limit)),
        total_results: total,
        per_page: Number(limit),
      },
    })
  );
});

export const getHostelById = asyncHandler(async (req, res) => {
  const hostel = await Hostel.findById(req.params.id)
    .populate("owner", "name email phone profilePhoto address");

  if (!hostel) {
    throw new ApiError(404, "Hostel not found.");
  }

  const bookings = await Booking.countDocuments({ hostel: hostel._id });
  const reviews = await Review.countDocuments({ hostel: hostel._id });

  res.status(200).json(
    new ApiResponse(200, "Hostel fetched.", {
      hostel,
      stats: { total_bookings: bookings, total_reviews: reviews },
    })
  );
});

export const updateHostelStatus = asyncHandler(async (req, res) => {
  const { status, rejection_reason } = req.body;

  if (!Object.values(HOSTEL_STATUS).includes(status)) {
    throw new ApiError(400, "Invalid status.");
  }

  const hostel = await Hostel.findById(req.params.id);
  if (!hostel) {
    throw new ApiError(404, "Hostel not found.");
  }

  hostel.status = status;

  if (status === HOSTEL_STATUS.REJECTED && rejection_reason) {
    hostel.rejection_reason = rejection_reason;
  }

  if (status === HOSTEL_STATUS.APPROVED) {
    hostel.rejection_reason = "";
  }

  await hostel.save();

  res.status(200).json(
    new ApiResponse(200, `Hostel status updated to ${status}.`, hostel)
  );
});

export const updateHostelSortPriority = asyncHandler(async (req, res) => {
  const { sort_priority } = req.body;

  const hostel = await Hostel.findByIdAndUpdate(
    req.params.id,
    { sort_priority },
    { new: true }
  );

  if (!hostel) {
    throw new ApiError(404, "Hostel not found.");
  }

  res.status(200).json(
    new ApiResponse(200, "Sort priority updated.", hostel)
  );
});

export const toggleHostelOpenStatus = asyncHandler(async (req, res) => {
  const hostel = await Hostel.findById(req.params.id);
  if (!hostel) {
    throw new ApiError(404, "Hostel not found.");
  }

  hostel.is_open = !hostel.is_open;
  await hostel.save();

  res.status(200).json(
    new ApiResponse(200, `Hostel ${hostel.is_open ? 'activated' : 'deactivated'}.`, hostel)
  );
});

export const deleteHostel = asyncHandler(async (req, res) => {
  const hostel = await Hostel.findById(req.params.id);

  if (!hostel) {
    throw new ApiError(404, "Hostel not found.");
  }

  const publicIds = hostel.photos.map((p) => p.publicId).filter(Boolean);
  if (publicIds.length > 0) {
    await deleteMultipleImages(publicIds);
  }

  await Booking.deleteMany({ hostel: hostel._id });
  await Review.deleteMany({ hostel: hostel._id });
  await Hostel.findByIdAndDelete(hostel._id);

  res.status(200).json(
    new ApiResponse(200, "Hostel and all associated data deleted.")
  );
});

export const getHostelBookings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = { hostel: req.params.id };
  if (status) filter.status = status;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
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

export const getHostelReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = { hostel: req.params.id };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Review.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, "Reviews fetched.", {
      reviews,
      pagination: {
        current_page: Number(page),
        total_pages: Math.ceil(total / Number(limit)),
        total_results: total,
        per_page: Number(limit),
      },
    })
  );
});

export const toggleReviewApproval = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.reviewId);

  if (!review) {
    throw new ApiError(404, "Review not found.");
  }

  review.is_approved = !review.is_approved;
  await review.save();

  const Hostel2 = (await import("../models/Hostel.js")).default;
  const result = await Review.aggregate([
    { $match: { hostel: review.hostel, is_approved: true } },
    {
      $group: {
        _id: "$hostel",
        overall: { $avg: "$ratings.overall" },
        cleanliness: { $avg: "$ratings.cleanliness" },
        food: { $avg: "$ratings.food" },
        location: { $avg: "$ratings.location" },
        value_for_money: { $avg: "$ratings.value_for_money" },
        total_reviews: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    const r = result[0];
    await Hostel2.findByIdAndUpdate(review.hostel, {
      rating_summary: {
        overall: Math.round(r.overall * 10) / 10,
        cleanliness: Math.round(r.cleanliness * 10) / 10,
        food: Math.round(r.food * 10) / 10,
        location: Math.round(r.location * 10) / 10,
        value_for_money: Math.round(r.value_for_money * 10) / 10,
        total_reviews: r.total_reviews,
      },
    });
  }

  res.status(200).json(
    new ApiResponse(200, `Review ${review.is_approved ? "approved" : "hidden"}.`, review)
  );
});

export const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalHostels,
    pendingHostels,
    approvedHostels,
    rejectedHostels,
    totalOwners,
    totalBookings,
    totalReviews,
  ] = await Promise.all([
    Hostel.countDocuments(),
    Hostel.countDocuments({ status: HOSTEL_STATUS.PENDING }),
    Hostel.countDocuments({ status: HOSTEL_STATUS.APPROVED }),
    Hostel.countDocuments({ status: HOSTEL_STATUS.REJECTED }),
    (await import("../models/User.js")).default.countDocuments(),
    Booking.countDocuments(),
    Review.countDocuments(),
  ]);

  res.status(200).json(
    new ApiResponse(200, "Dashboard stats fetched.", {
      totalHostels,
      pendingHostels,
      approvedHostels,
      rejectedHostels,
      totalOwners,
      totalBookings,
      totalReviews,
    })
  );
});

export const updateHostelDetails = asyncHandler(async (req, res) => {
  const updates = req.body;
  const hostel = await Hostel.findById(req.params.id);

  if (!hostel) {
    throw new ApiError(404, "Hostel not found.");
  }

  // Simple top-level fields
  const directFields = [
    "name", "masked_name", "hostel_type", "description",
    "total_hostel_beds", "notice_period_days", "in_room_amenities",
    "common_amenities", "recreation", "is_open"
  ];

  directFields.forEach(field => {
    if (updates[field] !== undefined) hostel[field] = updates[field];
  });

  // Nested objects - partial updates within them
  const nestedFields = [
    "address", "rent", "laundry", "washroom_details",
    "warden", "security", "rules", "nearby_distances",
    "building_details", "legal_docs"
  ];

  nestedFields.forEach(field => {
    if (updates[field] && typeof updates[field] === "object") {
      // We merge with current values to allow partial updates of nested objects
      const current = hostel[field] ? (hostel[field].toObject ? hostel[field].toObject() : hostel[field]) : {};
      hostel[field] = { ...current, ...updates[field] };
    }
  });

  // Array fields that should be replaced entirely if provided
  if (updates.rooms) hostel.rooms = updates.rooms;
  if (updates.meal_plans) hostel.meal_plans = updates.meal_plans;

  await hostel.save();

  res.status(200).json(
    new ApiResponse(200, "Hostel details updated successfully.", hostel)
  );
});