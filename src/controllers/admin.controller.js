import Admin from "../models/Admin.js";
import { ADMIN_ROLE } from "../constants/enums.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  const existing = await Admin.findOne({ email });
  if (existing) {
    throw new ApiError(409, "Admin with this email already exists.");
  }

  const role = req.body.role ? req.body.role.toLowerCase() : ADMIN_ROLE.ADMIN;

  const admin = await Admin.create({
    name,
    email,
    phone,
    password,
    role,
    createdBy: req.admin._id,
  });

  res.status(201).json(
    new ApiResponse(201, "Admin created.", admin.toJSON())
  );
});

export const getAllAdmins = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = {};

  const [admins, total] = await Promise.all([
    Admin.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Admin.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, "Admins fetched.", {
      admins,
      pagination: {
        current_page: Number(page),
        total_pages: Math.ceil(total / Number(limit)),
        total_results: total,
        per_page: Number(limit),
      },
    })
  );
});

export const getAdminById = asyncHandler(async (req, res) => {
  const admin = await Admin.findOne({
    _id: req.params.id,
  });

  if (!admin) {
    throw new ApiError(404, "Admin not found.");
  }

  res.status(200).json(
    new ApiResponse(200, "Admin fetched.", admin)
  );
});

export const updateAdmin = asyncHandler(async (req, res) => {
  const admin = await Admin.findOne({
    _id: req.params.id,
  });

  if (!admin) {
    throw new ApiError(404, "Admin not found.");
  }

  const allowedFields = ["name", "phone", "isActive"];
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      admin[field] = req.body[field];
    }
  }

  if (req.body.password) {
    admin.password = req.body.password;
  }

  await admin.save();

  res.status(200).json(
    new ApiResponse(200, "Admin updated.", admin.toJSON())
  );
});

export const deleteAdmin = asyncHandler(async (req, res) => {
  const admin = await Admin.findOne({
    _id: req.params.id,
  });

  if (!admin) {
    throw new ApiError(404, "Admin not found.");
  }

  await Admin.findByIdAndDelete(admin._id);

  res.status(200).json(
    new ApiResponse(200, "Admin deleted.")
  );
});