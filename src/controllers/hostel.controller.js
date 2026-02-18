import Hostel from "../models/Hostel.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import generateSlug from "../utils/slugify.js";
import maskName from "../utils/maskName.js";
import generateSearchTags from "../utils/generateSearchTags.js";
import { createHostelSchema, updateHostelSchema } from "../validators/hostel.validator.js";
import { deleteMultipleImages } from "../services/cloudinary.service.js";
import { uploadMultipleFiles, cleanupUploadedFiles } from "../services/upload.service.js";

// Logger utility
const logger = {
  info: (msg, data = {}) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, data),
  error: (msg, error = {}) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, error),
  warn: (msg, data = {}) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, data),
  debug: (msg, data = {}) => process.env.NODE_ENV === 'development' && console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`, data),
};

/**
 * Parse hostel body from request
 * Handles both string and object data formats
 * @param {Object} req - Express request object
 * @returns {Object} Parsed hostel data
 * @throws {ApiError} If JSON parsing fails
 */
const parseHostelBody = (req) => {
  if (req.body.data) {
    try {
      const parsed = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
      logger.debug("Parsed hostel body successfully");
      return parsed;
    } catch (e) {
      logger.error("Failed to parse hostel body", { error: e.message });
      throw new ApiError(400, "Invalid JSON in data field. Please ensure the data is valid JSON format.");
    }
  }
  return req.body;
};

/**
 * Validate request body against Joi schema
 * Provides detailed validation error messages
 * @param {Object} schema - Joi validation schema
 * @param {Object} data - Data to validate
 * @returns {Object} Validated data
 * @throws {ApiError} If validation fails
 */
const validateBody = (schema, data) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
      type: detail.type,
    }));
    
    logger.warn("Validation failed", { errors, timestamp: new Date().toISOString() });
    throw new ApiError(400, "Validation failed. Please check all required fields.", errors);
  }
  
  logger.debug("Validation passed", { fields: Object.keys(value) });
  return value;
};

/**
 * Create a new hostel listing
 * @route POST /api/v1/hostels
 * @access Private - Owner only
 * @param {Object} req - Express request with hostel data and photos
 * @param {Object} res - Express response
 * @returns {Object} Created hostel object with metadata
 * @throws {ApiError} 400 - Validation failed
 * @throws {ApiError} 401 - User not authenticated/authorized
 * @throws {ApiError} 500 - Server error
 * @example
 * POST /api/v1/hostels
 * {
 *   "data": "{ name: 'Hostel XYZ', ... }"
 *   "photos": [file1, file2, ...]
 * }
 */
export const createHostel = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const userId = req.user._id;
  const uploadedPublicIds = []; // Track uploaded files for cleanup on failure
  
  try {
    logger.info("Creating new hostel", { userId, timestamp: new Date().toISOString() });

    // Validate user exists and is active
    const user = await User.findById(userId);
    if (!user) {
      logger.warn("User not found during hostel creation", { userId });
      throw new ApiError(401, "User not found. Please login again.");
    }

    if (user.status === "blocked") {
      logger.warn("Blocked user attempted to create hostel", { userId });
      throw new ApiError(403, "Your account has been blocked. Please contact support.");
    }

    // Parse request body
    const parsed = parseHostelBody(req);
    
    // Validate against schema
    const hostelData = validateBody(createHostelSchema, parsed);

    // Validate and upload photos in parallel
    let photos = [];
    if (req.files && req.files.length > 0) {
      logger.info("Starting parallel upload for hostel photos", { userId, fileCount: req.files.length });

      // Upload all files in parallel with error handling
      const uploadResult = await uploadMultipleFiles(req.files, {
        folder: "vidyamarg/hostels",
        allowedFormats: ["jpg", "jpeg", "png", "webp"],
        concurrency: 3, // 3 concurrent uploads
        maxRetries: 3,
      });

      // Track successful uploads for cleanup on failure
      uploadedPublicIds.push(...uploadResult.successful.map(u => u.publicId));

      // If some uploads failed, provide feedback
      if (uploadResult.failed.length > 0) {
        const failureMessage = uploadResult.failed
          .map(f => `"${f.filename}": ${f.error}`)
          .join("; ");
        
        logger.warn("Some files failed to upload", { 
          userId, 
          failedCount: uploadResult.failed.length,
          successCount: uploadResult.successful.length 
        });

        // Cleanup uploaded files if partial upload failed
        if (uploadResult.successful.length > 0) {
          await cleanupUploadedFiles(uploadedPublicIds);
          uploadedPublicIds.length = 0; // Clear the tracking array
        }

        throw new ApiError(
          400, 
          `Failed to upload ${uploadResult.failed.length}/${req.files.length} files. ${failureMessage}`
        );
      }

      // Map successful uploads to photo objects
      photos = uploadResult.successful.map(upload => ({
        url: upload.url,
        publicId: upload.publicId,
      }));

      logger.info("All hostel photos uploaded successfully", { 
        userId, 
        photoCount: photos.length 
      });
    }

    if (photos.length === 0) {
      logger.warn("No photos provided for hostel creation", { userId });
      throw new ApiError(400, "At least one photo is required. Please upload a photo.");
    }

    if (photos.length > 20) {
      logger.warn("Too many photos provided", { userId, count: photos.length });
      // Cleanup uploaded files
      await cleanupUploadedFiles(uploadedPublicIds);
      uploadedPublicIds.length = 0;
      throw new ApiError(400, "Maximum 20 photos allowed.");
    }

    // Generate unique slug
    const baseSlug = generateSlug(`${hostelData.name} ${hostelData.address.city}`);
    let slug = baseSlug;
    let counter = 1;
    
    while (counter < 100) {
      const existingSlug = await Hostel.findOne({ slug });
      if (!existingSlug) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    if (counter >= 100) {
      logger.error("Failed to generate unique slug after 100 attempts", { baseSlug, userId });
      // Cleanup uploaded files
      await cleanupUploadedFiles(uploadedPublicIds);
      uploadedPublicIds.length = 0;
      throw new ApiError(500, "Failed to generate unique hostel identifier. Please try again.");
    }

    // Create hostel document
    const hostel = await Hostel.create({
      ...hostelData,
      owner: userId,
      photos,
      slug,
      masked_name: maskName(hostelData.name),
      search_tags: generateSearchTags(hostelData),
      status: "pending",
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Update user statistics
    await User.findByIdAndUpdate(
      userId,
      { 
        $inc: { totalHostels: 1 },
        $set: { lastHostelCreatedAt: new Date() }
      },
      { new: true }
    );

    const duration = Date.now() - startTime;
    logger.info("Hostel created successfully", { 
      hostelId: hostel._id, 
      userId, 
      duration: `${duration}ms`,
      photoCount: photos.length 
    });

    res.status(201).json(
      new ApiResponse(201, "Hostel created successfully. Awaiting admin approval.", {
        hostel: {
          _id: hostel._id,
          name: hostel.name,
          slug: hostel.slug,
          status: hostel.status,
          created_at: hostel.created_at,
        },
        message: "Your hostel listing has been submitted for review. You'll receive an email once it's approved.",
      })
    );
  } catch (error) {
    // Cleanup uploaded files on error
    if (uploadedPublicIds.length > 0) {
      logger.warn("Cleaning up uploaded files due to error", { userId, count: uploadedPublicIds.length });
      await cleanupUploadedFiles(uploadedPublicIds);
    }

    if (!(error instanceof ApiError)) {
      logger.error("Unexpected error in createHostel", { userId, error: error.message, stack: error.stack });
      throw new ApiError(500, "An unexpected error occurred while creating the hostel. Please try again.");
    }
    throw error;
  }
});

/**
 * Get all hostels owned by the authenticated user
 * @route GET /api/v1/hostels?page=1&limit=10&status=approved&sort=-createdAt
 * @access Private - Owner only
 * @param {Object} req - Express request with query params
 * @param {Number} req.query.page - Page number (default: 1)
 * @param {Number} req.query.limit - Results per page (default: 10, max: 100)
 * @param {String} req.query.status - Filter by status (pending/approved/rejected)
 * @param {String} req.query.sort - Sort field (e.g., -createdAt for descending)
 * @returns {Object} Paginated hostel list with metadata
 */
export const getMyHostels = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const userId = req.user._id;

  try {
    // Parse and validate pagination params
    const pageNum = Math.max(1, Math.floor(Number(req.query.page)) || 1);
    const limitNum = Math.max(1, Math.min(100, Math.floor(Number(req.query.limit)) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter = { owner: userId };
    
    // Validate and apply status filter
    if (req.query.status) {
      const validStatuses = ["pending", "approved", "rejected", "deleted"];
      if (!validStatuses.includes(req.query.status)) {
        throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(", ")}`);
      }
      filter.status = req.query.status;
    }

    // Parse sort parameter
    const sortObj = {};
    if (req.query.sort) {
      const sortField = req.query.sort.replace(/^-/, "");
      const sortOrder = req.query.sort.startsWith("-") ? -1 : 1;
      sortObj[sortField] = sortOrder;
    } else {
      sortObj.createdAt = -1; // Default sort
    }

    logger.debug("Fetching hostels", { userId, page: pageNum, limit: limitNum, filter });

    // Execute queries in parallel
    const [hostels, total] = await Promise.all([
      Hostel.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .select("-__v")
        .lean(),
      Hostel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);
    const duration = Date.now() - startTime;

    logger.info("Hostels fetched successfully", { 
      userId, 
      count: hostels.length, 
      total, 
      duration: `${duration}ms` 
    });

    res.status(200).json(
      new ApiResponse(200, "Hostels fetched successfully.", {
        hostels,
        pagination: {
          current_page: pageNum,
          total_pages: totalPages,
          total_results: total,
          per_page: limitNum,
          has_next: pageNum < totalPages,
          has_prev: pageNum > 1,
        },
        meta: {
          fetched_at: new Date().toISOString(),
          response_time: `${duration}ms`,
        }
      })
    );
  } catch (error) {
    if (!(error instanceof ApiError)) {
      logger.error("Unexpected error in getMyHostels", { userId, error: error.message });
      throw new ApiError(500, "Failed to fetch hostels. Please try again.");
    }
    throw error;
  }
});

