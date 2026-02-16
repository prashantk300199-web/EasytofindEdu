import cloudinary from "../config/cloudinary.js";
import ApiError from "../utils/ApiError.js";

// Logger utility
const logger = {
  info: (msg, data = {}) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, data),
  error: (msg, error = {}) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, error),
  warn: (msg, data = {}) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, data),
  debug: (msg, data = {}) => process.env.NODE_ENV === 'development' && console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`, data),
};

/**
 * Upload a single file to Cloudinary with retry logic
 * @param {Object} file - File object from multer
 * @param {Object} options - Upload options
 * @param {String} options.folder - Cloudinary folder path
 * @param {Array} options.allowedFormats - Allowed image formats
 * @param {Number} options.maxRetries - Max retry attempts (default: 3)
 * @returns {Promise<Object>} Upload result with url and publicId
 * @throws {ApiError} If upload fails after retries
 */
export const uploadFileWithRetry = async (file, options = {}) => {
  const {
    folder = "vidyamarg/uploads",
    allowedFormats = ["jpg", "jpeg", "png", "webp"],
    maxRetries = 3,
    timeout = 30000, // 30 seconds per upload
  } = options;

  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`Upload attempt ${attempt}/${maxRetries}`, { filename: file.originalname });

      const uploadPromise = new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`Upload timeout after ${timeout}ms`));
        }, timeout);

        try {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder,
              allowed_formats: allowedFormats,
              resource_type: "image",
              timeout,
            },
            (error, result) => {
              clearTimeout(timeoutId);
              if (error) {
                logger.error("Cloudinary upload error in callback", { error: error.message });
                reject(error);
              } else {
                resolve({
                  url: result.secure_url,
                  publicId: result.public_id,
                  size: result.bytes,
                  width: result.width,
                  height: result.height,
                });
              }
            }
          );

          // Error handling for stream
          stream.on("error", (err) => {
            clearTimeout(timeoutId);
            logger.error("Stream error occurred", { error: err.message });
            reject(err);
          });

          stream.on("timeout", () => {
            clearTimeout(timeoutId);
            logger.error("Stream timeout occurred");
            reject(new Error("Stream timeout"));
          });

          // Handle both buffer (from memory storage) and stream (from disk storage)
          if (file.buffer) {
            // Memory storage: file has a buffer
            logger.debug("Using buffer for upload", { 
              filename: file.originalname, 
              size: file.buffer.length 
            });
            stream.end(file.buffer);
          } else if (file.stream) {
            // Disk/Cloudinary storage: file has a stream
            logger.debug("Using stream for upload", { filename: file.originalname });
            file.stream.on("error", (err) => {
              clearTimeout(timeoutId);
              logger.error("File stream error", { error: err.message });
              reject(err);
            });
            file.stream.pipe(stream);
          } else {
            clearTimeout(timeoutId);
            reject(new Error("File has neither buffer nor stream"));
          }
        } catch (streamError) {
          clearTimeout(timeoutId);
          logger.error("Error creating upload stream", { error: streamError.message });
          reject(streamError);
        }
      });

      const result = await uploadPromise;
      logger.info(`File uploaded successfully`, { 
        filename: file.originalname, 
        publicId: result.publicId,
        attempt 
      });
      return result;
    } catch (error) {
      lastError = error;
      logger.warn(`Upload attempt ${attempt} failed`, { 
        filename: file.originalname, 
        error: error.message,
        attempt 
      });

      // If it's the last attempt, throw error
      if (attempt === maxRetries) {
        logger.error(`All ${maxRetries} upload attempts failed`, { 
          filename: file.originalname, 
          error: error.message 
        });
        throw new ApiError(
          500, 
          `Failed to upload "${file.originalname}" after ${maxRetries} attempts. ${error.message}`
        );
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Upload multiple files in parallel with error handling
 * @param {Array} files - Array of file objects from multer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload results with successful uploads and errors
 */
export const uploadMultipleFiles = async (files, options = {}) => {
  if (!files || files.length === 0) {
    return { successful: [], failed: [] };
  }

  const {
    concurrency = 3, // Max concurrent uploads
    folder = "vidyamarg/uploads",
    allowedFormats = ["jpg", "jpeg", "png", "webp"],
    maxRetries = 3,
  } = options;

  logger.info(`Starting batch upload`, { 
    totalFiles: files.length, 
    concurrency,
    folder 
  });

  const successful = [];
  const failed = [];
  const results = [];

  // Process files with controlled concurrency
  const uploadTasks = files.map((file, index) => 
    uploadFileWithRetry(file, { folder, allowedFormats, maxRetries })
      .then((result) => {
        results[index] = { success: true, result };
        successful.push(result);
        logger.debug(`File ${index + 1}/${files.length} uploaded successfully`, { 
          filename: file.originalname 
        });
      })
      .catch((error) => {
        results[index] = { success: false, error };
        failed.push({
          filename: file.originalname,
          error: error.message,
          index,
        });
        logger.warn(`File ${index + 1}/${files.length} upload failed`, { 
          filename: file.originalname, 
          error: error.message 
        });
      })
  );

  // Execute with concurrency control
  for (let i = 0; i < uploadTasks.length; i += concurrency) {
    await Promise.all(uploadTasks.slice(i, i + concurrency));
  }

  logger.info(`Batch upload completed`, { 
    successful: successful.length, 
    failed: failed.length,
    total: files.length 
  });

  return { successful, failed, results };
};

/**
 * Validate files before upload
 * @param {Array} files - Files to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateFiles = (files, options = {}) => {
  const {
    allowedMimes = ["image/jpeg", "image/png", "image/webp"],
    maxFileSize = 10 * 1024 * 1024, // 10MB
    minFileSize = 10 * 1024, // 10KB
    maxFiles = 20,
  } = options;

  const errors = [];
  const valid = [];

  if (!files || files.length === 0) {
    return { valid, errors: ["No files provided"] };
  }

  if (files.length > maxFiles) {
    return { 
      valid: [], 
      errors: [`Maximum ${maxFiles} files allowed. You provided ${files.length}`] 
    };
  }

  files.forEach((file, index) => {
    const fileErrors = [];

    // Check MIME type
    if (!allowedMimes.includes(file.mimetype)) {
      fileErrors.push(
        `Invalid file type "${file.mimetype}". Allowed: ${allowedMimes.join(", ")}`
      );
    }

    // Check file size
    if (file.size > maxFileSize) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      const maxMB = (maxFileSize / 1024 / 1024).toFixed(2);
      fileErrors.push(
        `File size ${sizeMB}MB exceeds maximum ${maxMB}MB`
      );
    }

    if (file.size < minFileSize) {
      const sizeMB = (file.size / 1024).toFixed(2);
      const minMB = (minFileSize / 1024).toFixed(2);
      fileErrors.push(
        `File size ${sizeMB}KB is below minimum ${minMB}KB`
      );
    }

    if (fileErrors.length > 0) {
      errors.push({
        index,
        filename: file.originalname,
        errors: fileErrors,
      });
    } else {
      valid.push(file);
    }
  });

  return { valid, errors };
};

/**
 * Cleanup uploaded files on failure
 * @param {Array} publicIds - Array of public IDs to delete
 * @returns {Promise<Object>} Deletion results
 */
export const cleanupUploadedFiles = async (publicIds) => {
  if (!publicIds || publicIds.length === 0) {
    return { deleted: 0, failed: 0 };
  }

  logger.warn(`Cleaning up ${publicIds.length} uploaded files`, { publicIds });

  let deleted = 0;
  let failed = 0;

  const deletePromises = publicIds.map((publicId) =>
    cloudinary.uploader.destroy(publicId)
      .then(() => {
        deleted++;
        logger.debug(`File deleted during cleanup`, { publicId });
      })
      .catch((error) => {
        failed++;
        logger.error(`Failed to cleanup file`, { publicId, error: error.message });
      })
  );

  await Promise.all(deletePromises);

  logger.info(`Cleanup completed`, { deleted, failed });
  return { deleted, failed };
};

/**
 * Get image optimization parameters
 * @param {String} type - Image type (profile, hostel, etc.)
 * @returns {Object} Transformation options
 */
export const getImageTransformation = (type = "hostel") => {
  const transformations = {
    profile: {
      width: 400,
      height: 400,
      crop: "fill",
      gravity: "face",
      quality: "auto",
      fetch_format: "auto",
    },
    hostel: {
      width: 1200,
      height: 800,
      crop: "limit",
      quality: "auto",
      fetch_format: "auto",
    },
    thumbnail: {
      width: 400,
      height: 300,
      crop: "fill",
      quality: "auto",
      fetch_format: "auto",
    },
  };

  return transformations[type] || transformations.hostel;
};

/**
 * Generate optimized image URLs with transformations
 * @param {String} publicId - Cloudinary public ID
 * @param {String} type - Image type
 * @returns {Object} URLs for different sizes
 */
export const getOptimizedImageUrls = (publicId, type = "hostel") => {
  const baseUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;
  
  return {
    original: `${baseUrl}/${publicId}`,
    optimized: cloudinary.url(publicId, {
      ...getImageTransformation(type),
      secure: true,
    }),
    thumbnail: cloudinary.url(publicId, {
      ...getImageTransformation("thumbnail"),
      secure: true,
    }),
  };
};
