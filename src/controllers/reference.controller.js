import Reference from "../models/Reference.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

// @desc    Submit a new reference (By Student)
// @route   POST /api/v1/references
// @access  Private (Student)
export const createReference = asyncHandler(async (req, res) => {
  const { name, email, phone, address, lookingFor } = req.body;

  if (!name || !email || !phone || !address || !lookingFor) {
    throw new ApiError(400, "All fields are required");
  }

  const reference = await Reference.create({
    name,
    email,
    phone,
    address,
    lookingFor,
    referredBy: req.student._id,
  });

  res.status(201).json(
    new ApiResponse(201, "Reference submitted successfully", reference)
  );
});

// @desc    Get all references
// @route   GET /api/v1/references/admin/all
// @access  Private (Admin)
export const getAllReferences = asyncHandler(async (req, res) => {
  const references = await Reference.find()
    .populate("referredBy")
    .sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse(200, "References fetched successfully", references)
  );
});

// @desc    Update reference status
// @route   PATCH /api/v1/references/admin/:id/status
// @access  Private (Admin)
export const updateReferenceStatus = asyncHandler(async (req, res) => {
  const { status, adminNote } = req.body;
  const { id } = req.params;

  const reference = await Reference.findById(id);

  if (!reference) {
    throw new ApiError(404, "Reference not found");
  }

  if (status) reference.status = status;
  if (adminNote !== undefined) reference.adminNote = adminNote;

  await reference.save();

  res.status(200).json(
    new ApiResponse(200, "Reference updated successfully", reference)
  );
});