/**
 * Get a specific hostel by ID
 * @route GET /api/v1/hostels/:id
 * @access Private - Owner only (can view own hostel)
 * @param {String} req.params.id - Hostel MongoDB ID
 * @returns {Object} Hostel details
 * @throws {ApiError} 400 - Invalid ID format
 * @throws {ApiError} 404 - Hostel not found
 */
export const getHostelById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      logger.warn("Invalid hostel ID format", { id, userId });
      throw new ApiError(400, "Invalid hostel ID format. Please provide a valid MongoDB ID.");
    }

    logger.debug("Fetching hostel by ID", { id, userId });

    const hostel = await Hostel.findOne({
      _id: id,
      owner: userId,
    }).select("-__v");

    if (!hostel) {
      logger.warn("Hostel not found or access denied", { id, userId });
      throw new ApiError(404, "Hostel not found or you don't have access to it.");
    }

    logger.info("Hostel retrieved successfully", { id, userId });

    res.status(200).json(
      new ApiResponse(200, "Hostel fetched successfully.", hostel)
    );
  } catch (error) {
    if (!(error instanceof ApiError)) {
      logger.error("Unexpected error in getHostelById", { id, userId, error: error.message });
      throw new ApiError(500, "Failed to fetch hostel. Please try again.");
    }
    throw error;
  }
});

