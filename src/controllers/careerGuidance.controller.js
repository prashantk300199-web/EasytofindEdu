import careerGuidanceService from "../services/CareerGuidance.service.js";
import recommendationEngine from "../services/recommendationEngine.service.js";
import careerTreeBuilder from "../services/careerTreeBuilder.service.js";
import Student from "../models/Students.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const logger = {
  info: (msg, data = {}) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, data),
  error: (msg, error = {}) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, error),
};

// ============= PUBLIC CONTROLLERS =============

/**
 * GET /api/v1/career-guidance/questions
 * Fetch all active questionnaire questions
 */
export const getQuestionnaire = asyncHandler(async (req, res) => {
  const { category } = req.query;

  const questions = await careerGuidanceService.getAllActiveQuestions(category);

  res.status(200).json(
    new ApiResponse(200, questions, "Questions retrieved successfully")
  );
});

/**
 * GET /api/v1/career-guidance/featured-courses
 * Fetch featured courses for homepage
 */
export const getFeaturedCourses = asyncHandler(async (req, res) => {
  const courses = await careerGuidanceService.getFeaturedCourses();

  res.status(200).json(
    new ApiResponse(200, courses, "Featured courses retrieved successfully")
  );
});

/**
 * GET /api/v1/career-guidance/search
 * Search courses with filters
 */
export const searchCourses = asyncHandler(async (req, res) => {
  const {
    query,
    qualification,
    stream,
    nodeType,
    page = 1,
    limit = 20,
  } = req.query;

  const filters = {
    query,
    qualification,
    stream,
    nodeType,
  };

  const result = await careerGuidanceService.searchCourses(
    filters,
    parseInt(page),
    parseInt(limit)
  );

  res.status(200).json(
    new ApiResponse(200, result, "Courses searched successfully")
  );
});

/**
 * GET /api/v1/career-guidance/course/:id
 * Get detailed information about a specific course
 */
export const getCourseDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const course = await careerGuidanceService.getCourseDetails(id);

  res.status(200).json(
    new ApiResponse(200, course, "Course details retrieved successfully")
  );
});

/**
 * POST /api/v1/career-guidance/submit-answers
 * Submit questionnaire answers (logged in or not)
 */
export const submitAnswers = asyncHandler(async (req, res) => {
  const { answers } = req.body;
  const isLoggedIn = !!req.user;

  let result = { message: "Answers received" };

  // If logged in, save to profile and update lastQualification
  if (isLoggedIn) {
    const profile = await careerGuidanceService.submitQuestionnaires(
      req.user._id,
      answers
    );

    // Update student's lastQualification
    if (answers.qualification) {
      await Student.findByIdAndUpdate(req.user._id, {
        lastQualification: answers.qualification,
      });
    }

    result = profile;
  }

  res.status(200).json(
    new ApiResponse(200, result, "Answers submitted successfully")
  );
});

// ============= PROTECTED STUDENT CONTROLLERS =============

/**
 * GET /api/v1/career-guidance/recommendations
 * Get personalized recommendations based on questionnaire
 */
export const getRecommendations = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const recommendations = await recommendationEngine.generateRecommendations(
    req.user._id,
    parseInt(limit)
  );

  res.status(200).json(
    new ApiResponse(200, recommendations, "Recommendations generated successfully")
  );
});

/**
 * GET /api/v1/career-guidance/path/:nodeId/next
 * Get next possible paths after this course
 */
export const getNextPaths = asyncHandler(async (req, res) => {
  const { nodeId } = req.params;

  const nextPaths = await recommendationEngine.getNextPaths(nodeId);

  res.status(200).json(
    new ApiResponse(200, nextPaths, "Next paths retrieved successfully")
  );
});

/**
 * GET /api/v1/career-guidance/path/:nodeId/prerequisites
 * Get prerequisite paths for this course
 */
export const getPrerequisites = asyncHandler(async (req, res) => {
  const { nodeId } = req.params;

  const prerequisites = await recommendationEngine.getPrerequisitePaths(nodeId);

  res.status(200).json(
    new ApiResponse(200, prerequisites, "Prerequisites retrieved successfully")
  );
});

/**
 * POST /api/v1/career-guidance/save-path
 * Save a career path to student's profile
 */
export const savePath = asyncHandler(async (req, res) => {
  const { nodeId, status, notes } = req.body;

  const profile = await careerGuidanceService.saveCareerPath(
    req.user._id,
    nodeId,
    status,
    notes
  );

  res.status(200).json(
    new ApiResponse(200, profile, "Career path saved successfully")
  );
});

/**
 * GET /api/v1/career-guidance/my-paths
 * Get student's saved career paths
 */
