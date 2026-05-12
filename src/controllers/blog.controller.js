import Blog from '../models/blog.model.js';
import slugify from 'slugify';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';

import { uploadOnCloudinary } from '../config/cloudinary.js';

// 🚀 CREATE NEW BLOG (ADMIN ONLY)
export const createBlog = async (req, res) => {
  try {
    const { title, content, excerpt, category, tags, status, authorName } = req.body;

    if (!title || !content || !category) {
      throw new ApiError(400, "Title, content, and category are required");
    }

    // Generate SEO friendly URL
    let baseSlug = slugify(title, { lower: true, strict: true });
    
    // Check if slug exists, if yes, append random string
    const existingBlog = await Blog.findOne({ slug: baseSlug });
    if (existingBlog) {
      baseSlug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`;
    }

    // Process Tags (if sent as comma separated string from frontend)
    let parsedTags = [];
    if (tags) {
      parsedTags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
    }

    const blogData = {
      title,
      slug: baseSlug,
      content,
      excerpt: excerpt || content.substring(0, 150) + '...', // Auto excerpt if not provided
      category,
      tags: parsedTags,
      status: status || 'Published',
      authorName: authorName || 'Vidyamarg Team'
    };

    // Handle Cover Image Upload to Cloudinary (supports memory buffer or Cloudinary storage)
    if (req.files && req.files.coverImage && req.files.coverImage[0]) {
      const fileObj = req.files.coverImage[0];

      // If middleware already uploaded to Cloudinary (custom storage returns secure URL in `path`)
      if ((fileObj.path && String(fileObj.path).startsWith('http')) || fileObj.url) {
        blogData.coverImage = {
          publicId: fileObj.filename || fileObj.public_id || fileObj.publicId || "",
          url: fileObj.path || fileObj.url,
        };
      } else if (fileObj.buffer) {
        const uploaded = await uploadOnCloudinary(fileObj);
        if (!uploaded || !uploaded.url) throw new ApiError(500, "Failed to upload cover image on Cloudinary");
        blogData.coverImage = { publicId: uploaded.publicId || "", url: uploaded.url };
      } else if (fileObj.path) {
        const uploaded = await uploadOnCloudinary(fileObj.path);
        if (!uploaded || !uploaded.url) throw new ApiError(500, "Failed to upload cover image on Cloudinary");
        blogData.coverImage = { publicId: uploaded.publicId || "", url: uploaded.url };
      }
    }

    const blog = await Blog.create(blogData);
    
    return res.status(201).json(new ApiResponse(201, "Blog published successfully", blog));
  } catch (error) {
    console.error("Create Blog Error:", error);
    return res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode || 500, error.message || "Internal Server Error"));
  }
};

// 🚀 GET ALL BLOGS (PUBLIC - For Website Display)
// 🚀 GET ALL BLOGS (UPDATED FOR ADMIN)
// 🚀 GET ALL BLOGS (UPDATED TO SUPPORT STATUS FILTERING)
export const getAllBlogs = async (req, res) => {
  try {
    // Added 'status' to the destructured query
    const { page = 1, limit = 10, category, search, status } = req.query;
    
    const query = {}; 

    if (category) query.category = category;
    if (search) query.$text = { $search: search };
    
    // ✅ NEW: Agar status bheja gaya hai (jaise 'Published'), toh filter apply hoga
    if (status) query.status = status; 

    const skip = (page - 1) * limit;

    const blogs = await Blog.find(query)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-content');

    const total = await Blog.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "Blogs fetched",
      data: {
        blogs,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch blogs" });
  }
};

// 🚀 GET SINGLE BLOG BY SLUG (PUBLIC - For SEO URL /blog/how-to-crack-jee)
export const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Find blog and increment view count by 1
    const blog = await Blog.findOneAndUpdate(
      { slug, status: 'Published' },
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!blog) throw new ApiError(404, "Blog not found");

    return res.status(200).json(new ApiResponse(200, 'Blog details', blog));
  } catch (error) {
    return res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode || 500, error.message || "Internal Server Error"));
  }
};

// 🚀 DELETE BLOG (ADMIN)
export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) throw new ApiError(404, "Blog not found");
    return res.status(200).json(new ApiResponse(200, 'Blog deleted'));
  } catch (error) {
    console.error('Delete Blog Error:', error);
    return res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode || 500, error.message || 'Failed to delete blog'));
  }
};

// 🚀 GET SINGLE BLOG BY ID (ADMIN - for editing)
export const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) throw new ApiError(404, "Blog not found");
    return res.status(200).json(new ApiResponse(200, 'Blog details', blog));
  } catch (error) {
    return res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode || 500, error.message || "Internal Server Error"));
  }
};

// 🚀 UPDATE BLOG (ADMIN)
export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, category, tags, status, authorName } = req.body;

    const blog = await Blog.findById(id);
    if (!blog) throw new ApiError(404, "Blog not found");

    const updateData = {};
    if (title) {
      updateData.title = title;
      if (title !== blog.title) {
         let baseSlug = slugify(title, { lower: true, strict: true });
         const existingBlog = await Blog.findOne({ slug: baseSlug, _id: { $ne: id } });
         if (existingBlog) {
           baseSlug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`;
         }
         updateData.slug = baseSlug;
      }
    }
    if (content) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (category) updateData.category = category;
    
    if (tags) {
      updateData.tags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
    }
    if (status) updateData.status = status;
    if (authorName) updateData.authorName = authorName;

    // Handle Cover Image Upload (supports memory buffer or Cloudinary storage)
    if (req.files && req.files.coverImage && req.files.coverImage[0]) {
      const fileObj = req.files.coverImage[0];
      if ((fileObj.path && String(fileObj.path).startsWith('http')) || fileObj.url) {
        updateData.coverImage = { publicId: fileObj.filename || fileObj.public_id || '', url: fileObj.path || fileObj.url };
      } else if (fileObj.buffer) {
        const uploaded = await uploadOnCloudinary(fileObj);
        if (uploaded && uploaded.url) updateData.coverImage = { publicId: uploaded.publicId || '', url: uploaded.url };
      } else if (fileObj.path) {
        const uploaded = await uploadOnCloudinary(fileObj.path);
        if (uploaded && uploaded.url) updateData.coverImage = { publicId: uploaded.publicId || '', url: uploaded.url };
      }
    }

    const updatedBlog = await Blog.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    return res.status(200).json(new ApiResponse(200, 'Blog updated successfully', updatedBlog));
  } catch (error) {
    console.error("Update Blog Error:", error);
    return res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode || 500, error.message || "Internal Server Error"));
  }
};

// 🚀 UPLOAD BLOG IMAGE (For Rich Text Editor)
export const uploadBlogImage = async (req, res) => {
  try {
    if (!req.file) throw new ApiError(400, 'Image file is required');

    const fileObj = req.file;
    // If middleware already provided remote URL
    if ((fileObj.path && String(fileObj.path).startsWith('http')) || fileObj.url) {
      return res.status(200).json({ success: true, url: fileObj.path || fileObj.url, message: 'Image uploaded successfully' });
    }

    // If buffer or local path, upload
    let uploaded;
    if (fileObj.buffer) uploaded = await uploadOnCloudinary(fileObj);
    else if (fileObj.path) uploaded = await uploadOnCloudinary(fileObj.path);

    if (!uploaded || !uploaded.url) throw new ApiError(500, 'Failed to upload image on Cloudinary');

    return res.status(200).json({ success: true, url: uploaded.url, message: 'Image uploaded successfully' });
  } catch (error) {
    console.error("Upload Blog Image Error:", error);
    return res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode || 500, error.message || "Internal Server Error"));
  }
};