import mongoose from "mongoose";
import CareerGuidanceQuestion from "../models/CareerGuidanceQuestions.js";
import CareerPathNode from "../models/CareerPathNode.js";
import Admin from "../models/Admin.js";
import env from "../config/env.js";
import connectDB from "../config/db.js";
import slugify from "slugify";

const logger = {
  info: (msg, data = {}) => console.log(`[INFO] ${msg}`, data),
  error: (msg, error = {}) => console.error(`[ERROR] ${msg}`, error),
  success: (msg) => console.log(`✓ ${msg}`),
  warn: (msg) => console.warn(`⚠ ${msg}`),
};

// Get or create superadmin for seeding
const getAdminId = async () => {
  let admin = await Admin.findOne({ role: "superadmin" });

  if (!admin) {
    admin = new Admin({
      name: "Super Admin",
      email: "superadmin@vidyamarg.com",
      phone: "9999999999",
      password: "SuperAdmin@123",
      role: "superadmin",
      isActive: true,
    });
    await admin.save();
    logger.success("System admin created");
  }

  return admin._id;
};

// Clean up old data
const cleanupDatabase = async (force = false) => {
  try {
    const questionCount = await CareerGuidanceQuestion.countDocuments();
    const nodeCount = await CareerPathNode.countDocuments();

    if (questionCount === 0 && nodeCount === 0) {
      logger.info("Database is clean - no existing data");
      return;
    }

    if (!force) {
      logger.warn(`Found existing data: ${questionCount} questions, ${nodeCount} nodes`);
      logger.warn("Use --force flag to replace existing data");
      logger.warn("Example: node src/scripts/seedCareerGuidanceData.js --force");
      process.exit(0);
    }

    logger.info("Cleaning up old data...");

    // Delete old data
    const deleteQuestions = await CareerGuidanceQuestion.deleteMany({});
    const deleteNodes = await CareerPathNode.deleteMany({});

    logger.success(`Deleted ${deleteQuestions.deletedCount} old questions`);
    logger.success(`Deleted ${deleteNodes.deletedCount} old nodes`);
  } catch (error) {
    logger.error("Error during cleanup", error);
    throw error;
  }
};

// ============= QUESTIONNAIRE QUESTIONS DATA =============

const getQuestionsData = () => [
  {
    questionNumber: 1,
    questionText: "What is your highest educational qualification?",
    questionType: "dropdown",
    category: "qualification",
    isRequired: true,
    displayOrder: 1,
    helpText: "Select your current or completed qualification level",
    options: [
      { label: "Class 8th", value: "class_8th" },
      { label: "Class 10th", value: "class_10th" },
      { label: "Class 12th", value: "class_12th" },
      { label: "Diploma", value: "diploma" },
      { label: "Bachelor's Degree", value: "bachelor" },
      { label: "Master's Degree", value: "master" },
      { label: "PhD", value: "phd" },
    ],
    tags: ["education", "qualification", "level"],
  },

  {
    questionNumber: 2,
    questionText: "Which stream/subject area interests you most?",
    questionType: "dropdown",
    category: "stream",
    isRequired: false,
    displayOrder: 2,
    helpText: "Choose based on subjects you enjoyed in school or college",
    options: [
      { label: "Science (PCM - Physics, Chemistry, Math)", value: "pcm" },
      { label: "Science (PCB - Physics, Chemistry, Biology)", value: "pcb" },
      { label: "Commerce", value: "commerce" },
      { label: "Arts/Humanities", value: "arts" },
      { label: "Engineering", value: "engineering" },
      { label: "Medical", value: "medical" },
      { label: "Management", value: "management" },
      { label: "Law", value: "law" },
    ],
    tags: ["stream", "subject", "specialization"],
  },

  {
    questionNumber: 3,
    questionText: "Are you willing to relocate for better opportunities?",
    questionType: "single_select",
    category: "relocation",
    isRequired: false,
    displayOrder: 3,
    helpText: "Consider relocation for jobs or higher education",
    options: [
      { label: "Yes, definitely willing", value: "yes" },
      { label: "No, prefer to stay local", value: "no" },
      { label: "Maybe, depends on the opportunity", value: "maybe" },
    ],
    tags: ["relocation", "location", "mobility"],
  },

  {
    questionNumber: 4,
    questionText: "Which regions/cities are you interested in? (Select multiple)",
    questionType: "multi_select",
    category: "location",
    isRequired: false,
    displayOrder: 4,
    maxSelections: 5,
    helpText: "Select up to 5 cities where you'd like to study or work",
    options: [
      { label: "Delhi", value: "delhi" },
      { label: "Mumbai", value: "mumbai" },
      { label: "Bangalore", value: "bangalore" },
      { label: "Hyderabad", value: "hyderabad" },
      { label: "Chennai", value: "chennai" },
      { label: "Kolkata", value: "kolkata" },
      { label: "Pune", value: "pune" },
      { label: "Ahmedabad", value: "ahmedabad" },
      { label: "Jaipur", value: "jaipur" },
      { label: "Chandigarh", value: "chandigarh" },
    ],
    tags: ["location", "city", "region"],
  },

  {
    questionNumber: 5,
    questionText: "What is your family's annual financial capacity?",
    questionType: "single_select",
    category: "finance",
    isRequired: false,
    displayOrder: 5,
    helpText: "This helps us suggest courses within your budget",
    options: [
      { label: "Up to 3 lakhs per year", value: "low", description: "₹0-3 LPA" },
      { label: "3-5 lakhs per year", value: "lower_middle", description: "₹3-5 LPA" },
      { label: "5-7 lakhs per year", value: "middle", description: "₹5-7 LPA" },
      { label: "7-10 lakhs per year", value: "upper_middle", description: "₹7-10 LPA" },
      { label: "10+ lakhs per year", value: "high", description: "₹10+ LPA" },
    ],
    tags: ["finance", "budget", "affordability"],
  },

  {
    questionNumber: 6,
    questionText: "How much time do you have before you need to start a job/career?",
    questionType: "single_select",
    category: "timeframe",
    isRequired: false,
    displayOrder: 6,
    helpText: "This determines if you should pursue quick courses or longer programs",
    options: [
      { label: "Less than 6 months", value: "immediate", description: "Quick courses/certifications" },
      { label: "6-12 months", value: "short_term", description: "Short programs/diplomas" },
      { label: "1-2 years", value: "medium_term", description: "Regular programs" },
      { label: "2+ years", value: "long_term", description: "Degree/Master's programs" },
    ],
    tags: ["timeline", "timeframe", "urgency"],
  },

  {
    questionNumber: 7,
    questionText: "What is your career goal/aspiration?",
    questionType: "text_input",
    category: "career_goal",
    isRequired: false,
    displayOrder: 7,
    helpText: "e.g., Become a Software Engineer, Doctor, CA, Teacher, etc.",
    placeholder: "Enter your career aspiration",
    tags: ["career", "aspiration", "goal"],
  },

  {
    questionNumber: 8,
    questionText: "In which subject area do you have expertise/interest?",
    questionType: "dropdown",
    category: "expertise",
    isRequired: false,
    displayOrder: 8,
    helpText: "Choose your strongest/favorite subject area",
    options: [
      { label: "Mathematics", value: "mathematics" },
      { label: "Physics", value: "physics" },
      { label: "Chemistry", value: "chemistry" },
      { label: "Biology", value: "biology" },
      { label: "Computer Science", value: "computer_science" },
      { label: "Economics", value: "economics" },
      { label: "Commerce", value: "commerce_subject" }, // Different value to avoid conflict
      { label: "History", value: "history" },
      { label: "English", value: "english" },
      { label: "Languages", value: "languages" },
    ],
    tags: ["expertise", "subject", "strength"],
  },
];

