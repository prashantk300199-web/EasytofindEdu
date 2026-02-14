import Hostel from "../models/Hostel.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import generateSlug from "../utils/slugify.js";
import maskName from "../utils/maskName.js";
import generateSearchTags from "../utils/generateSearchTags.js";
import { createHostelSchema } from "../validators/hostel.validator.js";

// Helper for Parsing
const parseHostelBody = (req) => {
  if (req.body.data) {
    try {
      return typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
    } catch (e) {
      throw new ApiError(400, "Invalid JSON in data field.");
    }
  }
  return req.body;
};

// Helper for Detailed Validation Logs
const validateBody = (schema, data) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    // Terminal mein error details check karne ke liye:
    console.log("❌ JOI VALIDATION FAILED:", JSON.stringify(error.details, null, 2));
    
    const errors = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));
    throw new ApiError(400, "Validation failed", errors);
  }
  return value;
};

export const createHostel = asyncHandler(async (req, res) => {
  const parsed = parseHostelBody(req);
  
  // Naya Fixed Schema use kar raha hai jo 'location' handle karega
  const hostelData = validateBody(createHostelSchema, parsed);

  const photos = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      photos.push({ url: file.path, publicId: file.filename });
    }
  }

  if (photos.length === 0) {
    throw new ApiError(400, "At least one photo is required.");
  }

  // Slug Generation
  const baseSlug = generateSlug(`${hostelData.name} ${hostelData.address.city}`);
  let slug = baseSlug;
  let counter = 1;
  while (await Hostel.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  // Final Database Creation
  const hostel = await Hostel.create({
    ...hostelData,
    owner: req.user._id,
    photos,
    slug,
    masked_name: maskName(hostelData.name),
    search_tags: generateSearchTags(hostelData),
  });

  await User.findByIdAndUpdate(req.user._id, { $inc: { totalHostels: 1 } });

  res.status(201).json(
    new ApiResponse(201, "Hostel created. Pending admin approval.", hostel)
  );
});

export const getMyHostels = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const filter = { owner: req.user._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [hostels, total] = await Promise.all([
    Hostel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
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
  const hostel = await Hostel.findOne({
    _id: req.params.id,
    owner: req.user._id,
  });

  if (!hostel) {
    throw new ApiError(404, "Hostel not found.");
  }

  res.status(200).json(
    new ApiResponse(200, "Hostel fetched.", hostel)
  );
});

export const updateHostel = asyncHandler(async (req, res) => {
  const hostel = await Hostel.findOne({
    _id: req.params.id,
    owner: req.user._id,
  });

  if (!hostel) {
    throw new ApiError(404, "Hostel not found.");
  }

  const parsed = parseHostelBody(req);
  const updateData = validateBody(updateHostelSchema, parsed);
  const { coordinates, ...fields } = updateData;

  // Photos handle karne ka logic (Same as before)
  if (req.files && req.files.length > 0) {
    const existingCount = hostel.photos.length;
    const newCount = req.files.length;
    if (existingCount + newCount > 5) {
      throw new ApiError(400, `Max 5 photos allowed. Current: ${existingCount}`);
    }
    for (const file of req.files) {
      hostel.photos.push({ url: file.path, publicId: file.filename });
    }
  }

  // Location update
  if (coordinates) {
    hostel.location = {
      type: "Point",
      coordinates: [coordinates.lng, coordinates.lat],
    };
  }

  // --- NAYA NESTED UPDATE LOGIC ---
  // In sabhi objects ko hum direct assign kar sakte hain kyunki Joi ne inhe validate kar diya hai
  const nestedObjects = [
    "address", "rent", "meal_plan", "laundry", "washroom_details", 
    "security", "rules", "nearby_distances", "building_details", "legal_docs"
  ];

  nestedObjects.forEach((obj) => {
    if (fields[obj] !== undefined) {
      // Pura object overwrite karne ki jagah existing fields ko update karega
      hostel[obj] = { ...hostel[obj], ...fields[obj] };
    }
  });

  // Arrays aur basic fields update
  const otherFields = ["name", "hostel_type", "description", "is_open", "in_room_amenities", "common_amenities", "recreation", "search_tags"];
  
  otherFields.forEach((field) => {
    if (fields[field] !== undefined) {
      hostel[field] = fields[field];
    }
  });

  if (fields.name) {
    hostel.masked_name = maskName(fields.name);
  }

  // Search tags generate karna naye data ke hisaab se
  hostel.search_tags = generateSearchTags(hostel);

  await hostel.save();

  res.status(200).json(
    new ApiResponse(200, "Hostel updated successfully.", hostel)
  );
});

export const deleteHostelPhoto = asyncHandler(async (req, res) => {
  const hostel = await Hostel.findOne({
    _id: req.params.id,
    owner: req.user._id,
  });

  if (!hostel) {
    throw new ApiError(404, "Hostel not found.");
  }

  const { photoId } = req.params;
  const photoIndex = hostel.photos.findIndex((p) => p._id.toString() === photoId);

  if (photoIndex === -1) {
    throw new ApiError(404, "Photo not found.");
  }

  if (hostel.photos.length <= 1) {
    throw new ApiError(400, "Hostel must have at least one photo.");
  }

  const photo = hostel.photos[photoIndex];
  await deleteMultipleImages([photo.publicId]);
  hostel.photos.splice(photoIndex, 1);
  await hostel.save();

  res.status(200).json(
    new ApiResponse(200, "Photo deleted.", hostel)
  );
});

export const deleteHostel = asyncHandler(async (req, res) => {
  const hostel = await Hostel.findOne({
    _id: req.params.id,
    owner: req.user._id,
  });

  if (!hostel) {
    throw new ApiError(404, "Hostel not found.");
  }

  const publicIds = hostel.photos.map((p) => p.publicId).filter(Boolean);
  if (publicIds.length > 0) {
    await deleteMultipleImages(publicIds);
  }

  await Hostel.findByIdAndDelete(hostel._id);
  await User.findByIdAndUpdate(req.user._id, { $inc: { totalHostels: -1 } });

  res.status(200).json(
    new ApiResponse(200, "Hostel deleted.")
  );
});

export const toggleHostelAvailability = asyncHandler(async (req, res) => {
  const hostel = await Hostel.findOne({
    _id: req.params.id,
    owner: req.user._id,
  });

  if (!hostel) {
    throw new ApiError(404, "Hostel not found.");
  }

  hostel.is_open = !hostel.is_open;
  await hostel.save();

  const statusText = hostel.is_open ? "open" : "closed";

  res.status(200).json(
    new ApiResponse(200, `Hostel is now ${statusText}.`, hostel)
  );
});

export const getHostelAnalytics = asyncHandler(async (req, res) => {
  const hostel = await Hostel.findOne({
    _id: req.params.id,
    owner: req.user._id,
  }).select("views_count leads_count last_viewed_at rating_summary");

  if (!hostel) {
    throw new ApiError(404, "Hostel not found.");
  }

  res.status(200).json(
    new ApiResponse(200, "Analytics fetched.", hostel)
  );
});