import jwt from "jsonwebtoken";
import Student from "../models/Students.js";
import ApiError from "../utils/ApiError.js";
import env from "../config/env.js";

// Add this function to your existing middlewares/auth.js file
export const authenticateStudent = async (req, res, next) => {
  try {
    // Support both cookie and Bearer token
    const token =
      req.cookies?.studentToken ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Authentication required. Please login.");
    }

    const decoded = jwt.verify(token, env.jwt.secret);

    if (decoded.role !== "student") {
      throw new ApiError(403, "Access denied. Student role required.");
    }

    const student = await Student.findById(decoded.id);
    if (!student) {
      throw new ApiError(401, "Student not found.");
    }

    if (student.status === "blocked") {
      throw new ApiError(403, "Your account has been blocked.");
    }

    if (student.status === "pending") {
      throw new ApiError(403, "Please verify your email first.");
    }

    req.student = student;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new ApiError(401, "Invalid token."));
    }
    if (error.name === "TokenExpiredError") {
      return next(new ApiError(401, "Token has expired. Please login again."));
    }
    next(error);
  }
};