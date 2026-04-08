import ApiError from "../utils/ApiError.js";

// Enhanced error logger with structured logs
const errorLogger = {
  log: (level, msg, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message: msg,
      ...meta,
    };
    console.log(JSON.stringify(logEntry));
  },
};

/**
 * Centralized error handling middleware
 * Provides consistent error responses and logging
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} _next - Express next function
 */
const errorHandler = (err, req, res, _next) => {
  const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const clientIp = req.ip || req.connection.remoteAddress;
  const userInfo = {
    userId: req.user?._id || "anonymous",
    email: req.user?.email || "N/A",
  };

  // Handle custom API errors
  if (err instanceof ApiError) {
    errorLogger.log("WARN", "API Error Response", {
      errorId,
      statusCode: err.statusCode,
      message: err.message,
      endpoint: `${req.method} ${req.originalUrl}`,
      clientIp,
      user: userInfo,
    });

    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
      error_id: errorId,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));

    errorLogger.log("WARN", "Validation Error", {
      errorId,
      endpoint: `${req.method} ${req.originalUrl}`,
      clientIp,
      user: userInfo,
      errors,
    });

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
      error_id: errorId,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];

    errorLogger.log("WARN", "Duplicate Key Error", {
      errorId,
      field,
      endpoint: `${req.method} ${req.originalUrl}`,
      clientIp,
      user: userInfo,
    });

    return res.status(409).json({
      success: false,
      message: `${field} already exists. Please use a different ${field}.`,
      error_id: errorId,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    errorLogger.log("WARN", "JWT Error", {
      errorId,
      endpoint: `${req.method} ${req.originalUrl}`,
      clientIp,
      user: userInfo,
      error: err.message,
    });

    return res.status(401).json({
      success: false,
      message: "Invalid or malformed token. Please login again.",
      error_id: errorId,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle JWT expiration
  if (err.name === "TokenExpiredError") {
    errorLogger.log("WARN", "Token Expired", {
      errorId,
      endpoint: `${req.method} ${req.originalUrl}`,
      clientIp,
      user: userInfo,
      expiredAt: err.expiredAt,
    });

    return res.status(401).json({
      success: false,
      message: "Your session has expired. Please login again.",
      error_id: errorId,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle Multer file upload errors
  if (err.name === "MulterError") {
    let message = "File upload failed";
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File size exceeds the maximum allowed limit.";
    } else if (err.code === "LIMIT_FILE_COUNT") {
      message = "Too many files uploaded. Maximum 5 files allowed.";
    }

    errorLogger.log("WARN", "Multer Error", {
      errorId,
      code: err.code,
      endpoint: `${req.method} ${req.originalUrl}`,
      clientIp,
      user: userInfo,
    });

    return res.status(400).json({
      success: false,
      message,
      error_id: errorId,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle cast errors (invalid MongoDB ID)
  if (err.name === "CastError") {
    errorLogger.log("WARN", "Cast Error", {
      errorId,
      path: err.path,
      value: err.value,
      endpoint: `${req.method} ${req.originalUrl}`,
      clientIp,
      user: userInfo,
    });

    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
      error_id: errorId,
      timestamp: new Date().toISOString(),
    });
  }

  // Log unhandled errors with full details
  errorLogger.log("ERROR", "Unhandled Error", {
    errorId,
    endpoint: `${req.method} ${req.originalUrl}`,
    clientIp,
    user: userInfo,
    errorName: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  return res.status(500).json({
    success: false,
    message: "An unexpected error occurred. Our team has been notified.",
    error_id: errorId,
    supportEmail: "support@vidyamarg.org",
    timestamp: new Date().toISOString(),
  });
};

export default errorHandler;