/**
 * Rate limiting middleware for API protection
 * Implements token bucket algorithm per user/IP
 * Production-grade implementation
 */

const requestTracker = new Map();

const RATE_LIMIT_CONFIG = {
  // Per-user limits
  auth: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 mins
  hostel_create: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
  hostel_update: { maxRequests: 30, windowMs: 60 * 60 * 1000 }, // 30 per hour
  hostel_list: { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100 per hour
  default: { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100 per hour
};

/**
 * Create rate limiter for specific endpoint
 * @param {String} limitType - Type of limit (auth, hostel_create, etc.)
 * @returns {Function} Express middleware function
 */
export const createRateLimiter = (limitType = "default") => {
  const config = RATE_LIMIT_CONFIG[limitType] || RATE_LIMIT_CONFIG.default;

  return (req, res, next) => {
    const userId = req.user?._id || req.ip;
    const now = Date.now();
    const key = `${userId}-${limitType}`;

    // Get or initialize user's request history
    let userRequests = requestTracker.get(key);

    if (!userRequests) {
      userRequests = [];
      requestTracker.set(key, userRequests);
    }

    // Remove requests outside the time window
    const windowStart = now - config.windowMs;
    const validRequests = userRequests.filter((time) => time > windowStart);

    if (validRequests.length >= config.maxRequests) {
      const resetTime = new Date(validRequests[0] + config.windowMs);
      const retryAfter = Math.ceil((resetTime - now) / 1000);

      return res.status(429).json({
        success: false,
        message: `Rate limit exceeded. Please try again after ${retryAfter} seconds.`,
        retry_after: retryAfter,
        limit: config.maxRequests,
        window: `${config.windowMs / 1000}s`,
      });
    }

    // Add current request
    validRequests.push(now);
    requestTracker.set(key, validRequests);

    // Set headers
    res.setHeader("X-RateLimit-Limit", config.maxRequests);
    res.setHeader("X-RateLimit-Remaining", config.maxRequests - validRequests.length);
    res.setHeader("X-RateLimit-Reset", new Date(now + config.windowMs).toISOString());

    next();
  };
};

/**
 * Cleanup old entries periodically (runs every 10 minutes)
 */
setInterval(() => {
  const now = Date.now();
  const maxWindowMs = Math.max(
    ...Object.values(RATE_LIMIT_CONFIG).map((c) => c.windowMs)
  );

  for (const [key, requests] of requestTracker.entries()) {
    const validRequests = requests.filter((time) => now - time < maxWindowMs);
    if (validRequests.length === 0) {
      requestTracker.delete(key);
    } else {
      requestTracker.set(key, validRequests);
    }
  }
}, 10 * 60 * 1000);

export default createRateLimiter;
