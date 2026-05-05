import { Router } from "express";
import {
  createOffer,
  getOffersByHostel,
  updateOffer,
  deleteOffer,
  toggleOfferStatus,
  getAllOffers,
} from "../controllers/offer.controller.js";
import { authenticateOwner, authenticateAdmin } from "../middlewares/auth.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import env from "../config/env.js";
import User from "../models/User.js";
import Admin from "../models/Admin.js";

const router = Router();

// Custom Middleware to authenticate either owner or admin
const authenticateOwnerOrAdmin = asyncHandler(async (req, res, next) => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.slice(7);
  } else if (req.headers.authorization) {
    token = req.headers.authorization;
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  } else if (req.cookies?.adminToken) {
    token = req.cookies.adminToken;
  }

  if (!token) {
    throw new ApiError(401, "Access denied. No token provided.");
  }

  try {
    const decoded = jwt.verify(token, env.jwt.secret);

    if (decoded.role === "owner") {
      const user = await User.findById(decoded.id);
      if (!user || user.status === "blocked") throw new Error("Invalid owner");
      req.user = user;
      return next();
    } else if (["admin", "superadmin"].includes(decoded.role)) {
      const admin = await Admin.findById(decoded.id);
      if (!admin || !admin.isActive) throw new Error("Invalid admin");
      req.admin = admin;
      return next();
    } else {
      throw new Error("Invalid role");
    }
  } catch (error) {
    throw new ApiError(401, "Not authorized as Owner or Admin");
  }
});

// Public route to get offers for a hostel
router.get("/hostel/:hostelId", getOffersByHostel);

// Protected routes (Owner/Admin)
router.use(authenticateOwnerOrAdmin);

router.post("/create", createOffer);
router.put("/:id", updateOffer);
router.delete("/:id", deleteOffer);
router.patch("/:id/toggle", toggleOfferStatus);

// Admin only route
router.get("/admin/all", authenticateAdmin, getAllOffers);

export default router;