/**
 * Update hostel details
 * @route PUT /api/v1/hostels/:id
 * @access Private - Owner only
 * @param {String} req.params.id - Hostel MongoDB ID
 * @param {Object} req.body - Partial hostel data to update
 * @returns {Object} Updated hostel details
 * @throws {ApiError} 400 - Validation failed or photo limit exceeded
 * @throws {ApiError} 404 - Hostel not found
 */
/**
 * Update hostel details
 * @route PUT /api/v1/hostels/:id
 * @access Private - Owner only
 */
export const updateHostel = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;
  const userId = req.user._id;
  const uploadedPublicIds = []; 

  try {
    // 1. Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      logger.warn("Invalid hostel ID format for update", { id, userId });
      throw new ApiError(400, "Invalid hostel ID format.");
    }

    logger.debug("Updating hostel", { id, userId });

    // 2. Find hostel and verify ownership
    const hostel = await Hostel.findOne({
      _id: id,
      owner: userId,
    });

    if (!hostel) {
      logger.warn("Hostel not found for update", { id, userId });
      throw new ApiError(404, "Hostel not found or you don't have access to it.");
    }

    // 3. Parse and validate update data
    const parsed = parseHostelBody(req);
    const updateData = validateBody(updateHostelSchema, parsed);
    const { coordinates, ...fields } = updateData;

    const updateLog = {
      fieldsUpdated: Object.keys(fields),
      photosAdded: req.files?.length || 0,
    };

    // 4. Handle additional photo uploads (Cloudinary)
    if (req.files && req.files.length > 0) {
      const existingCount = hostel.photos.length;
      const newCount = req.files.length;
      
      if (existingCount + newCount > 20) {
        throw new ApiError(400, `Cannot add ${newCount} photos. Current: ${existingCount}, max allowed: 20`);
      }

      const uploadResult = await uploadMultipleFiles(req.files, {
        folder: "vidyamarg/hostels",
        allowedFormats: ["jpg", "jpeg", "png", "webp"],
      });

      uploadedPublicIds.push(...uploadResult.successful.map(u => u.publicId));

      if (uploadResult.failed.length > 0) {
        if (uploadResult.successful.length > 0) {
          await cleanupUploadedFiles(uploadedPublicIds);
        }
        throw new ApiError(400, `Failed to upload ${uploadResult.failed.length} files.`);
      }

      uploadResult.successful.forEach(upload => {
        hostel.photos.push({
          url: upload.url,
          publicId: upload.publicId,
        });
      });
    }

    // 5. Update GPS location if coordinates provided
    if (coordinates && coordinates.lng !== undefined && coordinates.lat !== undefined) {
      hostel.location = {
        type: "Point",
        coordinates: [Number(coordinates.lng), Number(coordinates.lat)],
      };
      updateLog.locationUpdated = true;
    }

    // 6. UPDATE NESTED OBJECTS (Comprehensive List)
    const nestedObjects = [
      "address", 
      "rent", 
      "meal_plans", 
      "laundry", 
      "washroom_details", // Includes total_washrooms & ratio
      "security", 
      "rules", 
      "nearby_distances", 
      "building_details", // Includes age, flooring, floors
      "legal_docs",
      "warden" // New Warden object (name, age, gender, contact)
    ];

    nestedObjects.forEach((obj) => {
      if (fields[obj] !== undefined) {
        // Spread to maintain existing fields while updating new ones
        hostel[obj] = { ...hostel[obj].toObject(), ...fields[obj] };
      }
    });

    // 7. UPDATE BASIC FIELDS & ARRAYS
    const otherFields = [
      "name", 
      "hostel_type", 
      "description", 
      "is_open", 
      "in_room_amenities", 
      "common_amenities", 
      "recreation", 
      "total_hostel_beds", // Total bed inventory
      "notice_period_days"
    ];
    
    otherFields.forEach((field) => {
      if (fields[field] !== undefined && fields[field] !== null) {
        hostel[field] = fields[field];
      }
    });

    // 8. Handle Room Array specifically (Inventory Update)
    if (fields.rooms && Array.isArray(fields.rooms)) {
      hostel.rooms = fields.rooms; // Replaces existing room sharing inventory
    }

    // 9. Masked name and Search Tags Update
    if (fields.name) {
      hostel.masked_name = maskName(fields.name);
    }
    hostel.search_tags = generateSearchTags(hostel);
    hostel.updatedAt = new Date();

    // 10. Final Save
    await hostel.save();

    const duration = Date.now() - startTime;
    logger.info("Hostel updated successfully with new fields", { id, duration: `${duration}ms` });

    res.status(200).json(
      new ApiResponse(200, "Hostel details updated successfully.", {
        hostel: {
          _id: hostel._id,
          name: hostel.name,
          updated_at: hostel.updatedAt,
        }
      })
    );
  } catch (error) {
    if (uploadedPublicIds.length > 0) {
      await cleanupUploadedFiles(uploadedPublicIds);
    }
    if (!(error instanceof ApiError)) {
      logger.error("Error in updateHostel", { error: error.message });
      throw new ApiError(500, "An error occurred while updating the hostel.");
    }
    throw error;
  }
});

