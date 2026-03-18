import jwt from "jsonwebtoken";
import env from "../config/env.js";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import InstituteOwner from "../models/InstituteOwner.js"; // Add this import
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
  
const logger = {
  info: (msg, data = {}) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, data),
  error: (msg, error = {}) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, error),
  warn: (msg, data = {}) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, data),
  debug: (msg, data = {}) => process.env.NODE_ENV === 'development' && console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`, data),
};

export const authenticateOwner = asyncHandler(async (req, res, next) => {
  // Extract token from multiple sources
  let token = null;
  
  // 1. Check Authorization header (Bearer token)
  if (req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7); // Remove 'Bearer ' prefix
    } else {
      token = authHeader; // Handle case where token is sent directly
    }
  }
  
  // 2. Check cookies if header not found
  if (!token && req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    logger.warn("Authentication failed: No token provided", { 
      endpoint: req.originalUrl,
      method: req.method,
      hasAuthHeader: !!req.headers.authorization,
      hasCookie: !!req.cookies?.token
    });
    throw new ApiError(401, "Access denied. No token provided. Please login first.");
  }

  try {
    const decoded = jwt.verify(token, env.jwt.secret);

    if (decoded.role !== "owner") {
      logger.warn("Authentication failed: Invalid role", { 
        userId: decoded.id,
        role: decoded.role,
        expected: "owner"
      });
      throw new ApiError(403, "Access denied. Invalid role. Only hostel owners can access this resource.");
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      logger.warn("Authentication failed: User not found", { userId: decoded.id });
      throw new ApiError(401, "User not found. Please login again.");
    }

    if (user.status === "blocked") {
      logger.warn("Authentication failed: User blocked", { userId: decoded.id });
      throw new ApiError(403, "Your account has been blocked. Please contact support.");
    }

    req.user = user;
    logger.debug("User authenticated successfully", { userId: user._id, email: user.email });
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error("Token verification failed", { error: error.message, token: token.substring(0, 20) + '...' });
    
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, "Token has expired. Please login again.");
    }
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, "Invalid token. Please login again.");
    }
    
    throw new ApiError(401, "Authentication failed. Please login again.");
  }
});

export const authenticateAdmin = asyncHandler(async (req, res, next) => {
  // Extract token from multiple sources
  let token = null;
  
  // 1. Check Authorization header (Bearer token)
  if (req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7); // Remove 'Bearer ' prefix
    } else {
      token = authHeader; // Handle case where token is sent directly
    }
  }
  
  // 2. Check cookies if header not found
  if (!token && req.cookies?.adminToken) {
    token = req.cookies.adminToken;
  }

  if (!token) {
    logger.warn("Admin authentication failed: No token provided", { 
      endpoint: req.originalUrl,
      method: req.method,
    });
    throw new ApiError(401, "Access denied. No token provided.");
  }

  try {
    const decoded = jwt.verify(token, env.jwt.secret);

    if (!["admin", "superadmin"].includes(decoded.role)) {
      logger.warn("Admin authentication failed: Invalid role", { 
        userId: decoded.id,
        role: decoded.role,
      });
      throw new ApiError(403, "Access denied. Admin role required.");
    }

    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      logger.warn("Admin authentication failed: Admin not found", { userId: decoded.id });
      throw new ApiError(401, "Admin not found.");
    }

    if (!admin.isActive) {
      logger.warn("Admin authentication failed: Account deactivated", { userId: decoded.id });
      throw new ApiError(403, "Your account has been deactivated.");
    }

    req.admin = admin;
    logger.debug("Admin authenticated successfully", { adminId: admin._id });
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error("Admin token verification failed", { error: error.message });
    
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, "Token has expired. Please login again.");
    }
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, "Invalid token. Please login again.");
    }
    
    throw new ApiError(401, "Authentication failed. Please login again.");
  }
});

// Add Institute Owner Authentication
export const authenticateInstituteOwner = asyncHandler(async (req, res, next) => {
  // Extract token from multiple sources
  let token = null;
  
  // 1. Check Authorization header (Bearer token)
  if (req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7); // Remove 'Bearer ' prefix
    } else {
      token = authHeader; // Handle case where token is sent directly
    }
  }
  
  // 2. Check cookies if header not found
  if (!token && req.cookies?.instituteOwnerToken) {
    token = req.cookies.instituteOwnerToken;
  }

  if (!token) {
    logger.warn("Institute Owner authentication failed: No token provided", { 
      endpoint: req.originalUrl,
      method: req.method,
    });
    throw new ApiError(401, "Access denied. No token provided.");
  }

  try {
    const decoded = jwt.verify(token, env.jwt.secret);

    if (decoded.role !== "institute_owner") {
      logger.warn("Institute Owner authentication failed: Invalid role", { 
        userId: decoded.id,
        role: decoded.role,
      });
      throw new ApiError(403, "Access denied. Institute owner role required.");
    }

    const owner = await InstituteOwner.findById(decoded.id);

    if (!owner) {
      logger.warn("Institute Owner authentication failed: Owner not found", { userId: decoded.id });
      throw new ApiError(401, "Owner not found.");
    }

    if (owner.status === "blocked") {
      logger.warn("Institute Owner authentication failed: Account blocked", { userId: decoded.id });
      throw new ApiError(403, "Your account has been blocked.");
    }

    req.owner = owner;
    logger.debug("Institute Owner authenticated successfully", { ownerId: owner._id });
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error("Institute Owner token verification failed", { error: error.message });
    
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, "Token has expired. Please login again.");
    }
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, "Invalid token. Please login again.");
    }
    
    throw new ApiError(401, "Authentication failed. Please login again.");
  }
});


export default authenticateAdmin;

