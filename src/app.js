import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import env from "./config/env.js";
import errorHandler from "./middlewares/errorHandler.js";
import { requestLogger, securityHeaders, validateRequestSize } from "./middlewares/requestLogger.js";
import authRoutes from "./routes/auth.routes.js";
import ownerRoutes from "./routes/owner.routes.js";
import hostelRoutes from "./routes/hostel.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import adminAuthRoutes from "./routes/admin.auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import adminOwnerRoutes from "./routes/admin.owner.routes.js";
import adminHostelRoutes from "./routes/admin.hostel.routes.js";
import instituteRoutes from './routes/institute.routes.js';
import instituteAuthRoutes from './routes/institute.auth.routes.js';
import ownerInstituteRoutes from './routes/owner.institute.routes.js';
import adminInstituteRoutes from './routes/admin.institute.routes.js';
import studentAuthRoutes from "./routes/student.routes.js";
import enquiryRoutes from "./routes/enquiry.routes.js";
import publicRoutes from "./routes/public.routes.js";
import ApiResponse from "./utils/ApiResponse.js";


const app = express();

// Security middleware - Applied first
app.use(helmet());
app.use(securityHeaders);
app.use(validateRequestSize);

// CORS configuration for cross-device compatibility
// MUST be before auth guards to handle preflight requests properly
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://vidyamarg.org',
      'https://www.vidyamarg.org',
      'http://localhost:5173', // for development
      'http://localhost:3000', // alternative dev port
      'http://localhost:8080', // alternative dev port
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Number', 'X-Request-ID', 'X-Response-Time'],
  maxAge: 86400, // 24 hours - cache preflight requests
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Logging middleware
app.use(morgan("dev"));
app.use(requestLogger);

// Body parsers with appropriate limits for file uploads
// Increased limits to handle multiple image uploads (5 × 10MB = 50MB)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// Health check endpoints
app.get("/", (req, res) => {
  res.status(200).json(
    new ApiResponse(200, "Vidya Marg API is running.")
  );
});

app.get("/api/v1/health", (req, res) => {
  res.status(200).json(
    new ApiResponse(200, "Server is healthy.", {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: env.nodeEnv,
      version: "1.0.0",
    })
  );
});

// API Routes (Protected)
app.use("/api/v1/auth", authRoutes);
// NOTE: /api/v1/owner/institutes must be registered BEFORE /api/v1/owner
// otherwise the hostel-owner authenticateOwner middleware runs first on all /owner/* paths
app.use("/api/v1/owner/institutes", ownerInstituteRoutes);
app.use("/api/v1/owner", ownerRoutes);
app.use("/api/v1/hostels", hostelRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/reviews", reviewRoutes); 
app.use("/api/v1/admin/auth", adminAuthRoutes);
app.use("/api/v1/admin/members", adminRoutes);
app.use("/api/v1/admin/owners", adminOwnerRoutes);
app.use("/api/v1/admin/hostels", adminHostelRoutes);
// NOTE: /api/v1/admin/institutes must be registered BEFORE /api/v1/admin/* generic routes
app.use("/api/v1/admin/institutes", adminInstituteRoutes);
app.use("/api/v1/institutes", instituteRoutes);
app.use("/api/v1/institute/auth", instituteAuthRoutes);
app.use("/api/v1/student/auth", studentAuthRoutes);
app.use("/api/v1/enquiries", enquiryRoutes);
app.use("/api/v1/public", publicRoutes);

// 404 handler
app.all("*", (req, res) => {
  res.status(404).json(
    new ApiResponse(404, `Route ${req.originalUrl} not found.`)
  );
});

// Error handler (must be last middleware)
app.use(errorHandler);

export default app;