/**
 * Delete a specific photo from hostel
 * @route DELETE /api/v1/hostels/:id/photos/:photoId
 * @access Private - Owner only
 * @param {String} req.params.id - Hostel MongoDB ID
 * @param {String} req.params.photoId - Photo MongoDB ID
 * @returns {Object} Updated hostel with remaining photos
 * @throws {ApiError} 400 - Cannot delete last photo
 * @throws {ApiError} 404 - Hostel or photo not found
 */
export const deleteHostelPhoto = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { id, photoId } = req.params;
  const userId = req.user._id;

  try {
    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/) || !photoId.match(/^[0-9a-fA-F]{24}$/)) {
      logger.warn("Invalid ID format for photo deletion", { hostelId: id, photoId, userId });
      throw new ApiError(400, "Invalid hostel ID or photo ID format.");
    }

    logger.debug("Deleting hostel photo", { hostelId: id, photoId, userId });

    const hostel = await Hostel.findOne({
      _id: id,
      owner: userId,
    });

    if (!hostel) {
      logger.warn("Hostel not found for photo deletion", { id, userId });
      throw new ApiError(404, "Hostel not found or you don't have access to it.");
    }

    if (hostel.photos.length <= 1) {
      logger.warn("Attempted to delete last photo", { id, userId });
      throw new ApiError(400, "Cannot delete the last photo. Hostel must have at least one photo.");
    }

    const photoIndex = hostel.photos.findIndex((p) => p._id.toString() === photoId);

    if (photoIndex === -1) {
      logger.warn("Photo not found", { hostelId: id, photoId, userId });
      throw new ApiError(404, "Photo not found in this hostel.");
    }

    const photo = hostel.photos[photoIndex];
    
    // Delete from cloudinary if publicId exists
    if (photo.publicId) {
      try {
        await deleteMultipleImages([photo.publicId]);
        logger.debug("Photo deleted from Cloudinary", { publicId: photo.publicId });
      } catch (error) {
        logger.error("Error deleting photo from Cloudinary", { publicId: photo.publicId, error: error.message });
        // Continue anyway, photo will be removed from DB
      }
    }

    hostel.photos.splice(photoIndex, 1);
    await hostel.save();

    const duration = Date.now() - startTime;
    logger.info("Photo deleted successfully", { 
      hostelId: id, 
      photoId, 
      userId, 
      remainingPhotos: hostel.photos.length,
      duration: `${duration}ms`
    });

    res.status(200).json(
      new ApiResponse(200, "Photo deleted successfully.", {
        message: "Photo removed from hostel",
        remaining_photos: hostel.photos.length,
      })
    );
  } catch (error) {
    if (!(error instanceof ApiError)) {
      logger.error("Unexpected error in deleteHostelPhoto", { id, photoId, userId, error: error.message });
      throw new ApiError(500, "Failed to delete photo. Please try again.");
    }
    throw error;
  }
});

