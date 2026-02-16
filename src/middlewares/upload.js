import multer from "multer";
import { profileStorage, hostelStorage } from "../config/cloudinary.js";

export const uploadProfilePhoto = multer({
  storage: profileStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."), false);
    }
  },
}).single("profilePhoto");

export const uploadHostelPhotos = multer({
  storage: hostelStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."), false);
    }
  },
  // no fileSize limits for hostel photos per request
}).array("photos", 15);