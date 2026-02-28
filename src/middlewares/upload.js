import multer from "multer";
import ApiError from "../utils/ApiError.js";
import { validateFiles } from "../services/upload.service.js";

// Memory storage for temporary file handling before upload
// This allows better control over streaming to Cloudinary
const memoryStorage = multer.memoryStorage();

// Logger utility
const logger = {
  info: (msg, data = {}) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, data),
  error: (msg, error = {}) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, error),
  warn: (msg, data = {}) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, data),
  debug: (msg, data = {}) => process.env.NODE_ENV === 'development' && console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`, data),
};

const allowedProfileMimes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
];

const allowedHostelMimes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
];

/**
 * Multer error handling wrapper
 * Converts multer errors to proper API responses
 */
const handleMulterError = (err, req, res, next) => {
  if (!err) return next();

  logger.error("Multer error caught", {
    code: err.code,
    message: err.message,
    field: err.field,
    limit: err.limit,
  });

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File size exceeds limit of 10MB per file`,
        error: err.message,
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: `Maximum 5 files allowed per upload`,
        error: err.message,
      });
    }
    if (err.code === 'LIMIT_PART_COUNT') {
      return res.status(400).json({
        success: false,
        message: `Too many form fields`,
        error: err.message,
      });
    }
  }

  // Handle other errors
  return res.status(400).json({
    success: false,
    message: `File upload error`,
    error: err.message || 'Unknown error',
  });
};

/**
 * Profile photo upload middleware
 * Single file upload with validation
 */
const profileUploadMiddleware = multer({
  storage: memoryStorage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB max for profile photos
    files: 1 
  },
  fileFilter: (req, file, cb) => {
    logger.debug("profileUploadMiddleware: Filtering file", {
      originalname: file.originalname,
      mimetype: file.mimetype,
    });

    if (allowedProfileMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      logger.warn("profileUploadMiddleware: File rejected", {
        originalname: file.originalname,
        mimetype: file.mimetype,
      });
      cb(new Error("Only JPEG, PNG, and WebP image files are allowed."));
    }
  },
}).single("profilePhoto");

export const uploadProfilePhoto = (req, res, next) => {
  logger.debug("uploadProfilePhoto: Starting profile photo upload");
  
  profileUploadMiddleware(req, res, (err) => {
    if (err) {
      logger.error("uploadProfilePhoto: Error occurred", {
        error: err.message,
      });
      return handleMulterError(err, req, res, next);
    }
    
    logger.debug("uploadProfilePhoto: Profile photo uploaded successfully", {
      filename: req.file?.originalname,
      size: req.file?.size,
    });
    next();
  });
};

/**
 * Hostel photos upload middleware
 * Multiple file upload with validation and error handling
 * - Max 20 files
 * - Max 10MB per file
 * - Only JPEG, PNG, WebP allowed
 * 
 * NOTE: Socket timeout is set to 5 minutes in server.js to allow large uploads
 */
const hostelUploadMiddleware = multer({
  storage: memoryStorage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB per file for hostel photos
    files: 20 // Max 20 files
  },
  fileFilter: (req, file, cb) => {
    logger.debug("hostelUploadMiddleware: Filtering file", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    if (allowedHostelMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      logger.warn("hostelUploadMiddleware: File rejected", {
        originalname: file.originalname,
        mimetype: file.mimetype,
      });
      cb(new Error("Only JPEG, PNG, and WebP image files are allowed. Please ensure you're uploading valid image files."));
    }
  },
}).any(); // Accept any file fields (handles 'photos' and 'photos[]' from different clients)

export const uploadHostelPhotos = (req, res, next) => {
  logger.debug("uploadHostelPhotos: Starting hostel photos upload");
  
  hostelUploadMiddleware(req, res, (err) => {
    if (err) {
      logger.error("uploadHostelPhotos: Error occurred", {
        error: err.message,
        code: err.code,
      });
      return handleMulterError(err, req, res, next);
    }
    // Enforce explicit count limit for hostel photo fields to avoid accepting too many files
    const photoFieldNames = ["photos", "photos[]"];
    const providedPhotoFiles = (req.files || []).filter(
      (f) => f.fieldname && photoFieldNames.includes(f.fieldname)
    );

    if (providedPhotoFiles.length > 20) {
      logger.warn("uploadHostelPhotos: Too many files provided", {
        providedCount: providedPhotoFiles.length,
      });
      return res.status(400).json({
        success: false,
        message: `Maximum 20 files allowed per upload. You provided ${providedPhotoFiles.length}.`,
      });
    }

    logger.info("uploadHostelPhotos: All files uploaded to memory", {
      fileCount: req.files?.length || 0,
      fieldNames: req.files?.map((f) => f.fieldname) || [],
      sizes: req.files?.map((f) => ({ name: f.originalname, size: f.size })) || [],
    });

    next();
  });
};

/**
 * Validate uploaded files before processing
 * This middleware validates file properties after multer processing
 */
export const validateUploadedFiles = (req, res, next) => {
  try {
    logger.debug("validateUploadedFiles: Starting validation", {
      hasFiles: !!req.files,
      fileCount: req.files?.length || 0,
    });

    if (!req.files || req.files.length === 0) {
      logger.debug("validateUploadedFiles: No files to validate");
      return next(); // No files to validate
    }

    const { valid, errors } = validateFiles(req.files, {
      allowedMimes: allowedHostelMimes,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      minFileSize: 1 * 1024, // 10KB minimum
      maxFiles: 20,
    });

    logger.debug("validateUploadedFiles: Validation complete", {
      validCount: valid.length,
      errorCount: errors.length,
    });

    if (errors.length > 0) {
      logger.warn("validateUploadedFiles: Validation errors found", {
        errors: errors,
      });

      return res.status(400).json({
        success: false,
        message: "File validation failed",
        errors: errors,
      });
    }

    // Replace req.files with validated files only
    req.files = valid;
    logger.debug("validateUploadedFiles: Passing validated files to next middleware", {
      validCount: valid.length,
    });
    next();
  } catch (error) {
    logger.error("validateUploadedFiles: Unexpected error", {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: "File validation error",
      error: error.message,
    });
  }
};
