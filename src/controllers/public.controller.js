import Hostel from "../models/Hostel.js";
import HostelInquiry from "../models/HostelInquiry.js";
import { HOSTEL_STATUS } from "../constants/enums.js";
import { searchHostels } from "../services/search.service.js";
import { trackView } from "../services/analytics.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import maskName from "../utils/maskName.js";
import AMENITIES from "../constants/amenities.js";
import RULES from "../constants/rules.js";

export const getPublicHostels = asyncHandler(async (req, res) => {
  const result = await searchHostels(req.query);

  const hostels = result.hostels.map((hostel) => ({
    ...hostel,
    name: hostel.masked_name || maskName(hostel.name),
    original_name: undefined,
  }));

  res.status(200).json(
    new ApiResponse(200, "Hostels fetched.", {
      hostels,
      pagination: result.pagination,
    })
  );
});

export const getPublicHostelBySlug = asyncHandler(async (req, res) => {
  const hostel = await Hostel.findOne({
    slug: req.params.slug,
    status: HOSTEL_STATUS.APPROVED,
  })
    .populate("owner", "name phone profilePhoto businessName")
    .lean();

  if (!hostel) {
    throw new ApiError(404, "Hostel not found.");
  }

  await trackView(hostel._id);

  const publicHostel = {
    ...hostel,
    name: hostel.masked_name || maskName(hostel.name),
  };
  delete publicHostel.original_name;

  res.status(200).json(
    new ApiResponse(200, "Hostel fetched.", publicHostel)
  );
});

export const getNearbyHostels = asyncHandler(async (req, res) => {
  const { lat, lng, radius_km = 5, limit = 20 } = req.query;

  if (!lat || !lng) {
    throw new ApiError(400, "Latitude and longitude are required.");
  }

  const hostels = await Hostel.find({
    status: HOSTEL_STATUS.APPROVED,
    is_open: true,
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [Number(lng), Number(lat)],
        },
        $maxDistance: Number(radius_km) * 1000,
      },
    },
  })
    .limit(Number(limit))
    .select("masked_name slug hostel_type address rent.monthly rating_summary photos location")
    .lean();

  res.status(200).json(
    new ApiResponse(200, "Nearby hostels fetched.", hostels)
  );
});

export const getHostelCities = asyncHandler(async (req, res) => {
  const cities = await Hostel.distinct("address.city", {
    status: HOSTEL_STATUS.APPROVED,
  });

  res.status(200).json(
    new ApiResponse(200, "Cities fetched.", cities.sort())
  );
});

export const getAmenitiesList = asyncHandler(async (req, res) => {
  res.status(200).json(
    new ApiResponse(200, "Amenities fetched.", AMENITIES)
  );
});

export const getRulesList = asyncHandler(async (req, res) => {
  res.status(200).json(
    new ApiResponse(200, "Rules fetched.", RULES)
  );
});

export const createHostelInquiry = asyncHandler(async (req, res) => {
  const { name, email, phone, address, profession, hostelId } = req.body;

  if (!name || !email || !phone || !address || !profession || !hostelId) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if hostel exists
  const hostel = await Hostel.findById(hostelId).populate("owner", "phone");
  if (!hostel) {
    throw new ApiError(404, "Hostel not found");
  }

  const inquiry = await HostelInquiry.create({
    name,
    email,
    phone,
    address,
    profession,
    hostel: hostelId,
  });

  res.status(201).json(
    new ApiResponse(201, "Inquiry submitted successfully", {
      inquiry,
      contactDetails: {
        name: hostel.name,
        phone: hostel.owner?.phone || hostel.warden?.contact_number || "Contact via warden",
        warden_phone: hostel.warden?.contact_number,
      }
    })
  );
});