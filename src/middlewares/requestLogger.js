/**
 * Request logging and audit trail middleware
 * Logs all incoming requests for security and debugging
 */

export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Store request metadata
  req.requestId = requestId;
  req.startTime = startTime;

  // Extract userId - check both req.user (after auth) and from token/cookie
  let userId = "anonymous";
  if (req.user?._id) {
    userId = req.user._id.toString();
  }

  // Log incoming request (exclude sensitive data)
  const logData = {
    requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    endpoint: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get("user-agent"),
    userId,
    contentType: req.get("content-type"),
  };

  console.log(`[REQUEST] ${JSON.stringify(logData)}`);
  // Ensure responses are logged regardless of how they finish (json/send/end)
  const onFinish = () => {
    const duration = Date.now() - startTime;
    const responseSize = res.getHeader("Content-Length") || 0;
    
    // Get userId from populated req.user (after auth middleware)
    const finalUserId = req.user?._id?.toString() || userId;
    
    const responseLog = {
      requestId,
      method: req.method,
      endpoint: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize,
      userId: finalUserId,
      timestamp: new Date().toISOString(),
    };

    if (res.statusCode >= 400) {
      console.error(`[RESPONSE] ${JSON.stringify(responseLog)}`);
    } else {
      console.log(`[RESPONSE] ${JSON.stringify(responseLog)}`);
    }

    // Expose tracing headers for the client
    try {
      res.setHeader("X-Request-ID", requestId);
      res.setHeader("X-Response-Time", `${duration}ms`);
    } catch (e) {
      // headers may be already sent; ignore
    }
  };

  res.on("finish", onFinish);

  next();
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Enable XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline';"
  );

  // Referrer Policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Feature Policy (Permissions Policy)
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // HSTS (HTTPS Strict Transport Security)
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  next();
};

/**
 * Request body size validation middleware
 * Prevents request bomb attacks
 */
export const validateRequestSize = (req, res, next) => {
  // Determine appropriate max body size depending on content type
  const contentType = (req.headers && req.headers["content-type"]) || "";
  const isMultipart = contentType.includes("multipart/form-data");

  // Keep strict small limit for normal requests, but allow large multipart uploads
  // Increased multipart limit to support many large images (e.g., 20 × 10MB = 200MB)
  const maxBodySize = isMultipart ? 250 * 1024 * 1024 : 50 * 1024; // 250MB for uploads, 50KB otherwise

  // Prefer using Content-Length header when available to avoid interfering with streaming parsers
  const contentLengthHeader = req.headers && req.headers["content-length"];
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : NaN;

  if (!Number.isNaN(contentLength)) {
    if (contentLength > maxBodySize) {
      res.statusCode = 413; // Payload Too Large
      res.end("Payload too large");
      try { req.socket.destroy(); } catch (e) {}
      return;
    }
    return next();
  }

  // If Content-Length is absent (chunked transfer), do not attach a 'data' listener for multipart requests
  // to avoid interfering with Multer/Busboy streams. Only attach a listener for non-multipart chunked requests.
  if (!isMultipart) {
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBodySize) {
        try {
          res.statusCode = 413; // Payload Too Large
          res.end("Payload too large");
        } catch (e) {
          // ignore errors when ending response
        }
        try { req.socket.destroy(); } catch (e) {}
      }
    });
  }

  next();
};

export default requestLogger;