/**
 * Delete entire hostel and its photos
 * @route DELETE /api/v1/hostels/:id
 * @access Private - Owner only
 * @param {String} req.params.id - Hostel MongoDB ID
 * @returns {Object} Success message with deletion metadata
 * @throws {ApiError} 400 - Invalid ID format
 * @throws {ApiError} 404 - Hostel not found
 */
export const deleteHostel = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;
  const userId = req.user._id;

  try {
    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      logger.warn("Invalid hostel ID format for deletion", { id, userId });
      throw new ApiError(400, "Invalid hostel ID format.");
    }

    logger.debug("Deleting hostel", { id, userId });

    const hostel = await Hostel.findOne({
      _id: id,
      owner: userId,
    });

    if (!hostel) {
      logger.warn("Hostel not found for deletion", { id, userId });
      throw new ApiError(404, "Hostel not found or you don't have access to it.");
    }

    // Collect all public IDs for deletion
    const publicIds = hostel.photos
      .map((p) => p.publicId)
      .filter(Boolean);

    // Delete photos from Cloudinary
    if (publicIds.length > 0) {
      try {
        await deleteMultipleImages(publicIds);
        logger.debug("Photos deleted from Cloudinary", { count: publicIds.length });
      } catch (error) {
        logger.error("Error deleting photos from Cloudinary", { count: publicIds.length, error: error.message });
        // Continue anyway, hostel still needs to be deleted from DB
      }
    }

    // Delete hostel from database
    await Hostel.findByIdAndDelete(id);

    // Update user statistics
    await User.findByIdAndUpdate(
      userId,
      { $inc: { totalHostels: -1 } },
      { new: true }
    );

    const duration = Date.now() - startTime;
    logger.info("Hostel deleted successfully", { 
      id, 
      userId, 
      photosDeleted: publicIds.length,
      duration: `${duration}ms`
    });

    res.status(200).json(
      new ApiResponse(200, "Hostel deleted successfully.", {
        message: "Your hostel listing and all associated data have been removed",
        deleted_hostel_id: id,
        photos_deleted: publicIds.length,
        deleted_at: new Date().toISOString(),
      })
    );
  } catch (error) {
    if (!(error instanceof ApiError)) {
      logger.error("Unexpected error in deleteHostel", { id, userId, error: error.message, stack: error.stack });
      throw new ApiError(500, "Failed to delete hostel. Please try again.");
    }
    throw error;
  }
});

