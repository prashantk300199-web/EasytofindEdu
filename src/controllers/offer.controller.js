import Offer from "../models/Offer.js";
import Hostel from "../models/Hostel.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// @desc    Create a new offer
// @route   POST /api/v1/offers
// @access  Private (Owner/Admin)
export const createOffer = asyncHandler(async (req, res) => {
  const {
    hostelId,
    title,
    description,
    discountType,
    discountValue,
    validFrom,
    validTill,
    applicableRoomType,
    isActive,
  } = req.body;

  if (!hostelId || !title || !discountType || !discountValue || !validFrom || !validTill) {
    throw new ApiError(400, "Please provide all required fields");
  }

  // Check if hostel exists and belongs to the user (if owner)
  const hostel = await Hostel.findById(hostelId);
  if (!hostel) {
    throw new ApiError(404, "Hostel not found");
  }

  // If user is owner, check ownership
  if (req.user && hostel.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You do not have permission to add an offer to this hostel");
  }

  const createdBy = req.user ? req.user._id : req.admin._id;

  const offer = await Offer.create({
    hostel: hostelId,
    createdBy,
    title,
    description,
    discountType,
    discountValue,
    validFrom,
    validTill,
    applicableRoomType,
    isActive: isActive !== undefined ? isActive : true,
  });

  res.status(201).json(new ApiResponse(201, "Offer created successfully", offer));
});

// @desc    Get all offers for a specific hostel
// @route   GET /api/v1/offers/hostel/:hostelId
// @access  Public
export const getOffersByHostel = asyncHandler(async (req, res) => {
  const { hostelId } = req.params;
  const { activeOnly } = req.query;

  let query = { hostel: hostelId };

  if (activeOnly === "true") {
    query.isActive = true;
    query.validTill = { $gte: new Date() };
  }

  const offers = await Offer.find(query).sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, "Offers retrieved successfully", offers));
});

// @desc    Update an offer
// @route   PUT /api/v1/offers/:id
// @access  Private (Owner/Admin)
export const updateOffer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const offer = await Offer.findById(id).populate("hostel");
  if (!offer) {
    throw new ApiError(404, "Offer not found");
  }

  // Check permissions
  if (req.user && offer.hostel.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You do not have permission to update this offer");
  }

  const updatedOffer = await Offer.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json(new ApiResponse(200, "Offer updated successfully", updatedOffer));
});

// @desc    Delete an offer
// @route   DELETE /api/v1/offers/:id
// @access  Private (Owner/Admin)
export const deleteOffer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const offer = await Offer.findById(id).populate("hostel");
  if (!offer) {
    throw new ApiError(404, "Offer not found");
  }

  // Check permissions
  if (req.user && offer.hostel.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You do not have permission to delete this offer");
  }

  await offer.deleteOne();

  res.status(200).json(new ApiResponse(200, "Offer deleted successfully"));
});

// @desc    Toggle offer status (active/inactive)
// @route   PATCH /api/v1/offers/:id/toggle
// @access  Private (Owner/Admin)
export const toggleOfferStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const offer = await Offer.findById(id).populate("hostel");
  if (!offer) {
    throw new ApiError(404, "Offer not found");
  }

  // Check permissions
  if (req.user && offer.hostel.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You do not have permission to modify this offer");
  }

  offer.isActive = !offer.isActive;
  await offer.save();

  res.status(200).json(new ApiResponse(200, `Offer status changed to ${offer.isActive ? "Active" : "Inactive"}`, offer));
});

// @desc    Get all offers (Admin only)
// @route   GET /api/v1/offers/admin/all
// @access  Private (Admin)
export const getAllOffers = asyncHandler(async (req, res) => {
  const offers = await Offer.find()
    .populate({
      path: "hostel",
      select: "name address location",
    })
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, "All offers retrieved successfully", offers));
});