// ============= CAREER PATH NODES DATA =============

const getNodesData = () => [
  // ========== LEVEL 1: QUALIFICATIONS ==========
  {
    title: "Class 8th (Secondary)",
    nodeType: "qualification",
    level: 1,
    description: "Middle school education (8th standard)",
    overview: "Class 8th marks the transition from primary to secondary education. At this level, students begin studying specialized subjects like Science, Mathematics, and Social Studies. This foundation is crucial for choosing streams in higher classes.",
    duration: { value: 1, unit: "years" },
    cost: { min: 0, max: 0, average: 0, currency: "INR", frequency: "per-year" },
    applicableQualifications: [],
    eligibility: {
      otherRequirements: "Passed Class 7th",
    },
    isFeatured: false,
    status: "active",
  },

  {
    title: "Class 10th (CBSE/State Board)",
    nodeType: "qualification",
    level: 1,
    description: "High school board certification",
    overview: "Class 10th is a crucial milestone in Indian education. Students take board exams in all major subjects. After 10th, students choose their streams (Science, Commerce, or Arts) for higher studies. This is the foundation for competitive entrance exams.",
    duration: { value: 2, unit: "years" },
    cost: { min: 0, max: 100000, average: 50000, currency: "INR", frequency: "per-year" },
    applicableQualifications: ["class_8th"],
    successMetrics: {
      passRate: 90,
    },
    isFeatured: false,
    status: "active",
  },

  {
    title: "Class 12th Science (PCM)",
    nodeType: "stream_choice",
    level: 2,
    description: "Higher secondary with Physics, Chemistry, Mathematics",
    overview: "Class 12th Science (PCM) is for students interested in engineering, mathematics, and technology fields. This stream provides strong foundation in Physics, Chemistry, and Mathematics - the core subjects for engineering and technology careers.",
    duration: { value: 2, unit: "years" },
    cost: { min: 50000, max: 300000, average: 150000, currency: "INR", frequency: "per-year" },
    applicableQualifications: ["class_10th"],
    applicableStreams: ["pcm"],
    eligibility: {
      minPercentage: 50,
      otherRequirements: "Math and Science in 10th",
    },
    syllabus: {
      description: "Core STEM subjects",
      topics: [
        "Physics (Mechanics, Thermodynamics, Optics, Electromagnetism)",
        "Chemistry (Organic, Inorganic, Physical)",
        "Mathematics (Calculus, Algebra, Trigonometry, Vectors)",
      ],
    },
    successMetrics: {
      passRate: 85,
    },
    isFeatured: true,
    status: "active",
  },

  {
    title: "Class 12th Science (PCB)",
    nodeType: "stream_choice",
    level: 2,
    description: "Higher secondary with Physics, Chemistry, Biology",
    overview: "Class 12th Science (PCB) is designed for students aspiring for medical, paramedical, or life sciences careers. It provides comprehensive knowledge in Physics, Chemistry, and Biology with special emphasis on biological systems and chemistry applications in medicine.",
    duration: { value: 2, unit: "years" },
    cost: { min: 50000, max: 300000, average: 150000, currency: "INR", frequency: "per-year" },
    applicableQualifications: ["class_10th"],
    applicableStreams: ["pcb", "medical"],
    eligibility: {
      minPercentage: 50,
      otherRequirements: "Science in 10th",
    },
    syllabus: {
      description: "Biology-focused STEM curriculum",
      topics: [
        "Physics (for medical understanding)",
        "Chemistry (Organic & Biochemistry emphasis)",
        "Biology (Botany, Zoology, Physiology, Anatomy)",
      ],
    },
    successMetrics: {
      passRate: 88,
    },
    isFeatured: true,
    status: "active",
  },

  {
    title: "Class 12th Commerce",
    nodeType: "stream_choice",
    level: 2,
    description: "Higher secondary focusing on business and economics",
    overview: "Commerce stream in Class 12th prepares students for business, finance, and accounting careers. It covers subjects like Accountancy, Business Studies, and Economics. Ideal for students interested in CA, CS, MBA, or banking careers.",
    duration: { value: 2, unit: "years" },
    cost: { min: 30000, max: 200000, average: 100000, currency: "INR", frequency: "per-year" },
    applicableQualifications: ["class_10th"],
    applicableStreams: ["commerce"],
    eligibility: {
      minPercentage: 45,
    },
    syllabus: {
      description: "Business and economics focused curriculum",
      topics: [
        "Accountancy (Financial Accounting, Cost Accounting)",
        "Business Studies (Entrepreneurship, Organization, Management)",
        "Economics (Micro & Macro Economics)",
      ],
    },
    successMetrics: {
      passRate: 92,
    },
    isFeatured: true,
    status: "active",
  },

  // ========== LEVEL 3: ENTRANCE EXAMS ==========
  {
    title: "JEE Main",
    nodeType: "entrance_exam",
    level: 3,
    description: "National entrance exam for engineering colleges",
    overview: "JEE (Joint Entrance Examination) Main is the gateway to NITs, IIITs, and other top engineering colleges in India. Conducted by NTA, it's one of the most competitive exams with over 1 million candidates annually. Score determines engineering college admission.",
    duration: { value: 1, unit: "years" },
    cost: { min: 100000, max: 500000, average: 300000, currency: "INR", frequency: "per-year" },
    applicableQualifications: ["class_12th"],
    applicableStreams: ["pcm", "engineering"],
    eligibility: {
      minPercentage: 75,
      otherRequirements: "Must have Math and Physics in 12th",
    },
    syllabus: {
      description: "Advanced Physics, Chemistry, Mathematics",
      topics: [
        "Physics: Mechanics, Heat and Thermodynamics, Electrostatics, Current Electricity, Magnetic Effects, EMI, Optics, Modern Physics",
        "Chemistry: Atomic Structure, Bonding, Redox, Acids-Bases, Solutions, Thermodynamics, Equilibrium, Kinetics, Electrochemistry, Organic Chemistry",
        "Mathematics: Trigonometry, Calculus, Algebra, Coordinate Geometry, Vectors",
      ],
      totalTopics: 40,
    },
    successMetrics: {
      successRate: 15,
      passRate: 25,
      averagePackage: 1200000,
    },
    topInstitutions: [
      { name: "IIT Bombay", ranking: 1, cutoff: 98, location: "Mumbai" },
      { name: "IIT Delhi", ranking: 2, cutoff: 98, location: "Delhi" },
      { name: "IIT Kanpur", ranking: 3, cutoff: 97, location: "Kanpur" },
      { name: "NIT Trichy", ranking: 20, cutoff: 93, location: "Trichy" },
    ],
    careerOutcomes: [
      {
        role: "Software Engineer",
        avgSalaryMin: 1000000,
        avgSalaryMax: 3000000,
        currency: "INR",
        industryDemand: "very_high",
        companies: ["Google", "Amazon", "Microsoft", "Goldman Sachs"],
      },
      {
        role: "Hardware Engineer",
        avgSalaryMin: 900000,
        avgSalaryMax: 2500000,
        currency: "INR",
        industryDemand: "high",
      },
    ],
    difficultyLevel: "hard",
    isFeatured: true,
    status: "active",
  },

  {
    title: "JEE Advanced",
    nodeType: "entrance_exam",
    level: 4,
    description: "Top-tier engineering exam for IITs",
    overview: "JEE Advanced is for top 2.5 lakh JEE Main qualifiers. This is the most competitive exam in India for engineering, with direct admission to all 23 IITs. Only ~1.5 lakh candidates take JEE Advanced, and success rate is 15-20%.",
    duration: { value: 2, unit: "months" },
    cost: { min: 50000, max: 300000, average: 200000, currency: "INR", frequency: "one-time" },
    applicableQualifications: ["class_12th"],
    applicableStreams: ["pcm"],
    eligibility: {
      minPercentage: 90,
      otherRequirements: "Top 2.5 lakh JEE Main qualifiers",
    },
    syllabus: {
      description: "Advanced engineering mathematics and sciences",
      topics: [
        "Advanced Physics: Quantum mechanics concepts, Nuclear physics, Particle physics",
        "Advanced Chemistry: Complex organic reactions, Electrochemistry advanced topics",
        "Advanced Mathematics: Complex calculus, differential equations, matrices",
      ],
      totalTopics: 50,
    },
    successMetrics: {
      successRate: 18,
      passRate: 20,
      averagePackage: 1500000,
      highestPackage: 5000000,
    },
    topInstitutions: [
      { name: "IIT Bombay", ranking: 1, cutoff: 99.5, location: "Mumbai" },
      { name: "IIT Delhi", ranking: 2, cutoff: 99.4, location: "Delhi" },
      { name: "IIT Madras", ranking: 3, cutoff: 99.3, location: "Chennai" },
    ],
    difficultyLevel: "very_hard",
    isFeatured: true,
    status: "active",
  },

  {
    title: "NEET UG",
    nodeType: "entrance_exam",
    level: 3,
    description: "National medical entrance exam",
    overview: "NEET is the single entrance examination for admission to medical and dental colleges across India. Conducted by NTA, it's attempted by over 2 million candidates annually. NEET score determines admission to MBBS, BDS, and AYUSH courses.",
    duration: { value: 1, unit: "years" },
    cost: { min: 80000, max: 400000, average: 250000, currency: "INR", frequency: "per-year" },
    applicableQualifications: ["class_12th"],
    applicableStreams: ["pcb", "medical"],
    eligibility: {
      minPercentage: 50,
      otherRequirements: "Physics, Chemistry, Biology in 12th",
    },
    syllabus: {
      description: "Physics, Chemistry, Biology at 11th-12th level",
      topics: [
        "Physics: Mechanics, Waves, Optics, Electricity, Magnetism, Thermodynamics, Modern Physics",
        "Chemistry: General, Organic, Inorganic, Physical Chemistry",
        "Biology: Human Physiology, Plant Physiology, Genetics, Ecology, Botany, Zoology",
      ],
      totalTopics: 38,
    },
    successMetrics: {
      successRate: 12,
      passRate: 20,
      averagePackage: 500000,
      placementRate: 95,
    },
    topInstitutions: [
      { name: "AIIMS Delhi", ranking: 1, cutoff: 99, location: "Delhi" },
      { name: "AIIMS Mumbai", ranking: 2, cutoff: 98, location: "Mumbai" },
      { name: "Armed Forces Medical College", ranking: 3, cutoff: 97, location: "Pune" },
    ],
    careerOutcomes: [
      {
        role: "Doctor (MBBS Graduate)",
        avgSalaryMin: 400000,
        avgSalaryMax: 2000000,
        currency: "INR",
        industryDemand: "high",
        companies: ["Apollo Hospitals", "Max Healthcare", "Fortis"],
      },
    ],
    difficultyLevel: "very_hard",
    isFeatured: true,
    status: "active",
  },

  // ========== LEVEL 4: UNDERGRADUATE PROGRAMS ==========
  {
    title: "B.Tech (Computer Science Engineering)",
    nodeType: "course",
    level: 4,
    description: "4-year undergraduate degree in CSE",
    overview: "B.Tech in Computer Science is the most sought undergraduate degree in India. Covers programming, data structures, algorithms, web development, databases, and AI/ML. Graduates have excellent placement opportunities with high salaries.",
    duration: { value: 4, unit: "years" },
    cost: { min: 400000, max: 1200000, average: 800000, currency: "INR", frequency: "per-year" },
    applicableQualifications: ["class_12th"],
    applicableStreams: ["pcm", "engineering"],
    applicableFinancialCategories: ["middle", "upper_middle", "high"],
    eligibility: {
      minPercentage: 60,
      otherRequirements: "JEE Main/Advanced score or direct admission based on 12th marks",
    },
    syllabus: {
      description: "Comprehensive CS curriculum",
      topics: [
        "Year 1: Programming, Physics, Chemistry, Mathematics, Engineering Drawing",
        "Year 2: Data Structures, Algorithms, Digital Logic, Web Technologies",
        "Year 3: Database Management, Operating Systems, Computer Networks, Microprocessors",
        "Year 4: Machine Learning, AI, Cloud Computing, Cybersecurity, Capstone Project",
      ],
      totalTopics: 60,
    },
    successMetrics: {
      successRate: 85,
      passRate: 90,
      placementRate: 95,
      averagePackage: 1200000,
      highestPackage: 5000000,
    },
    topInstitutions: [
      { name: "IIT Bombay - CSE", ranking: 1, location: "Mumbai" },
      { name: "IIT Delhi - CSE", ranking: 2, location: "Delhi" },
      { name: "NIT Trichy - CSE", ranking: 20, location: "Trichy" },
    ],
    careerOutcomes: [
      {
        role: "Software Developer",
        avgSalaryMin: 800000,
        avgSalaryMax: 3000000,
        currency: "INR",
        industryDemand: "very_high",
        companies: ["Google", "Amazon", "Microsoft", "Adobe", "Goldman Sachs"],
      },
      {
        role: "Data Scientist",
        avgSalaryMin: 900000,
        avgSalaryMax: 3500000,
        currency: "INR",
        industryDemand: "very_high",
      },
    ],
    difficultyLevel: "hard",
    isFeatured: true,
    status: "active",
  },

  {
    title: "MBBS",
    nodeType: "course",
    level: 4,
    description: "5.5-year medical degree program",
    overview: "MBBS is the basic medical degree required to practice medicine in India. It involves 4 years of coursework and 1.5 years of internship. Comprehensive training in human anatomy, physiology, pharmacology, and pathology. Graduates can work as doctors in hospitals, clinics, or research.",
    duration: { value: 5.5, unit: "years" },
    cost: { min: 800000, max: 3000000, average: 1500000, currency: "INR", frequency: "per-year" },
    applicableQualifications: ["class_12th"],
    applicableStreams: ["pcb", "medical"],
    applicableFinancialCategories: ["upper_middle", "high"],
    eligibility: {
      minPercentage: 50,
      otherRequirements: "NEET qualification with high score",
    },
    syllabus: {
      description: "Medical sciences and clinical training",
      topics: [
        "Year 1: Human Anatomy, Physiology, Biochemistry",
        "Year 2: Pharmacology, Pathology, Microbiology",
        "Year 3-4: Internal Medicine, Surgery, Pediatrics, Obstetrics, Psychiatry",
        "Internship: Hands-on clinical training",
      ],
      totalTopics: 40,
    },
    successMetrics: {
      passRate: 85,
      placementRate: 100,
      averagePackage: 400000,
      highestPackage: 1200000,
    },
    topInstitutions: [
      { name: "AIIMS Delhi", ranking: 1, location: "Delhi" },
      { name: "Christian Medical College, Vellore", ranking: 5, location: "Vellore" },
    ],
    careerOutcomes: [
      {
        role: "Medical Doctor",
        avgSalaryMin: 400000,
        avgSalaryMax: 2000000,
        currency: "INR",
        industryDemand: "high",
        companies: ["Apollo Hospitals", "Max Healthcare", "Fortis Hospitals"],
      },
    ],
    difficultyLevel: "very_hard",
    isFeatured: true,
    status: "active",
  },

  {
    title: "B.Com",
    nodeType: "course",
    level: 4,
    description: "3-year commerce graduation",
    overview: "B.Com is a foundational degree for accounting, finance, and business careers. Covers accountancy, business law, economics, taxation, auditing, and management. Essential for pursuing CA, CS, or MBA. Gateway to finance sector careers.",
    duration: { value: 3, unit: "years" },
    cost: { min: 100000, max: 500000, average: 300000, currency: "INR", frequency: "per-year" },
    applicableQualifications: ["class_12th"],
    applicableStreams: ["commerce"],
    applicableFinancialCategories: ["low", "lower_middle", "middle", "upper_middle", "high"],
    eligibility: {
      minPercentage: 40,
      otherRequirements: "Commerce stream or equivalent in 12th",
    },
    syllabus: {
      description: "Accounting and business principles",
      topics: [
        "Financial Accounting",
        "Cost Accounting",
        "Business Law",
        "Economics",
        "Business Management",
        "Taxation",
        "Auditing",
        "Corporate Finance",
      ],
      totalTopics: 25,
    },
    successMetrics: {
      passRate: 92,
      placementRate: 80,
      averagePackage: 300000,
      highestPackage: 1000000,
    },
    careerOutcomes: [
      {
        role: "Chartered Accountant (CA)",
        avgSalaryMin: 500000,
        avgSalaryMax: 2000000,
        currency: "INR",
        industryDemand: "high",
      },
      {
        role: "Financial Analyst",
        avgSalaryMin: 400000,
        avgSalaryMax: 1500000,
        currency: "INR",
        industryDemand: "high",
      },
    ],
    isFeatured: true,
    status: "active",
  },

  // ========== LEVEL 5: PROFESSIONAL CERTIFICATIONS ==========
  {
    title: "CA (Chartered Accountant)",
    nodeType: "professional_cert",
    level: 5,
    description: "Professional certification for accountants and auditors",
    overview: "CA is one of India's most prestigious professional certifications. Conducted by ICAI (Institute of Chartered Accountants of India), it requires 4.5 years including articleship. CAs can audit company accounts, provide tax advice, and establish practice.",
    duration: { value: 4.5, unit: "years" },
    cost: { min: 200000, max: 800000, average: 500000, currency: "INR", frequency: "per-year" },
    applicableQualifications: ["bachelor"],
    applicableStreams: ["commerce"],
    applicableFinancialCategories: ["middle", "upper_middle", "high"],
    eligibility: {
      otherRequirements: "B.Com or equivalent degree, pass 12th standard",
    },
    syllabus: {
      description: "CA curriculum through ICAI",
      topics: [
        "Foundation Course (4 months)",
        "Intermediate Course (8 months)",
        "Final Course (8 months)",
        "Articleship Training (3 years)",
      ],
      totalTopics: 50,
    },
    successMetrics: {
      passRate: 40,
      placementRate: 100,
      averagePackage: 700000,
      highestPackage: 3000000,
    },
    careerOutcomes: [
      {
        role: "Chartered Accountant (Practice)",
        avgSalaryMin: 500000,
        avgSalaryMax: 3000000,
        currency: "INR",
        industryDemand: "high",
      },
      {
        role: "Corporate Accountant",
        avgSalaryMin: 600000,
        avgSalaryMax: 2000000,
        currency: "INR",
        industryDemand: "high",
      },
    ],
    difficultyLevel: "hard",
    isFeatured: true,
    status: "active",
  },

  {
    title: "GATE",
    nodeType: "entrance_exam",
    level: 5,
    description: "Entrance exam for M.Tech and PSU recruitment",
    overview: "GATE is conducted for admission to M.Tech programs in top universities and recruitment by Public Sector Undertakings. Valid for 3 years, GATE score is also recognized abroad. Essential for students wanting to pursue higher studies or PSU jobs.",
    duration: { value: 6, unit: "months" },
    cost: { min: 50000, max: 200000, average: 100000, currency: "INR", frequency: "per-year" },
    applicableQualifications: ["bachelor"],
    applicableStreams: ["pcm", "engineering"],
    eligibility: {
      otherRequirements: "Bachelor's degree in engineering or equivalent",
    },
    syllabus: {
      description: "Engineering fundamentals and specialization topics",
      topics: [
        "Mathematics, Aptitude, Technical subjects",
        "CS: DSA, Algorithms, OS, DBMS, Networks",
        "ECE: Signals, Circuits, Digital systems, Communications",
      ],
      totalTopics: 40,
    },
    successMetrics: {
      successRate: 15,
      passRate: 20,
      averagePackage: 800000,
    },
    topInstitutions: [
      { name: "IIT Bombay - M.Tech", ranking: 1, location: "Mumbai" },
      { name: "IIT Delhi - M.Tech", ranking: 2, location: "Delhi" },
    ],
    difficultyLevel: "hard",
    isFeatured: true,
    status: "active",
  },

  // ========== LEVEL 5: POSTGRADUATE PROGRAMS ==========
  {
    title: "M.Tech",
    nodeType: "course",
    level: 5,
    description: "2-year postgraduate engineering degree",
    overview: "M.Tech is a specialized 2-year postgraduate program offering advanced knowledge in specific engineering domains. Higher salary prospects, research opportunities, and career advancement. Essential for teaching and R&D roles in tech companies.",
    duration: { value: 2, unit: "years" },
    cost: { min: 300000, max: 1200000, average: 700000, currency: "INR", frequency: "per-year" },
    applicableQualifications: ["bachelor"],
    applicableStreams: ["engineering"],
    applicableFinancialCategories: ["middle", "upper_middle", "high"],
    eligibility: {
      otherRequirements: "B.Tech degree, GATE qualification",
    },
    syllabus: {
      description: "Advanced engineering specializations",
      topics: [
        "Advanced Data Structures & Algorithms",
        "Machine Learning & AI",
        "Cloud Computing",
        "Cybersecurity",
        "Research Project",
      ],
      totalTopics: 30,
    },
    successMetrics: {
      passRate: 95,
      placementRate: 98,
      averagePackage: 1500000,
      highestPackage: 4000000,
    },
    careerOutcomes: [
      {
        role: "Senior Software Engineer",
        avgSalaryMin: 1200000,
        avgSalaryMax: 4000000,
        currency: "INR",
        industryDemand: "very_high",
      },
      {
        role: "Research Scientist",
        avgSalaryMin: 1000000,
        avgSalaryMax: 3500000,
        currency: "INR",
        industryDemand: "high",
      },
    ],
    difficultyLevel: "hard",
    isFeatured: true,
    status: "active",
  },

  {
    title: "MBA",
    nodeType: "course",
    level: 5,
    description: "2-year business management degree",
    overview: "MBA develops leadership and business management skills across functions like finance, marketing, operations, strategy, and HR. Graduates get leadership roles in companies. One of the highest ROI degrees with significant salary hikes.",
    duration: { value: 2, unit: "years" },
    cost: { min: 600000, max: 3000000, average: 1500000, currency: "INR", frequency: "per-year" },
    applicableQualifications: ["bachelor"],
    eligibility: {
      otherRequirements: "Bachelor's degree, CAT/MAT/GMAT score",
    },
    syllabus: {
      description: "Business management curriculum",
      topics: [
        "Finance Management",
        "Marketing Management",
        "Operations Management",
        "Human Resources",
        "Strategic Management",
        "Business Analytics",
      ],
      totalTopics: 20,
    },
    successMetrics: {
      passRate: 98,
      placementRate: 99,
      averagePackage: 1600000,
      highestPackage: 5000000,
    },
    topInstitutions: [
      { name: "IIM Ahmedabad", ranking: 1, location: "Ahmedabad" },
      { name: "IIM Bangalore", ranking: 2, location: "Bangalore" },
      { name: "IIM Calcutta", ranking: 3, location: "Kolkata" },
    ],
    careerOutcomes: [
      {
        role: "Management Consultant",
        avgSalaryMin: 1500000,
        avgSalaryMax: 4000000,
        currency: "INR",
        industryDemand: "very_high",
      },
      {
        role: "Product Manager",
        avgSalaryMin: 1200000,
        avgSalaryMax: 3500000,
        currency: "INR",
        industryDemand: "very_high",
      },
    ],
    difficultyLevel: "hard",
    isFeatured: true,
    status: "active",
  },

  {
    title: "M.Sc Computer Science",
    nodeType: "course",
    level: 5,
    description: "2-year postgraduate CS degree",
    overview: "Specialized master's degree in computer science covering advanced topics in AI, ML, cybersecurity, and software engineering. Excellent for research aspirations and specialized tech roles. International universities also available.",
    duration: { value: 2, unit: "years" },
    cost: { min: 400000, max: 1500000, average: 900000, currency: "INR", frequency: "per-year" },
    applicableQualifications: ["bachelor"],
    applicableStreams: ["engineering", "pcm"],
    eligibility: {
      otherRequirements: "B.Tech in CS or related field",
    },
    syllabus: {
      description: "Advanced CS specializations",
      topics: [
        "Artificial Intelligence & Machine Learning",
        "Cybersecurity & Cryptography",
        "Cloud Computing & Distributed Systems",
        "Research Methodology",
      ],
      totalTopics: 25,
    },
    successMetrics: {
      passRate: 95,
      placementRate: 97,
      averagePackage: 1400000,
      highestPackage: 4500000,
    },
    careerOutcomes: [
      {
        role: "AI/ML Engineer",
        avgSalaryMin: 1200000,
        avgSalaryMax: 4000000,
        currency: "INR",
        industryDemand: "very_high",
      },
    ],
    isFeatured: true,
    status: "active",
  },

  // ========== LEVEL 6: SPECIALIZATIONS ==========
  {
    title: "Cloud Computing Specialization",
    nodeType: "specialization",
    level: 6,
    description: "Cloud platforms certification and training",
    overview: "Cloud computing specializations provide expertise in managing, developing, and deploying applications on cloud platforms. AWS, Microsoft Azure, and Google Cloud are most sought. Essential skill for 70% of IT jobs today.",
    duration: { value: 3, unit: "months" },
    cost: { min: 50000, max: 300000, average: 150000, currency: "INR", frequency: "one-time" },
    applicableQualifications: ["bachelor"],
    applicableStreams: ["engineering"],
    eligibility: {
      otherRequirements: "Basic programming knowledge",
    },
    syllabus: {
      description: "Cloud architecture and DevOps",
      topics: [
        "Cloud Infrastructure",
        "Managed Services",
        "DevOps Practices",
        "Microservices Architecture",
        "Containerization (Docker, Kubernetes)",
      ],
      totalTopics: 20,
    },
    successMetrics: {
      successRate: 80,
      placementRate: 95,
      averagePackage: 900000,
    },
    careerOutcomes: [
      {
        role: "Cloud Architect",
        avgSalaryMin: 1100000,
        avgSalaryMax: 3000000,
        currency: "INR",
        industryDemand: "very_high",
      },
    ],
    isFeatured: true,
    status: "active",
  },

  {
    title: "Data Science & Analytics",
    nodeType: "specialization",
    level: 6,
    description: "Data science and analytics training program",
    overview: "Data Science combines statistics, programming, and domain expertise to extract insights from data. Highest paying tech roles. Industries like finance, healthcare, e-commerce heavily invest in data scientists.",
    duration: { value: 6, unit: "months" },
    cost: { min: 80000, max: 400000, average: 200000, currency: "INR", frequency: "per-year" },
    applicableQualifications: ["bachelor", "master"],
    applicableStreams: ["engineering", "pcm"],
    eligibility: {
      otherRequirements: "Strong math & programming background",
    },
    syllabus: {
      description: "Statistics, ML, Python, Big Data",
      topics: [
        "Statistics & Probability",
        "Python/R Programming",
        "Machine Learning Algorithms",
        "Big Data Technologies (Hadoop, Spark)",
        "Data Visualization",
        "SQL & Database",
      ],
      totalTopics: 30,
    },
    successMetrics: {
      successRate: 75,
      placementRate: 98,
      averagePackage: 1300000,
      highestPackage: 4000000,
    },
    careerOutcomes: [
      {
        role: "Data Scientist",
        avgSalaryMin: 1000000,
        avgSalaryMax: 4000000,
        currency: "INR",
        industryDemand: "very_high",
        companies: ["Google", "Facebook", "Amazon", "Microsoft"],
      },
    ],
    difficultyLevel: "hard",
    isFeatured: true,
    status: "active",
  },
];

