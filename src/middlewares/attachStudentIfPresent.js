// Truly optional auth: decodes a student JWT if present and attaches
// req.user, but does NOT fail when the token is missing or invalid.
// Use only on routes that should work for both anonymous visitors
// and logged-in students (e.g. the AI Counselor).
//
// NOTE: separate from authenticateStudentOptional in
// authenticateStudentsOptional.js — that middleware, despite its name,
// rejects requests without a valid token. This one does not.

import jwt from "jsonwebtoken";
import Student from "../models/Students.js";
import env from "../config/env.js";

export const attachStudentIfPresent = async (req, res, next) => {
  try {
    const token =
      req.cookies?.studentToken ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) return next();

    const decoded = jwt.verify(token, env.jwt.secret);
    if (decoded.role !== "student") return next();

    const student = await Student.findById(decoded.id).select("_id name");
    if (student && student.status !== "blocked") {
      req.user = student;
      req.student = student;
    }
    return next();
  } catch {
    // Invalid / expired token — just continue as anonymous.
    return next();
  }
};

export default attachStudentIfPresent;
