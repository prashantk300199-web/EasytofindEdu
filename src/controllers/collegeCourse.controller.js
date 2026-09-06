import CollegeCourse from "../models/collegeCourse.model.js";

// @desc    Create a new master course
// @route   POST /api/v1/courses
export const createCourse = async (req, res) => {
  try {
    const newCourse = await CollegeCourse.create(req.body);

    res.status(201).json({
      success: true,
      message: "Master Course created successfully",
      data: newCourse,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all courses (with Search, Filtering & Pagination)
// @route   GET /api/v1/courses
export const getAllCourses = async (req, res) => {
  try {
    const { stream, degreeType, search, page = 1, limit = 10 } = req.query;

    // Building dynamic query
    let query = {};
    
    // Exact match filters
    if (stream) query.stream = stream;
    if (degreeType) query.degreeType = degreeType;
    
    // Search filter (Case-insensitive search on courseName or specialization)
    if (search) {
      query.$or = [
        { courseName: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (page - 1) * limit;

    // No populate needed since it's a global course without collegeId
    const courses = await CollegeCourse.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const totalCourses = await CollegeCourse.countDocuments(query);

    res.status(200).json({
      success: true,
      count: courses.length,
      pagination: {
        total: totalCourses,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCourses / limit),
      },
      data: courses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single course by ID
// @route   GET /api/v1/courses/:id
export const getCourseById = async (req, res) => {
  try {
    const course = await CollegeCourse.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a course
// @route   PUT /api/v1/courses/:id
export const updateCourse = async (req, res) => {
  try {
    const course = await CollegeCourse.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // new: true returns the updated document
    );

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: course,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a course
// @route   DELETE /api/v1/courses/:id
export const deleteCourse = async (req, res) => {
  try {
    const course = await CollegeCourse.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};