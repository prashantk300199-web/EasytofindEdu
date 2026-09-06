import Review from "../models/Review.js";
import Hostel from "../models/Hostel.js";
import { HOSTEL_STATUS } from "../constants/enums.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const recalculateRatings = async (hostelId) => {
  const result = await Review.aggregate([
    { $match: { hostel: hostelId, is_approved: true } },
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
    await Hostel.findByIdAndUpdate(hostelId, {
      rating_summary: {
        overall: Math.round(r.overall * 10) / 10,
        cleanliness: Math.round(r.cleanliness * 10) / 10,
        food: Math.round(r.food * 10) / 10,
        location: Math.round(r.location * 10) / 10,
        value_for_money: Math.round(r.value_for_money * 10) / 10,
        total_reviews: r.total_reviews,
      },
    });
  } else {
    await Hostel.findByIdAndUpdate(hostelId, {
      rating_summary: {
        overall: 0,
        cleanliness: 0,
        food: 0,
        location: 0,
        value_for_money: 0,
        total_reviews: 0,
      },
    });
  }
};

export const createReview = asyncHandler(async (req, res) => {
  const hostel = await Hostel.findById(req.params.hostelId);

  if (!hostel) {
    throw new ApiError(404, "Hostel not found.");
  }

  if (hostel.status !== HOSTEL_STATUS.APPROVED) {
    throw new ApiError(400, "Cannot review an unapproved hostel.");
  }

  const review = await Review.create({
    hostel: hostel._id,
    reviewer_name: req.body.reviewer_name,
    reviewer_email: req.body.reviewer_email,
    ratings: req.body.ratings,
    comment: req.body.comment,
  });

  await recalculateRatings(hostel._id);

  res.status(201).json(
    new ApiResponse(201, "Review submitted.", review)
  );
});

export const getHostelReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = { hostel: req.params.hostelId, is_approved: true };

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