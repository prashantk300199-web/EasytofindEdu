import CGCareer from "../models/CGCareer.js";
import CGRule from "../models/CGRule.js";
import CGCourse from "../models/CGCourse.js";
import CGExam from "../models/CGExam.js";
import CGCollege from "../models/CGCollege.js";
import CGHostel from "../models/CGHostel.js";

// -- RECOMMENDATION ENGINE --
export const recommendCareer = async (req, res) => {
  try {
    const { stream, interest, strength, budget, location } = req.body;

    // 1. Find the best matching rule
    let rules = await CGRule.find({ stream, interest, strength }).populate("careerId");

    if (rules.length === 0) {
      rules = await CGRule.find({ stream, interest }).populate("careerId");
    }
    
    if (rules.length === 0) {
      rules = await CGRule.find({ stream }).populate("careerId");
    }

    if (rules.length === 0) {
       rules = await CGRule.find().populate("careerId").limit(1);
    }

    if (rules.length === 0) {
       return res.status(404).json({ success: false, message: "No career rules defined in system yet." });
    }

    const matchedRule = rules[0];
    const career = matchedRule.careerId;

    if (!career) {
       return res.status(404).json({ success: false, message: "Career not found for the matched rule." });
    }

    // 2. Get courses for this career
    const courses = await CGCourse.find({ careerId: career._id });
    const courseIds = courses.map(c => c._id);

    // 3. Get exams for these courses
    const exams = await CGExam.find({ courseId: { $in: courseIds } });

    // 4. Get colleges for these courses (filtered by location if provided)
    let collegeQuery = { courses: { $in: courseIds } };
    if (location) {
        collegeQuery.location = { $regex: new RegExp(location, "i") };
    }
    const colleges = await CGCollege.find(collegeQuery).populate("courses");

    // 5. Get hostels (filtered by location if provided)
    let hostelQuery = {};
    if (location) {
        hostelQuery.city = { $regex: new RegExp(location, "i") };
    }
    const hostels = await CGHostel.find(hostelQuery);

    res.status(200).json({
      success: true,
      data: {
        career: career.name,
        description: career.description,
        courses: courses,
        exams: exams,
        colleges: colleges,
        hostels: hostels
      }
    });

  } catch (error) {
    console.error("Recommend error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// --- CRUD Operations for Admin ---

export const getCareers = async (req, res) => {
  try {
    const data = await CGCareer.find();
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
export const createCareer = async (req, res) => {
  try {
    const data = await CGCareer.create(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
export const deleteCareer = async (req, res) => {
  try {
    await CGCareer.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getRules = async (req, res) => {
  try {
    const data = await CGRule.find().populate("careerId");
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
export const createRule = async (req, res) => {
  try {
    const data = await CGRule.create(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
export const deleteRule = async (req, res) => {
  try {
    await CGRule.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getCourses = async (req, res) => {
  try {
    const data = await CGCourse.find().populate("careerId");
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
export const createCourse = async (req, res) => {
  try {
    const data = await CGCourse.create(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
export const deleteCourse = async (req, res) => {
  try {
    await CGCourse.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getExams = async (req, res) => {
  try {
    const data = await CGExam.find().populate("courseId");
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
export const createExam = async (req, res) => {
  try {
    const data = await CGExam.create(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
export const deleteExam = async (req, res) => {
  try {
    await CGExam.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getColleges = async (req, res) => {
  try {
    const data = await CGCollege.find().populate("courses");
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
export const createCollege = async (req, res) => {
  try {
    const data = await CGCollege.create(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
export const deleteCollege = async (req, res) => {
  try {
    await CGCollege.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getHostels = async (req, res) => {
  try {
    const data = await CGHostel.find();
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
export const createHostel = async (req, res) => {
  try {
    const data = await CGHostel.create(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
export const deleteHostel = async (req, res) => {
  try {
    await CGHostel.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
