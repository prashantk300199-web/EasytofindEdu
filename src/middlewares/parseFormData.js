import ApiError from "../utils/ApiError.js";

// Logger utility
const logger = {
  info: (msg, data = {}) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, data),
  error: (msg, error = {}) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, error),
  warn: (msg, data = {}) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, data),
  debug: (msg, data = {}) => process.env.NODE_ENV === 'development' && console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`, data),
};

const parseFormData = (req, res, next) => {
  try {
    // Log incoming body info
    logger.debug("parseFormData: Processing request", {
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      hasFiles: !!req.files,
      fileCount: req.files?.length || 0,
    });

    if (req.body && req.body.data) {
      try {
        const parsed = typeof req.body.data === "string"
          ? JSON.parse(req.body.data)
          : req.body.data;
        
        req.body = { ...parsed, _files: req.files };
        logger.debug("parseFormData: Successfully parsed hostel data", {
          dataKeys: Object.keys(parsed),
        });
      } catch (parseError) {
        logger.error("parseFormData: JSON parsing failed", {
          error: parseError.message,
          dataValue: req.body.data?.substring ? req.body.data.substring(0, 100) : 'not a string',
        });
        throw new ApiError(400, "Invalid JSON in data field. Please ensure the data is valid JSON.");
      }
    } else {
      logger.warn("parseFormData: No data field in request", {
        hasBody: !!req.body,
        hasFiles: !!req.files,
      });
    }

    next();
  } catch (error) {
    logger.error("parseFormData: Unexpected error", {
      error: error.message,
      stack: error.stack,
    });

    // If it's an ApiError, let it propagate
    if (error instanceof ApiError) {
      throw error;
    }

    // Otherwise wrap it
    throw new ApiError(500, "Error processing form data: " + error.message);
  }
};

export default parseFormData;