// ============= SEED FUNCTION =============

const seedDatabase = async () => {
  try {
    logger.info("Starting career guidance data seeding...");

    // Connect to DB
    await connectDB();
    logger.success("Connected to database");

    // Check for --force flag
    const forceCleanup = process.argv.includes("--force");

    // Cleanup if needed
    await cleanupDatabase(forceCleanup);

    // Get admin ID
    const adminId = await getAdminId();
    logger.success(`Using admin ID: ${adminId}`);

    // Seed questions
    const questionsData = getQuestionsData().map((q) => ({
      ...q,
      createdBy: adminId,
    }));

    logger.info("Seeding questions...");
    const createdQuestions = await CareerGuidanceQuestion.insertMany(questionsData, {
      ordered: false, // Continue on error
    }).catch((error) => {
      if (error.code === 11000) {
        logger.warn("Some questions already exist - continuing");
        return error.result?.insertedDocs || [];
      }
      throw error;
    });

    logger.success(`${createdQuestions.length || questionsData.length} questions seeded`);

    // Seed nodes
    const nodesData = getNodesData().map((n) => ({
      ...n,
      slug: slugify(n.title, { lower: true, strict: true }),
      createdBy: adminId,
      isVerified: true,
      verifiedBy: adminId,
      verificationDate: new Date(),
    }));

    logger.info("Seeding nodes...");
    const createdNodes = await CareerPathNode.insertMany(nodesData, {
      ordered: false,
    }).catch((error) => {
      if (error.code === 11000) {
        logger.warn("Some nodes already exist - continuing");
        return error.result?.insertedDocs || [];
      }
      throw error;
    });

    logger.success(`${createdNodes.length || nodesData.length} career path nodes seeded`);

    // Create relationships between nodes
    logger.info("Creating node relationships...");

    // Class 10 -> Class 12 (PCM, PCB, Commerce)
    const class10 = await CareerPathNode.findOne({ title: "Class 10th (CBSE/State Board)" });
    const class12PCM = await CareerPathNode.findOne({ title: "Class 12th Science (PCM)" });
    const class12PCB = await CareerPathNode.findOne({ title: "Class 12th Science (PCB)" });
    const class12Commerce = await CareerPathNode.findOne({ title: "Class 12th Commerce" });

    if (class10 && class12PCM && class12PCB && class12Commerce) {
      await CareerPathNode.findByIdAndUpdate(class10._id, {
        nextNodeIds: [class12PCM._id, class12PCB._id, class12Commerce._id],
      });
    }

    // Class 12 PCM -> JEE Main/Advanced, B.Tech
    if (class12PCM) {
      const jeeMain = await CareerPathNode.findOne({ title: "JEE Main" });
      const jeeAdvanced = await CareerPathNode.findOne({ title: "JEE Advanced" });
      const btech = await CareerPathNode.findOne({ title: "B.Tech (Computer Science Engineering)" });

      if (jeeMain || jeeAdvanced || btech) {
        const nextIds = [];
        if (jeeMain) nextIds.push(jeeMain._id);
        if (jeeAdvanced) nextIds.push(jeeAdvanced._id);
        if (btech) nextIds.push(btech._id);

        await CareerPathNode.findByIdAndUpdate(class12PCM._id, { nextNodeIds: nextIds });
      }
    }

    // Class 12 PCB -> NEET, MBBS
    if (class12PCB) {
      const neet = await CareerPathNode.findOne({ title: "NEET UG" });
      const mbbs = await CareerPathNode.findOne({ title: "MBBS" });

      if (neet || mbbs) {
        const nextIds = [];
        if (neet) nextIds.push(neet._id);
        if (mbbs) nextIds.push(mbbs._id);

        await CareerPathNode.findByIdAndUpdate(class12PCB._id, { nextNodeIds: nextIds });
      }
    }

    // Class 12 Commerce -> B.Com
    if (class12Commerce) {
      const bcom = await CareerPathNode.findOne({ title: "B.Com" });
      if (bcom) {
        await CareerPathNode.findByIdAndUpdate(class12Commerce._id, {
          nextNodeIds: [bcom._id],
        });
      }
    }

    // B.Tech -> M.Tech, GATE
    const btech = await CareerPathNode.findOne({ title: "B.Tech (Computer Science Engineering)" });
    if (btech) {
      const mtech = await CareerPathNode.findOne({ title: "M.Tech" });
      const gate = await CareerPathNode.findOne({ title: "GATE" });
      const cloudSpec = await CareerPathNode.findOne({ title: "Cloud Computing Specialization" });
      const dataScience = await CareerPathNode.findOne({ title: "Data Science & Analytics" });

      const nextIds = [];
      if (mtech) nextIds.push(mtech._id);
      if (gate) nextIds.push(gate._id);
      if (cloudSpec) nextIds.push(cloudSpec._id);
      if (dataScience) nextIds.push(dataScience._id);

      if (nextIds.length > 0) {
        await CareerPathNode.findByIdAndUpdate(btech._id, { nextNodeIds: nextIds });
      }
    }

    // MBBS -> Specialization
    const mbbs = await CareerPathNode.findOne({ title: "MBBS" });
    if (mbbs) {
      const dataScience = await CareerPathNode.findOne({ title: "Data Science & Analytics" });
      if (dataScience) {
        await CareerPathNode.findByIdAndUpdate(mbbs._id, {
          nextNodeIds: [dataScience._id],
        });
      }
    }

    // B.Com -> CA
    const bcom = await CareerPathNode.findOne({ title: "B.Com" });
    const ca = await CareerPathNode.findOne({ title: "CA (Chartered Accountant)" });
    if (bcom && ca) {
      await CareerPathNode.findByIdAndUpdate(bcom._id, {
        nextNodeIds: [ca._id],
      });
    }

    logger.success("Node relationships created successfully");

    // Summary
    console.log("\n✓ ============== SEEDING COMPLETE ==============");
    console.log(`✓ Total Questions: ${questionsData.length}`);
    console.log(`✓ Total Nodes: ${nodesData.length}`);
    console.log(`✓ Total Relationships: Multiple nodes linked`);
    console.log("✓ All nodes are verified and featured");
    console.log("\n✓ Career Guidance Module is ready to use!");
    console.log("\n📚 To test the API:");
    console.log("   GET  /api/v1/career-guidance/questions");
    console.log("   GET  /api/v1/career-guidance/featured-courses");
    console.log("   GET  /api/v1/career-guidance/search?qualification=class_12th");
    console.log("   POST /api/v1/career-guidance/submit-answers");

    process.exit(0);
  } catch (error) {
    logger.error("Seeding failed", error);
    process.exit(1);
  }
};

// Run seeding
seedDatabase();