export const getSavedPaths = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const result = await careerGuidanceService.getSavedPaths(
    req.user._id,
    parseInt(page),
    parseInt(limit)
  );

  res.status(200).json(
    new ApiResponse(200, result, "Saved paths retrieved successfully")
  );
});

/**
 * GET /api/v1/career-guidance/my-profile
 * Get student's career guidance profile
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await careerGuidanceService.getStudentProfile(req.user._id);

  res.status(200).json(
    new ApiResponse(200, profile, "Profile retrieved successfully")
  );
});

// ============= BROWSE & EXPLORE =============

/**
 * GET /api/v1/career-guidance/nodes
 * Browse/search career nodes with filters
 */
export const getNodes = asyncHandler(async (req, res) => {
  const {
    query,
    qualification,
    stream,
    nodeType,
    difficulty,
    minDuration,
    maxDuration,
    sortBy = 'popularity',
    page = 1,
    limit = 20,
  } = req.query;

  const filter = { status: 'active' };

  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { keywords: { $regex: query, $options: 'i' } },
      { tags: { $regex: query, $options: 'i' } },
    ];
  }
  if (qualification) filter.applicableQualifications = qualification;
  if (stream) filter.applicableStreams = { $in: Array.isArray(stream) ? stream : [stream] };
  if (nodeType) filter.nodeType = nodeType;
  if (difficulty) filter.difficultyLevel = difficulty;

  if (minDuration || maxDuration) {
    filter['duration.value'] = {};
    if (minDuration) filter['duration.value'].$gte = parseInt(minDuration);
    if (maxDuration) filter['duration.value'].$lte = parseInt(maxDuration);
  }

  let sort = { popularityScore: -1, createdAt: -1 };
  if (sortBy === 'popular') sort = { popularityScore: -1 };
  if (sortBy === 'quickest') sort = { 'duration.value': 1 };
  if (sortBy === 'newest') sort = { createdAt: -1 };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [nodes, total] = await Promise.all([
    CareerPathNode.find(filter)
      .select('title slug nodeType description thumbnail duration difficultyLevel level popularityScore tags')
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sort)
      .lean(),
    CareerPathNode.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      nodes,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
    }, 'Career nodes retrieved successfully')
  );
});

/**
 * GET /api/v1/career-guidance/nodes/:nodeId
 * Single career node with prerequisites and next steps
 */
export const getNodeDetail = asyncHandler(async (req, res) => {
  const { nodeId } = req.params;

  const node = await CareerPathNode.findById(nodeId)
    .populate('prerequisiteNodeIds', 'title slug nodeType difficultyLevel level duration thumbnail')
    .populate('nextNodeIds', 'title slug nodeType difficultyLevel level duration thumbnail')
    .lean();

  if (!node) throw new ApiError(404, 'Career not found');

  await CareerPathNode.updateOne({ _id: nodeId }, { $inc: { viewCount: 1 } });

  // Remove unsupported/unverified fields before returning to student
  const { cost, successMetrics, careerOutcomes, ...safeNode } = node;

  res.status(200).json(new ApiResponse(200, safeNode, 'Career detail retrieved'));
});

/**
 * GET /api/v1/career-guidance/roadmap/:nodeId
 * Personalized roadmap from student's current position to target career
 */
export const getRoadmap = asyncHandler(async (req, res) => {
  const { nodeId } = req.params;
  const isStudent = !!req.user;

  // Build the complete path from root level to target
  const pathNodes = [];
  const visited = new Set();

  const collectAncestors = async (id) => {
    if (visited.has(id.toString())) return;
    visited.add(id.toString());

    const ancestors = await CareerPathNode.find({
      nextNodeIds: id,
      status: 'active',
    }).select('_id').lean();

    for (const ancestor of ancestors) {
      await collectAncestors(ancestor._id);
    }
    pathNodes.push(id);
  };

  await collectAncestors(nodeId);

  if (!pathNodes.includes(nodeId)) pathNodes.push(nodeId);

  // Fetch all nodes in path
  const fullNodes = await CareerPathNode.find({
    _id: { $in: pathNodes },
    status: 'active',
  }).select('title slug nodeType description duration difficultyLevel level prerequisiteNodeIds nextNodeIds tags').lean();

  // Sort by level
  fullNodes.sort((a, b) => a.level - b.level);

  // Annotate with student status if logged in
  let annotatedNodes = fullNodes;

  if (isStudent) {
    const student = await Student.findById(req.user._id)
      .select('careerGuidance.savedPaths academicDetails.lastQualification')
      .lean();

    const savedMap = {};
    (student?.careerGuidance?.savedPaths || []).forEach((p) => {
      savedMap[p.nodeId.toString()] = p.status;
    });

    annotatedNodes = fullNodes.map((n) => ({
      ...n,
      pathStatus: savedMap[n._id.toString()] || null,
    }));
  }

  // Group by phase
  const PHASE_MAP = {
    qualification: 'Foundation',
    stream_choice: 'Foundation',
    entrance_exam: 'Foundation',
    course: 'Skills',
    specialization: 'Skills',
    professional_cert: 'Practice',
    career_path: 'Career Preparation',
  };

  const phases = ['Foundation', 'Skills', 'Practice', 'Projects', 'Portfolio', 'Experience', 'Career Preparation'];
  const roadmap = phases.map((phase) => ({
    phase,
    nodes: annotatedNodes.filter((n) => PHASE_MAP[n.nodeType] === phase),
  })).filter((p) => p.nodes.length > 0);

  res.status(200).json(new ApiResponse(200, {
    targetNodeId: nodeId,
    targetTitle: fullNodes.find((n) => n._id.toString() === nodeId)?.title,
    phases: roadmap,
    totalNodes: annotatedNodes.length,
  }, 'Roadmap generated'));
});

