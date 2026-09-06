import Inquiry from "../models/Inquiry.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * Create a new inquiry from the popup modal
 * @route POST /api/v1/inquiries
 * @access Public
 */
export const createInquiry = asyncHandler(async (req, res) => {
  const { fullName, contactNumber, lookingFor, ...otherFields } = req.body;

  if (!fullName || !contactNumber || !lookingFor) {
    throw new ApiError(400, "Full name, contact number and looking for are required");
  }

  const inquiry = await Inquiry.create({
    fullName,
    contactNumber,
    lookingFor,
    ...otherFields
  });

  res.status(201).json(
    new ApiResponse(201, "Inquiry submitted successfully", inquiry)
  );
});

/**
 * Get all inquiries (for admin)
 * @route GET /api/v1/inquiries
 * @access Private (Admin)
 */
export const getAllInquiries = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, lookingFor } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (lookingFor) filter.lookingFor = lookingFor;

  const inquiries = await Inquiry.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Inquiry.countDocuments(filter);

  res.status(200).json(
    new ApiResponse(200, "Inquiries fetched successfully", {
      inquiries,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    })
  );
});

/**
 * Update inquiry status or note
 * @route PATCH /api/v1/inquiries/:id
 * @access Private (Admin)
 */
export const updateInquiry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, adminNote } = req.body;

  const inquiry = await Inquiry.findByIdAndUpdate(
    id,
    { status, adminNote },
    { new: true, runValidators: true }
  );

  if (!inquiry) {
    throw new ApiError(404, "Inquiry not found");
  }

  res.status(200).json(
    new ApiResponse(200, "Inquiry updated successfully", inquiry)
  );
});

/**
 * Delete an inquiry
 * @route DELETE /api/v1/inquiries/:id
 * @access Private (Admin)
 */
export const deleteInquiry = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const inquiry = await Inquiry.findByIdAndDelete(id);

  if (!inquiry) {
    throw new ApiError(404, "Inquiry not found");
  }

  res.status(200).json(
    new ApiResponse(200, "Inquiry deleted successfully", null)
  );
});
