import Student from "../models/Students.js";
import CareerPathNode from "../models/CareerPathNode.js";
import CareerProgram from "../models/CareerProgram.js";
import College from "../models/College.js";
import EntranceExam from "../models/EntranceExam.js";
import Course from "../models/Course.js";

const logger = {
  info: (msg, data = {}) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, data),
  error: (msg, error = {}) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, error),
};

/**
 * Build a student context object for AI consumption.
 * Only includes safe, relevant fields — no sensitive data.
 */
export async function buildStudentContext(studentId) {
  try {
    const student = await Student.findById(studentId)
      .select(
        "name email lastQualification gender academicDetails preferredSubjects careerGuidance wishlist"
      )
      .lean();

    if (!student) {
      return { hasProfile: false, message: "Student profile not found." };
    }

    const cg = student.careerGuidance || {};
    const isProfileComplete = Boolean(
      cg.questionnaireCompletedAt || cg.isQuestionnaireCompleted
    );

    // Fetch saved career details
    let savedCareers = [];
    if (cg.savedPaths && cg.savedPaths.length > 0) {
      const careerIds = cg.savedPaths.map((p) => p.nodeId);
      savedCareers = await CareerPathNode.find({ _id: { $in: careerIds } })
        .select("title slug nodeType difficultyLevel duration tags")
        .lean();
    }

    // Fetch recommendations if profile complete
    let recommendations = [];
    if (isProfileComplete) {
      const topRecs = await CareerPathNode.find({ status: "active" })
        .select("title slug nodeType difficultyLevel tags popularityScore")
        .sort({ popularityScore: -1 })
        .limit(5)
        .lean();
      recommendations = topRecs;
    }

    const context = {
      hasProfile: isProfileComplete,
      basics: {
        name: student.name || "",
        educationLevel: student.lastQualification || "",
        gender: student.gender || "",
        board: student.academicDetails?.boardOrUniversity || "",
        school: student.academicDetails?.schoolName || "",
        percentage: student.academicDetails?.percentage || "",
        passingYear: student.academicDetails?.passingYear || "",
      },
      careerGuidance: {
        stream: cg.stream || "",
        interests: cg.preferences?.expertiseSubject
          ? [cg.preferences.expertiseSubject]
          : [],
        preferences: {
          relocation: cg.preferences?.relocationWilling || "",
          preferredCities: cg.preferences?.preferredCities || [],
          budget: cg.preferences?.financialCapacity || "",
          timeframe: cg.preferences?.timeframe || "",
          careerGoal: cg.preferences?.careerGoal || "",
        },
        questionnaireCompletedAt: cg.questionnaireCompletedAt
          ? new Date(cg.questionnaireCompletedAt).toLocaleDateString("en-IN")
          : null,
        isComplete: isProfileComplete,
      },
      savedCareers: savedCareers.map((c) => ({
        title: c.title,
        slug: c.slug,
        type: c.nodeType,
        difficulty: c.difficultyLevel,
        duration: c.duration?.value
          ? `${c.duration.value} ${c.duration.unit || "months"}`
          : null,
        tags: c.tags || [],
        savedPaths: cg.savedPaths
          ?.filter((p) => p.nodeId.toString() === c._id.toString())
          .map((p) => ({ status: p.status, savedAt: new Date(p.savedAt).toLocaleDateString("en-IN") })) || [],
      })),
      topRecommendations: recommendations.map((r) => ({
        title: r.title,
        slug: r.slug,
        type: r.nodeType,
        tags: r.tags || [],
      })),
      wishlistCount: student.wishlist?.length || 0,
    };

    logger.info("Student context built", {
      studentId,
      hasProfile: isProfileComplete,
      savedCareers: savedCareers.length,
    });

    return context;
  } catch (error) {
    logger.error("Error building student context", error);
    return {
      hasProfile: false,
      message: "Could not load student profile. Conversation will continue without personalization.",
      error: error.message,
    };
  }
}

/**
 * Fetch real data from database for grounding AI responses.
 */