/**
 * GET /api/v1/career-guidance/career-areas
 * List top-level career area categories
 */
export const getCareerAreas = asyncHandler(async (req, res) => {
  // Try to derive areas from database
  const [nodeTypes, topTags] = await Promise.all([
    CareerPathNode.distinct('nodeType', { status: 'active' }),
    CareerPathNode.aggregate([
      { $match: { status: 'active' } },
      { $unwind: { path: '$tags', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 30 },
    ]),
  ]);

  // Map nodeType to human-readable areas
  const TYPE_LABELS = {
    qualification: 'Foundation',
    stream_choice: 'Stream Selection',
    entrance_exam: 'Entrance Exams',
    course: 'Degree Programs',
    specialization: 'Specializations',
    professional_cert: 'Certifications',
    career_path: 'Career Paths',
  };

  const AREA_MAPPING = {
    'Foundation': { icon: 'graduation-cap', color: '#C9A96A', description: 'Start with the right foundation — 10th, 12th, diploma decisions that shape everything ahead.' },
    'Technology': { icon: 'code', color: '#3B82F6', description: 'Software, AI, data science, and the digital careers driving the modern economy.' },
    'Engineering': { icon: 'cpu', color: '#8B5CF6', description: 'Civil, mechanical, electrical — build the infrastructure and systems of tomorrow.' },
    'Healthcare': { icon: 'heart-pulse', color: '#EF4444', description: 'Medicine, nursing, pharmacy, and allied health professions focused on human wellbeing.' },
    'Commerce Finance': { icon: 'trending-up', color: '#10B981', description: 'Accounting, banking, CA, CFA, and the world of money and markets.' },
    'Law': { icon: 'scale', color: '#92400E', description: 'Corporate law, criminal law, litigation, and the pursuit of justice.' },
    'Creative Arts': { icon: 'palette', color: '#EC4899', description: 'Design, animation, filmmaking, and every form of creative expression.' },
    'Business Management': { icon: 'briefcase', color: '#F59E0B', description: 'MBA, entrepreneurship, digital marketing, and leadership in organizations.' },
    'Research Academia': { icon: 'microscope', color: '#6366F1', description: 'PhD, teaching, scientific research, and pushing the boundaries of knowledge.' },
    'Public Service': { icon: 'landmark', color: '#0EA5E9', description: 'UPSC, state services, defence, police, and government careers that serve the nation.' },
  };

  const areas = [
    { id: 'technology', label: 'Technology', ...AREA_MAPPING['Technology'], tags: ['programming', 'software', 'data science', 'ai', 'ml', 'cybersecurity'] },
    { id: 'engineering', label: 'Engineering', ...AREA_MAPPING['Engineering'], tags: ['engineering', 'mechanical', 'civil', 'electrical'] },
    { id: 'healthcare', label: 'Healthcare', ...AREA_MAPPING['Healthcare'], tags: ['medical', 'nursing', 'pharmacy', 'healthcare'] },
    { id: 'commerce_finance', label: 'Commerce & Finance', ...AREA_MAPPING['Commerce Finance'], tags: ['commerce', 'finance', 'accounting', 'ca', 'banking'] },
    { id: 'law', label: 'Law', ...AREA_MAPPING['Law'], tags: ['law', 'legal', 'llb', 'llm'] },
    { id: 'creative', label: 'Creative Arts & Design', ...AREA_MAPPING['Creative Arts'], tags: ['design', 'animation', 'film', 'music', 'art'] },
    { id: 'business', label: 'Business & Management', ...AREA_MAPPING['Business Management'], tags: ['business', 'management', 'mba', 'entrepreneurship'] },
    { id: 'research', label: 'Research & Academia', ...AREA_MAPPING['Research Academia'], tags: ['research', 'phd', 'academia', 'science'] },
    { id: 'public_service', label: 'Public Service', ...AREA_MAPPING['Public Service'], tags: ['government', 'upsc', 'defence', 'civil services'] },
  ];

  res.status(200).json(new ApiResponse(200, { areas, total: areas.length }, 'Career areas retrieved'));
});

/**
 * POST /api/v1/career-guidance/i-dont-know
 * Conversational career area discovery — rules-based, no AI needed
 */
export const iDontKnow = asyncHandler(async (req, res) => {
  const { mbtiType, stressResponse, decisionStyle, socialPreference, creativityLevel, favoriteSubjects, favoriteActivities } = req.body;

  // Score each career area based on responses
  const scores = {
    technology: 0,
    engineering: 0,
    healthcare: 0,
    commerce_finance: 0,
    law: 0,
    creative: 0,
    business: 0,
    research: 0,
    public_service: 0,
  };

  // Stress response scoring
  if (stressResponse === 'solve_logically') { scores.technology += 3; scores.engineering += 3; scores.research += 2; }
  if (stressResponse === 'talk_to_people') { scores.business += 3; scores.public_service += 3; scores.healthcare += 2; }
  if (stressResponse === 'create_something') { scores.creative += 4; scores.healthcare += 2; }
  if (stressResponse === 'need_time_alone') { scores.research += 3; scores.technology += 3; }

  // Decision style scoring
  if (decisionStyle === 'facts_data') { scores.technology += 3; scores.engineering += 3; scores.commerce_finance += 2; }
  if (decisionStyle === 'gut_feeling') { scores.creative += 3; scores.business += 2; }
  if (decisionStyle === 'people_opinions') { scores.healthcare += 3; scores.public_service += 3; scores.business += 2; }
  if (decisionStyle === 'balanced') { scores.business += 2; scores.research += 2; }

  // Social preference scoring
  if (socialPreference === 'team') { scores.healthcare += 3; scores.business += 3; scores.engineering += 2; }
  if (socialPreference === 'independent') { scores.research += 3; scores.technology += 3; scores.creative += 2; }
  if (socialPreference === 'varied') { scores.creative += 2; scores.business += 2; }

  // Creativity level scoring
  if (creativityLevel === 'very_creative') { scores.creative += 5; scores.research += 3; }
  if (creativityLevel === 'somewhat_creative') { scores.business += 3; scores.engineering += 2; }
  if (creativityLevel === 'prefer_structured') { scores.engineering += 4; scores.healthcare += 3; scores.commerce_finance += 3; }

  // Favorite subjects scoring
  if (favoriteSubjects) {
    const subjects = Array.isArray(favoriteSubjects) ? favoriteSubjects : [favoriteSubjects];
    const mathScience = ['mathematics', 'maths', 'physics', 'chemistry'];
    const biology = ['biology', 'botany', 'zoology'];
    const commerce = ['accounts', 'economics', 'business', 'commerce'];
    const arts = ['history', 'geography', 'political science', 'psychology', 'sociology'];

    subjects.forEach((s) => {
      const lower = s.toLowerCase();
      if (mathScience.some((ms) => lower.includes(ms))) { scores.technology += 3; scores.engineering += 3; }
      if (biology.some((b) => lower.includes(b))) { scores.healthcare += 3; }
      if (commerce.some((c) => lower.includes(c))) { scores.commerce_finance += 3; scores.business += 2; }
      if (arts.some((a) => lower.includes(a))) { scores.law += 2; scores.public_service += 2; scores.research += 2; }
      if (lower.includes('art') || lower.includes('drawing') || lower.includes('design')) { scores.creative += 4; }
      if (lower.includes('computer') || lower.includes('coding')) { scores.technology += 4; }
    });
  }

  // Favorite activities scoring
  if (favoriteActivities) {
    const activities = Array.isArray(favoriteActivities) ? favoriteActivities : [favoriteActivities];
    activities.forEach((a) => {
      const lower = a.toLowerCase();
      if (lower.includes('coding') || lower.includes('programming')) { scores.technology += 4; }
      if (lower.includes('reading') || lower.includes('research')) { scores.research += 3; scores.law += 2; }
      if (lower.includes('helping') || lower.includes('caring')) { scores.healthcare += 4; scores.public_service += 2; }
      if (lower.includes('building') || lower.includes('fixing')) { scores.engineering += 3; }
      if (lower.includes('art') || lower.includes('music') || lower.includes('writing')) { scores.creative += 4; }
      if (lower.includes('money') || lower.includes('business')) { scores.commerce_finance += 3; scores.business += 2; }
      if (lower.includes('debate') || lower.includes('argument')) { scores.law += 4; }
      if (lower.includes('lead') || lower.includes('organize')) { scores.business += 3; scores.public_service += 2; }
      if (lower.includes('science')) { scores.research += 3; scores.healthcare += 2; }
    });
  }

  const ranked = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([areaId, score]) => {
      const REASONS = {
        technology: 'You enjoy solving problems logically and show interest in how systems work — technology careers reward exactly this mindset.',
        engineering: 'Your interest in applying science and math to practical problems points clearly toward engineering disciplines.',
        healthcare: 'A natural tendency to care for others and an interest in biological sciences makes healthcare a strong fit.',
        commerce_finance: 'Your comfort with numbers and interest in how money works suggests a natural aptitude for commerce careers.',
        law: 'Your analytical mindset and comfort with structured arguments make law a career worth exploring.',
        creative: 'Your creative instincts and desire for self-expression point toward careers where originality is the main asset.',
        business: 'Your leadership instincts and comfort with varied social situations suggest management and business suits you.',
        research: 'Your intellectual curiosity and preference for deep focus suggest a career in research or academia would be rewarding.',
        public_service: 'A sense of purpose and comfort in structured public institutions points toward civil service and government roles.',
      };

      const EXPERIMENTS = {
        technology: [
          { title: 'Try a free Python course on YouTube', detail: 'One weekend is enough to know if coding excites you.' },
          { title: 'Build a simple calculator in a day', detail: 'No prior experience needed — just follow a tutorial.' },
        ],
        engineering: [
          { title: 'Watch "How Things Work" videos', detail: 'Understand the physics behind everyday machines.' },
          { title: 'Try a basic AutoCAD or CAD tool', detail: 'See if drafting and design tools appeal to you.' },
        ],
        healthcare: [
          { title: 'Shadow a doctor or nurse for a day', detail: 'First-hand experience is the best reality check.' },
          { title: 'Take a first-aid course', detail: 'Basic skills reveal a lot about your comfort in medical settings.' },
        ],
        commerce_finance: [
          { title: 'Follow the stock market for two weeks', detail: 'See if financial news interests you or bores you.' },
          { title: 'Read an intro to accounting on Khan Academy', detail: 'Free and shows whether debits and credits make sense.' },
        ],
        law: [
          { title: 'Watch Supreme Court live hearings online', detail: 'Free. See what actual legal proceedings look like.' },
          { title: 'Debate a current topic with friends', detail: 'If you enjoy building arguments, law may suit you.' },
        ],
        creative: [
          { title: 'Finish one creative project this week', detail: 'Film, design, music, writing — anything that interests you.' },
          { title: 'Study a creator you admire closely', detail: 'Understand their process, not just their output.' },
        ],
        business: [
          { title: 'Start a small mock business plan', detail: 'No money needed — just see if the thinking appeals.' },
          { title: 'Read the story of one entrepreneur you admire', detail: 'Understand the reality behind the glamour.' },
        ],
        research: [
          { title: 'Read a research paper in a field you like', detail: 'arXiv and Google Scholar have thousands for free.' },
          { title: 'Approach a professor and ask about their research', detail: 'One conversation can clarify a lot.' },
        ],
        public_service: [
          { title: 'Read the UPSC syllabus outline', detail: "Understand the scale of what's needed before deciding." },
          { title: 'Take a current affairs quiz online', detail: 'See if staying informed about the world feels natural to you.' },
        ],
      };

      return {
        areaId,
        label: areaId.replace(/_/g, ' & ').replace(/\b\w/g, (c) => c.toUpperCase()),
        score,
        reason: REASONS[areaId] || '',
        experiments: EXPERIMENTS[areaId] || [],
      };
    });

  res.status(200).json(
    new ApiResponse(200, { suggestions: ranked, totalAnswered: Object.values(req.body).filter(Boolean).length }, 'Career suggestions generated')
  );
});

export default {
  getQuestionnaire,
  getFeaturedCourses,
  searchCourses,
  getCourseDetails,
  submitAnswers,
  getRecommendations,
  getNextPaths,
  getPrerequisites,
  savePath,
  getSavedPaths,
  getMyProfile,
  getNodes,
  getNodeDetail,
  getRoadmap,
  getCareerAreas,
  iDontKnow,
};