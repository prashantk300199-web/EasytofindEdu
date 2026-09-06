/**
 * Input sanitization utilities
 * Prevents XSS, NoSQL injection, and other attacks
 */

import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize string input to prevent XSS attacks
 * @param {String} input - User input string
 * @returns {String} Sanitized string
 */
export const sanitizeString = (input) => {
  if (typeof input !== "string") return input;
  
  // Remove dangerous characters and trim
  return DOMPurify.sanitize(input)
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, ""); // Remove control characters
};

/**
 * Sanitize object recursively
 * @param {Object} obj - Object to sanitize
 * @param {Array} allowedKeys - Keys to include (optional)
 * @returns {Object} Sanitized object
 */
export const sanitizeObject = (obj, allowedKeys = null) => {
  if (!obj || typeof obj !== "object") return obj;

  const sanitized = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    // Skip if not in allowed keys
    if (allowedKeys && !allowedKeys.includes(key)) continue;

    // Sanitize based on type
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value, allowedKeys);
    } else if (typeof value === "number" || typeof value === "boolean") {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Validate and sanitize email
 * @param {String} email - Email to validate
 * @returns {String|null} Sanitized email or null if invalid
 */
export const sanitizeEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return null;
  
  return sanitizeString(email).toLowerCase();
};

/**
 * Validate and sanitize URL
 * @param {String} url - URL to validate
 * @returns {String|null} Sanitized URL or null if invalid
 */
export const sanitizeUrl = (url) => {
  try {
    const urlObj = new URL(url);
    // Only allow http/https protocols
    if (!["http:", "https:"].includes(urlObj.protocol)) return null;
    
    return urlObj.toString();
  } catch {
    return null;
  }
};

/**
 * Validate and sanitize phone number
 * @param {String} phone - Phone number to validate
 * @returns {String|null} Sanitized phone or null if invalid
 */
export const sanitizePhone = (phone) => {
  if (typeof phone !== "string") return null;
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");
  
  // Check if it's a valid length (10-15 digits)
  if (digits.length < 10 || digits.length > 15) return null;
  
  return digits;
};

/**
 * Validate and sanitize number within range
 * @param {*} value - Value to validate
 * @param {Number} min - Minimum value
 * @param {Number} max - Maximum value
 * @returns {Number|null} Sanitized number or null if invalid
 */
export const sanitizeNumber = (value, min = 0, max = Infinity) => {
  const num = Number(value);
  
  if (isNaN(num) || num < min || num > max) return null;
  
  return num;
};

/**
 * Sanitize coordinate (latitude/longitude)
 * @param {Number} value - Coordinate value
 * @param {Number} latOrLng - 0 for latitude, 1 for longitude
 * @returns {Number|null} Sanitized coordinate or null if invalid
 */
export const sanitizeCoordinate = (value, latOrLng = 0) => {
  const num = Number(value);
  
  if (isNaN(num)) return null;
  
  // Latitude: -90 to 90, Longitude: -180 to 180
  const [min, max] = latOrLng === 0 ? [-90, 90] : [-180, 180];
  
  return num >= min && num <= max ? num : null;
};

/**
 * Sanitize and validate array
 * @param {*} value - Value to validate
 * @param {Number} maxLength - Maximum array length
 * @returns {Array|null} Sanitized array or null if invalid
 */
export const sanitizeArray = (value, maxLength = 100) => {
  if (!Array.isArray(value)) return null;
  
  if (value.length > maxLength) return null;
  
  return value.map((item) => {
    if (typeof item === "string") return sanitizeString(item);
    if (typeof item === "object") return sanitizeObject(item);
    return item;
  });
};

export default {
  sanitizeString,
  sanitizeObject,
  sanitizeEmail,
  sanitizeUrl,
  sanitizePhone,
  sanitizeNumber,
  sanitizeCoordinate,
  sanitizeArray,
};
