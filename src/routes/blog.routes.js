import express from 'express';
import { 
  createBlog, 
  getAllBlogs, 
  getBlogBySlug, 
  deleteBlog,
  updateBlog,  // 🚀 ADDED: Imported the update controller
  getBlogById,  // 🚀 ADDED: Imported the getById controller
  uploadBlogImage // 🚀 ADDED: Imported the uploadBlogImage controller
} from '../controllers/blog.controller.js';
import { upload } from '../middlewares/uploadInstiture.js'; 

const router = express.Router();

// 🎯 INTERNAL RICH TEXT IMAGE UPLOAD (MUST BE BEFORE SLUG)
router.post(
  '/upload-image',
  upload.single('image'), // Quill image handler uses 'image' by convention
  uploadBlogImage
);

// =================================================================
// 🌍 PUBLIC ROUTES (For Website/Users)
// =================================================================
router.get('/', getAllBlogs);
router.get('/:slug', getBlogBySlug);

// =================================================================
// 🔒 ADMIN ROUTES (For Dashboard)
// ⚠️ Note: Uncomment your authentication middlewares when ready
// =================================================================

// 1. CREATE NEW BLOG
router.post(
  '/', 
  // protect, restrictTo("admin", "superadmin"),
  upload.fields([{ name: 'coverImage', maxCount: 1 }]), 
  createBlog
);

// 2. UPDATE EXISTING BLOG 🚀 (THIS WAS MISSING & CAUSING THE 404 ERROR)
router.put(
  '/:id', 
  // protect, restrictTo("admin", "superadmin"),
  upload.fields([{ name: 'coverImage', maxCount: 1 }]), // Needed to parse new images
  updateBlog
);

// 3. DELETE BLOG
router.delete(
  '/:id', 
  // protect, restrictTo("admin", "superadmin"),
  deleteBlog
);

// 4. GET BLOG BY ID (Specifically for Admin Edit Modal)
router.get(
  '/admin/:id',
  // protect, restrictTo("admin", "superadmin"),
  getBlogById
);

export default router;