import multer from 'multer';
import { profileStorage, hostelStorage } from '../config/cloudinary.js'; // Use your existing config

// File filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Use your existing Cloudinary storage
export const upload = multer({
  storage: hostelStorage, // or profileStorage depending on what you want
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export const debugUpload = (req, res, next) => {
  console.log('📍 DEBUG UPLOAD MIDDLEWARE');
  console.log('📍 req.files before multer:', req.files);
  console.log('📍 req.body before multer:', req.body);
  next();
};
