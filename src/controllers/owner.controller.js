import User from "../models/User.js";
import { deleteImage } from "../services/cloudinary.service.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getProfile = asyncHandler(async (req, res) => {
  res.status(200).json(
    new ApiResponse(200, "Profile fetched.", req.user)
  );
});

export const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    "name", "phone", "bio", "dateOfBirth", "gender",
    "aadhaarNumber", "panNumber", "businessName", "address",
  ];

  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json(
    new ApiResponse(200, "Profile updated.", user)
  );
});

export const uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file uploaded.");
  }

  if (req.user.profilePhoto?.publicId) {
    await deleteImage(req.user.profilePhoto.publicId);
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      profilePhoto: {
        url: req.file.path,
        publicId: req.file.filename,
      },
    },
    { new: true }
  );

  res.status(200).json(
    new ApiResponse(200, "Profile photo uploaded.", user)
  );
});

export const deleteProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.user.profilePhoto?.publicId) {
    throw new ApiError(400, "No profile photo to delete.");
  }

  await deleteImage(req.user.profilePhoto.publicId);

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { profilePhoto: { url: "", publicId: "" } },
    { new: true }
  );

  res.status(200).json(
    new ApiResponse(200, "Profile photo deleted.", user)
  );
});