/**
 * Toggle hostel availability status
 * @route PATCH /api/v1/hostels/:id/toggle
 * @access Private - Owner only
 * @param {String} req.params.id - Hostel MongoDB ID
 * @returns {Object} Updated availability status
 * @throws {ApiError} 400 - Invalid ID format
 * @throws {ApiError} 404 - Hostel not found
 */
export const toggleHostelAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      logger.warn("Invalid hostel ID format for toggle", { id, userId });
      throw new ApiError(400, "Invalid hostel ID format.");
    }

    logger.debug("Toggling hostel availability", { id, userId });

    const hostel = await Hostel.findOne({
      _id: id,
      owner: userId,
    });

    if (!hostel) {
      logger.warn("Hostel not found for toggle", { id, userId });
      throw new ApiError(404, "Hostel not found or you don't have access to it.");
    }

    const previousStatus = hostel.is_open;
    hostel.is_open = !hostel.is_open;
    await hostel.save();

    const statusText = hostel.is_open ? "open for bookings" : "closed for bookings";

    logger.info("Hostel availability toggled", { 
      id, 
      userId, 
      previousStatus, 
      newStatus: hostel.is_open,
      timestamp: new Date().toISOString()
    });

    res.status(200).json(
      new ApiResponse(200, `Hostel is now ${statusText}.`, { 
        is_open: hostel.is_open,
        message: `Your hostel is ${statusText}. Bookings are ${hostel.is_open ? 'enabled' : 'disabled'}.`,
        toggled_at: new Date().toISOString(),
      })
    );
  } catch (error) {
    if (!(error instanceof ApiError)) {
      logger.error("Unexpected error in toggleHostelAvailability", { id, userId, error: error.message });
      throw new ApiError(500, "Failed to update hostel status. Please try again.");
    }
    throw error;
  }
});

/**
 * Get hostel analytics and performance metrics
 * @route GET /api/v1/hostels/:id/analytics
 * @access Private - Owner only
 * @param {String} req.params.id - Hostel MongoDB ID
 * @returns {Object} Analytics data including views, leads, ratings
 * @throws {ApiError} 400 - Invalid ID format
 * @throws {ApiError} 404 - Hostel not found
 */
export const getHostelAnalytics = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;
  const userId = req.user._id;

  try {
    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      logger.warn("Invalid hostel ID format for analytics", { id, userId });
      throw new ApiError(400, "Invalid hostel ID format.");
    }

    logger.debug("Fetching hostel analytics", { id, userId });

    const hostel = await Hostel.findOne({
      _id: id,
      owner: userId,
    }).select("_id name views_count leads_count last_viewed_at rating_summary status is_open createdAt");

    if (!hostel) {
      logger.warn("Hostel not found for analytics", { id, userId });
      throw new ApiError(404, "Hostel not found or you don't have access to it.");
    }

    // Format analytics response with comprehensive data
    const analytics = {
      hostel: {
        id: hostel._id,
        name: hostel.name,
        status: hostel.status,
        is_open: hostel.is_open,
      },
      performance: {
        views: hostel.views_count || 0,
        leads: hostel.leads_count || 0,
        conversion_rate: hostel.leads_count && hostel.views_count 
          ? ((hostel.leads_count / hostel.views_count) * 100).toFixed(2) 
          : 0,
        last_viewed: hostel.last_viewed_at || null,
      },
      rating: {
        average: hostel.rating_summary?.average || 0,
        total_reviews: hostel.rating_summary?.total_reviews || 0,
        distribution: hostel.rating_summary?.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      },
      timeline: {
        created_at: hostel.createdAt,
        last_viewed_at: hostel.last_viewed_at,
        days_active: Math.floor((new Date() - new Date(hostel.createdAt)) / (1000 * 60 * 60 * 24)),
      },
    };

    const duration = Date.now() - startTime;
    logger.info("Analytics fetched successfully", { 
      id, 
      userId, 
      views: analytics.performance.views,
      leads: analytics.performance.leads,
      duration: `${duration}ms`
    });

    res.status(200).json(
      new ApiResponse(200, "Analytics fetched successfully.", {
        analytics,
        meta: {
          generated_at: new Date().toISOString(),
          response_time: `${duration}ms`,
        }
      })
    );
  } catch (error) {
    if (!(error instanceof ApiError)) {
      logger.error("Unexpected error in getHostelAnalytics", { id, userId, error: error.message });
      throw new ApiError(500, "Failed to fetch analytics. Please try again.");
    }
    throw error;
  }
});