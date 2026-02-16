import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import env from "./config/env.js";
import errorHandler from "./middlewares/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import ownerRoutes from "./routes/owner.routes.js";
import hostelRoutes from "./routes/hostel.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import adminAuthRoutes from "./routes/admin.auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import adminOwnerRoutes from "./routes/admin.owner.routes.js";
import adminHostelRoutes from "./routes/admin.hostel.routes.js";
import publicRoutes from "./routes/public.routes.js";
import ApiResponse from "./utils/ApiResponse.js";

const app = express();

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://vidyamarg.org',
      'https://www.vidyamarg.org',
      'http://localhost:5173', // for development
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

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
    })
  );
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/owner", ownerRoutes);
app.use("/api/v1/hostels", hostelRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/admin/auth", adminAuthRoutes);
app.use("/api/v1/admin/members", adminRoutes);
app.use("/api/v1/admin/owners", adminOwnerRoutes);
app.use("/api/v1/admin/hostels", adminHostelRoutes);
app.use("/api/v1/public", publicRoutes);

app.all("*", (req, res) => {
  res.status(404).json(
    new ApiResponse(404, `Route ${req.originalUrl} not found.`)
  );
});

app.use(errorHandler);

export default app;