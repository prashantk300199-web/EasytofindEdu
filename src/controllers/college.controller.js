import CollegeProfile from "../models/college.model.js"; // 🔥 FIX: Using CollegeProfile to avoid model collision
import CollegeCourse from "../models/collegeCourse.model.js"; // Required for populate

// Helper to remove empty strings ("") so Mongoose doesn't fail on Number fields
const sanitizePayload = (obj) => {
  const cleaned = JSON.parse(JSON.stringify(obj));
  const removeEmpty = (o) => {
    Object.keys(o).forEach((k) => {
      if (o[k] === "") {
        delete o[k]; 
      } else if (typeof o[k] === "object" && o[k] !== null && !Array.isArray(o[k])) {
        removeEmpty(o[k]);
      }
    });
  };
  removeEmpty(cleaned);
  return cleaned;
};

// @desc    Create a new College profile
// @route   POST /api/v1/colleges
export const createCollege = async (req, res) => {
  try {
    const cleanData = sanitizePayload(req.body);
    const newCollege = await CollegeProfile.create(cleanData);
    
    res.status(201).json({ 
      success: true, 
      message: "College created successfully", 
      data: newCollege 
    });
  } catch (error) {
    console.error("CREATE ERROR:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all Colleges (with Search, Filter & Pagination)
// @route   GET /api/v1/colleges
export const getAllColleges = async (req, res) => {
  try {
    const { 
      search, 
      state, 
      collegeType, 
      ownershipType,
      page = 1, 
      limit = 10 
    } = req.query;

    let query = {};
    
    // Filters
    if (state) query["contact.address"] = { $regex: state, $options: "i" };
    if (collegeType) query.collegeType = collegeType;
    if (ownershipType) query.ownershipType = ownershipType;
    
    // Search by Name or Short Name
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { shortName: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (page - 1) * limit;

    const colleges = await CollegeProfile.find(query)
      .populate({
        path: "coursesOffered.course",
        model: "CollegeCourse", // 🔥 FORCE MONGOOSE TO FIND THIS MODEL
        select: "courseName degreeType stream specialization duration",
        strictPopulate: false   // 🔥 PREVENT CRASH IF ARRAY IS EMPTY OR SCHEMA MISMATCH
      })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await CollegeProfile.countDocuments(query);

    res.status(200).json({
      success: true,
      count: colleges.length,
      pagination: { 
        total, 
        currentPage: parseInt(page), 
        totalPages: Math.ceil(total / limit) 
      },
      data: colleges,
    });
  } catch (error) {
    console.error("GET ALL ERROR:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single College by ID (Deep Populate)
// @route   GET /api/v1/colleges/:id
export const getCollegeById = async (req, res) => {
  try {
    const college = await CollegeProfile.findById(req.params.id)
      .populate({
        path: "coursesOffered.course",
        model: "CollegeCourse", // 🔥 FORCE MONGOOSE TO FIND THIS MODEL
        strictPopulate: false   // 🔥 PREVENT CRASH
      });

    if (!college) {
      return res.status(404).json({ success: false, message: "College not found" });
    }

    res.status(200).json({ success: true, data: college });
  } catch (error) {
    console.error("GET BY ID ERROR:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Basic College Details
// @route   PUT /api/v1/colleges/:id
export const updateCollege = async (req, res) => {
  try {
    const cleanData = sanitizePayload(req.body);

    const college = await CollegeProfile.findByIdAndUpdate(
      req.params.id, 
      cleanData, 
      { new: true, runValidators: true }
    );
    
    if (!college) {
      return res.status(404).json({ success: false, message: "College not found" });
    }

    res.status(200).json({ 
      success: true, 
      message: "College updated successfully", 
      data: college 
    });
  } catch (error) {
    console.error("UPDATE ERROR:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete College
// @route   DELETE /api/v1/colleges/:id
export const deleteCollege = async (req, res) => {
  try {
    const college = await CollegeProfile.findByIdAndDelete(req.params.id);
    
    if (!college) {
      return res.status(404).json({ success: false, message: "College not found" });
    }

    res.status(200).json({ success: true, message: "College deleted successfully" });
  } catch (error) {
    console.error("DELETE ERROR:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── 🚀 COLLEGE-COURSE MAPPING FUNCTIONS ──

// @desc    Add a specific Course (with fees and cutoffs) to an existing College
// @route   POST /api/v1/colleges/:id/courses
export const addCourseToCollege = async (req, res) => {
  try {
    const { courseId, examsAccepted, fees, cutoffs } = req.body;

    const college = await CollegeProfile.findById(req.params.id);
    if (!college) {
      return res.status(404).json({ success: false, message: "College not found" });
    }

    const isAlreadyAdded = college.coursesOffered.find(
      (c) => c.course.toString() === courseId
    );

    if (isAlreadyAdded) {
      return res.status(400).json({ success: false, message: "This course is already mapped to the college." });
    }

    college.coursesOffered.push({
      course: courseId,
      examsAccepted,
      fees,
      cutoffs
    });

    await college.save();

    res.status(200).json({ 
      success: true, 
      message: "Course successfully mapped to the college", 
      data: college.coursesOffered 
    });
  } catch (error) {
    console.error("ADD COURSE ERROR:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove a specific Course from a College
// @route   DELETE /api/v1/colleges/:id/courses/:courseId
export const removeCourseFromCollege = async (req, res) => {
  try {
    const college = await CollegeProfile.findById(req.params.id);
    if (!college) {
      return res.status(404).json({ success: false, message: "College not found" });
    }

    college.coursesOffered = college.coursesOffered.filter(
      (c) => c.course.toString() !== req.params.courseId
    );

    await college.save();

    res.status(200).json({ 
      success: true, 
      message: "Course removed from the college successfully" 
    });
  } catch (error) {
    console.error("REMOVE COURSE ERROR:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};