export async function fetchCareerData(careerSlug) {
  try {
    const [node, programs] = await Promise.all([
      CareerPathNode.findOne({ $or: [{ slug: careerSlug }, { _id: careerSlug }], status: "active" })
        .select("title slug description overview nodeType eligibility duration tags difficultyLevel prerequisiteNodeIds nextNodeIds")
        .lean(),
      CareerProgram.find({ $or: [{ slug: careerSlug }, { title: { $regex: careerSlug, $options: "i" } }], status: "published" })
        .select("title slug category fees salary entranceExams topColleges duration")
        .limit(3)
        .lean(),
    ]);

    if (!node) return null;

    // Fetch prerequisite and next node titles
    let prerequisites = [];
    let nextSteps = [];
    if (node.prerequisiteNodeIds?.length > 0) {
      prerequisites = await CareerPathNode.find({ _id: { $in: node.prerequisiteNodeIds } })
        .select("title slug nodeType")
        .lean();
    }
    if (node.nextNodeIds?.length > 0) {
      nextSteps = await CareerPathNode.find({ _id: { $in: node.nextNodeIds } })
        .select("title slug nodeType")
        .lean();
    }

    return {
      node: {
        ...node,
        prerequisites: prerequisites.map((p) => ({ title: p.title, slug: p.slug, type: p.nodeType })),
        nextSteps: nextSteps.map((n) => ({ title: n.title, slug: n.slug, type: n.nodeType })),
      },
      programs: programs.map((p) => ({
        title: p.title,
        slug: p.slug,
        category: p.category,
        fees: p.fees,
        salary: p.salary,
        entranceExams: p.entranceExams,
        topColleges: p.topColleges,
      })),
    };
  } catch (error) {
    logger.error("Error fetching career data", error);
    return null;
  }
}

export async function fetchInstitutesForCareer(careerTitle, limit = 5) {
  try {
    const institutes = await Course.aggregate([
      { $match: { name: { $regex: careerTitle, $options: "i" } } },
      { $limit: limit },
      {
        $lookup: {
          from: "institutes",
          localField: "institute",
          foreignField: "_id",
          as: "instituteData",
        },
      },
      { $unwind: { path: "$instituteData", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          courseName: "$name",
          instituteName: "$instituteData.name",
          instituteLocation: "$instituteData.location.cityName",
          mode: 1,
        },
      },
    ]);
    return institutes;
  } catch (error) {
    logger.error("Error fetching institutes for career", error);
    return [];
  }
}

export async function fetchExamsForCareer(careerTitle, limit = 5) {
  try {
    const exams = await EntranceExam.find({
      $or: [
        { name: { $regex: careerTitle, $options: "i" } },
        { tags: { $regex: careerTitle, $options: "i" } },
      ],
      status: "published",
    })
      .select("name slug type eligibility applicationFee examDates difficultyLevel")
      .limit(limit)
      .lean();
    return exams.map((e) => ({
      name: e.name,
      slug: e.slug,
      type: e.type,
      eligibility: e.eligibility,
      applicationFee: e.applicationFee ? `₹${e.applicationFee}` : "N/A",
      nextExamDate: e.examDates?.[0]?.startDate
        ? new Date(e.examDates[0].startDate).toLocaleDateString("en-IN")
        : "Check official website",
      difficulty: e.difficultyLevel,
    }));
  } catch (error) {
    logger.error("Error fetching exams for career", error);
    return [];
  }
}

export async function searchColleges(query, limit = 5) {
  try {
    const colleges = await College.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { shortName: { $regex: query, $options: "i" } },
      ],
    })
      .select("name shortName collegeType location contact website rankings placements feeStructure")
      .limit(limit)
      .lean();
    return colleges.map((c) => ({
      name: c.name,
      shortName: c.shortName,
      type: c.collegeType,
      city: c.location?.city,
      website: c.contact?.website,
      nirfRank: c.rankings?.nirf,
    }));
  } catch (error) {
    logger.error("Error searching colleges", error);
    return [];
  }
}

export default {
  buildStudentContext,
  fetchCareerData,
  fetchInstitutesForCareer,
  fetchExamsForCareer,
  searchColleges,
};
