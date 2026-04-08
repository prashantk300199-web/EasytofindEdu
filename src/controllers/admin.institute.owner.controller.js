import InstituteOwner from "../models/InstituteOwner.js";
import Institute from "../models/Institute.js";
import { deleteImage } from "../services/cloudinary.service.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getAllInstituteOwners = asyncHandler(async (req, res) => {
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
        from: "institutes",
        localField: "_id",
        foreignField: "createdBy",
        as: "institutes",
        pipeline: [
          {
            $project: {
              name: 1,
              logo: 1,
              isApproved: 1,
              "location.city": 1,
            },
          },
        ],
      },
    },
  ];

  const [owners, total] = await Promise.all([
    InstituteOwner.aggregate(pipeline),
    InstituteOwner.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, "Institute owners fetched.", {
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

export const getInstituteOwnerById = asyncHandler(async (req, res) => {
  const owner = await InstituteOwner.findById(req.params.id);

  if (!owner) {
    throw new ApiError(404, "Owner not found.");
  }

  const institutes = await Institute.find({ createdBy: owner._id })
    .select("name logo isApproved location.city")
    .lean();

  res.status(200).json(
    new ApiResponse(200, "Owner fetched.", { owner, institutes })
  );
});

export const updateInstituteOwnerStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const owner = await InstituteOwner.findById(req.params.id);
  if (!owner) {
    throw new ApiError(404, "Owner not found.");
  }

  owner.status = status;
  await owner.save();

  res.status(200).json(
    new ApiResponse(200, "Owner status updated.", owner)
  );
});

export const deleteInstituteOwner = asyncHandler(async (req, res) => {
  const owner = await InstituteOwner.findById(req.params.id);
  if (!owner) {
    throw new ApiError(404, "Owner not found.");
  }

  if (owner.profilePhoto?.publicId) {
    await deleteImage(owner.profilePhoto.publicId);
  }

  const institutes = await Institute.find({ createdBy: owner._id });
  for (const inst of institutes) {
    if (inst.logo?.publicId) await deleteImage(inst.logo.publicId);
    if (inst.coverImage?.publicId) await deleteImage(inst.coverImage.publicId);
  }

  await Institute.deleteMany({ createdBy: owner._id });
  await InstituteOwner.findByIdAndDelete(owner._id);

  res.status(200).json(
    new ApiResponse(200, "Institute owner and all associated institutes deleted.")
  );
});
