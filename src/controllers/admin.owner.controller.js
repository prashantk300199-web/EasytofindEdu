import User from "../models/User.js";
import Hostel from "../models/Hostel.js";
import { deleteImage } from "../services/cloudinary.service.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getAllOwners = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { name: new RegExp(search, "i") },
      { email: new RegExp(search, "i") },
      { phone: new RegExp(search, "i") },
    ];
  }

  const pipeline = [
    { $match: filter },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: Number(limit) },
    {
      $lookup: {
        from: "hostels",
        localField: "_id",
        foreignField: "owner",
        as: "hostels",
        pipeline: [
          {
            $project: {
              name: 1,
              photos: { $slice: ["$photos", 1] }, // Only need first photo for preview
              status: 1,
              "address.city": 1,
              hostel_type: 1,
            },
          },
        ],
      },
    },
  ];

  const [owners, total] = await Promise.all([
    User.aggregate(pipeline),
    User.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, "Owners fetched.", {
      owners,
      pagination: {
        current_page: Number(page),
        total_pages: Math.ceil(total / Number(limit)),
        total_results: total,
        per_page: Number(limit),
      },
    })
  );
});

export const getOwnerById = asyncHandler(async (req, res) => {
  const owner = await User.findById(req.params.id);

  if (!owner) {
    throw new ApiError(404, "Owner not found.");
  }

  const hostels = await Hostel.find({ owner: owner._id })
    .select("name slug status hostel_type address.city rent.monthly is_open")
    .lean();

  res.status(200).json(
    new ApiResponse(200, "Owner fetched.", { owner, hostels })
  );
});

export const updateOwnerStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const owner = await User.findById(req.params.id);
  if (!owner) {
    throw new ApiError(404, "Owner not found.");
  }

  owner.status = status;
  await owner.save();

  res.status(200).json(
    new ApiResponse(200, "Owner status updated.", owner)
  );
});

export const deleteOwner = asyncHandler(async (req, res) => {
  const owner = await User.findById(req.params.id);
  if (!owner) {
    throw new ApiError(404, "Owner not found.");
  }

  if (owner.profilePhoto?.publicId) {
    await deleteImage(owner.profilePhoto.publicId);
  }

  const hostels = await Hostel.find({ owner: owner._id });
  for (const hostel of hostels) {
    const publicIds = hostel.photos.map((p) => p.publicId).filter(Boolean);
    if (publicIds.length > 0) {
      const { deleteMultipleImages } = await import("../services/cloudinary.service.js");
      await deleteMultipleImages(publicIds);
    }
  }

  await Hostel.deleteMany({ owner: owner._id });
  await User.findByIdAndDelete(owner._id);

  res.status(200).json(
    new ApiResponse(200, "Owner and all associated hostels deleted.")
  );
});

export const updateOwnerDetails = asyncHandler(async (req, res) => {
  const { name, email, phone, businessName, aadhaarNumber, panNumber, address, bio } = req.body;

  const owner = await User.findById(req.params.id);
  if (!owner) {
    throw new ApiError(404, "Owner not found.");
  }

  if (name !== undefined) owner.name = name;
  if (email !== undefined) owner.email = email;
  if (phone !== undefined) owner.phone = phone;
  if (businessName !== undefined) owner.businessName = businessName;
  if (aadhaarNumber !== undefined) owner.aadhaarNumber = aadhaarNumber;
  if (panNumber !== undefined) owner.panNumber = panNumber;
  if (bio !== undefined) owner.bio = bio;

  if (address) {
    owner.address = {
      ...owner.address,
      ...address,
    };
  }

  await owner.save();

  res.status(200).json(
    new ApiResponse(200, "Owner details updated successfully.", owner)
  );
});