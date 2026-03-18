import mongoose from "mongoose";
import CareerProgram from "../models/CareerProgram.js";
import EntranceExam from "../models/EntranceExam.js";
import College from "../models/College.js";
import Admin from "../models/Admin.js";
import connectDB from "../config/db.js";
import slugify from "../utils/slugify.js";

const logger = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  warn: (msg) => console.warn(`⚠️  ${msg}`),
};

// ============= GET ADMIN =============
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

// ============= CLEANUP =============
const cleanupDatabase = async (force = false) => {
  const programCount = await CareerProgram.countDocuments();
  const examCount = await EntranceExam.countDocuments();
  const collegeCount = await College.countDocuments();

  if (programCount === 0 && examCount === 0 && collegeCount === 0) {
    logger.info("Database is clean");
    return;
  }

  if (!force) {
    logger.warn(
      `Found existing data: ${programCount} programs, ${examCount} exams, ${collegeCount} colleges`
    );
    logger.warn("Use --force flag to replace existing data");
    process.exit(0);
  }

  logger.info("Cleaning up existing data...");
  await CareerProgram.deleteMany({});
  await EntranceExam.deleteMany({});
  await College.deleteMany({});
  logger.success("Database cleaned");
};

// ============= SEED EXAMS =============
const getExamsData = () => [
  {
    name: "JEE Main",
    slug: "jee-main",
    type: "engineering",
    description: "National engineering entrance exam conducted by NTA",
    overview: "JEE Main is the primary gateway exam for engineering admissions across India",
    difficultyLevel: "hard",
    successRate: 15,
    passRate: 25,
    frequency: "twice_a_year",
    applicationFee: 650,
    coachingCost: { min: 60000, max: 500000 },
    eligibility: {
      minQualification: "12th_pass",
      requiredStream: "pcm",
      minPercentage: 60,
    },
    duration: { preparationMonths: 10 },
    officialWebsite: "https://www.nta.ac.in/",
    conductingBody: "NTA",
  },
  {
    name: "JEE Advanced",
    slug: "jee-advanced",
    type: "engineering",
    description: "IIT entrance examination",
    overview: "JEE Advanced is the gateway to world-class IIT institutions",
    difficultyLevel: "very_hard",
    successRate: 18,
    passRate: 20,
    frequency: "once_a_year",
    applicationFee: 500,
    coachingCost: { min: 50000, max: 300000 },
    eligibility: {
      minQualification: "12th_pass",
      requiredStream: "pcm",
      minPercentage: 90,
    },
    duration: { preparationMonths: 3 },
    officialWebsite: "https://www.jeeadv.ac.in/",
    conductingBody: "IITs",
  },
  {
    name: "NEET UG",
    slug: "neet-ug",
    type: "medical",
    description: "National Eligibility cum Entrance Test for medical programs",
    overview: "NEET UG is the single national-level exam for MBBS and BDS admissions",
    difficultyLevel: "very_hard",
    successRate: 12,
    passRate: 20,
    frequency: "once_a_year",
    applicationFee: 1600,
    coachingCost: { min: 60000, max: 400000 },
    eligibility: {
      minQualification: "12th_pass",
      requiredStream: "pcb",
      minPercentage: 50,
    },
    duration: { preparationMonths: 10 },
    officialWebsite: "https://www.nta.ac.in/",
    conductingBody: "NTA",
  },
  {
    name: "CAT",
    slug: "cat",
    type: "management",
    description: "Common Admission Test for MBA programs",
    overview: "CAT is the gateway to top MBA programs in India",
    difficultyLevel: "hard",
    successRate: 2,
    passRate: 5,
    frequency: "once_a_year",
    applicationFee: 2300,
    coachingCost: { min: 50000, max: 300000 },
    eligibility: {
      minQualification: "bachelor",
    },
    duration: { preparationMonths: 6 },
    officialWebsite: "https://www.iimcat.ac.in/",
    conductingBody: "IIMs",
  },
  {
    name: "CUET",
    slug: "cuet",
    type: "other",
    description: "Common University Entrance Test for UG programs",
    overview: "CUET provides admission to top central universities",
    difficultyLevel: "moderate",
    successRate: 35,
    passRate: 50,
    frequency: "once_a_year",
    applicationFee: 600,
    coachingCost: { min: 20000, max: 150000 },
    eligibility: {
      minQualification: "12th_pass",
    },
    duration: { preparationMonths: 4 },
    officialWebsite: "https://cuet.nta.ac.in/",
    conductingBody: "NTA",
  },
  {
    name: "CLAT",
    slug: "clat",
    type: "law",
    description: "Common Law Admission Test for NLUs",
    overview: "CLAT is the entrance exam for National Law Universities",
    difficultyLevel: "hard",
    successRate: 8,
    passRate: 12,
    frequency: "once_a_year",
    applicationFee: 4000,
    coachingCost: { min: 30000, max: 200000 },
    eligibility: {
      minQualification: "12th_pass",
    },
    duration: { preparationMonths: 6 },
    officialWebsite: "https://www.consortiumofnlus.ac.in/",
    conductingBody: "Consortium of NLUs",
  },
];

// ============= SEED COLLEGES =============
const getCollegesData = () => [
  {
    name: "IIT Bombay",
    slug: "iit-bombay",
    location: { city: "Mumbai", state: "Maharashtra", country: "India" },
    collegeType: "national",
    description: "Indian Institute of Technology Bombay",
    ranking: { nirf: { rank: 3, year: 2024 } },
    contact: {
      website: "https://www.iitb.ac.in/",
      email: "contact@iitb.ac.in",
      phone: ["+91-22-2576-7000"],
    },
    placements: {
      placementRate: 98,
      averagePackage: 25,
      highestPackage: 150,
    },
    infrastructure: {
      totalStudents: 10000,
      facultyCount: 600,
      classrooms: 150,
      computerLabs: 50,
    },
    approvals: ["AICTE", "UGC"],
  },
  {
    name: "IIT Delhi",
    slug: "iit-delhi",
    location: { city: "Delhi", state: "Delhi", country: "India" },
    collegeType: "national",
    description: "Indian Institute of Technology Delhi",
    ranking: { nirf: { rank: 2, year: 2024 } },
    contact: {
      website: "https://www.iitd.ac.in/",
      email: "contact@iitd.ac.in",
      phone: ["+91-11-2659-1100"],
    },
    placements: {
      placementRate: 99,
      averagePackage: 26,
      highestPackage: 160,
    },
    infrastructure: {
      totalStudents: 8000,
      facultyCount: 550,
      classrooms: 120,
      computerLabs: 40,
    },
    approvals: ["AICTE", "UGC"],
  },
  {
    name: "NIT Trichy",
    slug: "nit-trichy",
    location: { city: "Trichy", state: "Tamil Nadu", country: "India" },
    collegeType: "govt",
    description: "National Institute of Technology Trichy",
    ranking: { nirf: { rank: 20, year: 2024 } },
    contact: {
      website: "https://www.nitt.edu/",
      email: "contact@nitt.edu",
      phone: ["+91-431-2500000"],
    },
    placements: {
      placementRate: 95,
      averagePackage: 12,
      highestPackage: 80,
    },
    infrastructure: {
      totalStudents: 6000,
      facultyCount: 400,
    },
    approvals: ["AICTE", "UGC"],
  },
  {
    name: "Delhi University",
    slug: "delhi-university",
    location: { city: "Delhi", state: "Delhi", country: "India" },
    collegeType: "govt",
    description: "University of Delhi",
    ranking: { nirf: { rank: 12, year: 2024 } },
    contact: {
      website: "https://www.du.ac.in/",
      email: "contact@du.ac.in",
    },
    placements: {
      placementRate: 75,
      averagePackage: 8,
    },
    approvals: ["UGC"],
  },
];

// ============= SEED PROGRAMS =============
const getProgramsData = (examIds, collegeIds) => [
  {
    title: "B.Tech CSE",
    slug: "btech-cse",
    category: "Engineering",
    tags: ["after_12th", "pcm", "featured"],
    requiredQualification: "12th_pass",
    requiredStream: "pcm",
    minPercentage: 60,
    duration: { min: 48, max: 48, unit: "months" },
    fees: { min: 750000, max: 1150000, average: 950000, frequency: "per-year" },
    salary: { minLPA: 5, maxLPA: 40 },
    jobRoles: [
      { title: "Software Engineer", avgSalaryLPA: 12, demandLevel: "very_high" },
      { title: "Data Scientist", avgSalaryLPA: 15, demandLevel: "very_high" },
      { title: "Full Stack Developer", avgSalaryLPA: 11, demandLevel: "high" },
      { title: "AI Engineer", avgSalaryLPA: 16, demandLevel: "very_high" },
    ],
    placementRate: 95,
    entranceExams: examIds.slice(0, 2).map((id) => ({ examId: id, isMandatory: true })),
    topColleges: collegeIds.slice(0, 2).map((id, idx) => ({ collegeId: id, rank: idx + 1 })),
    govtOpportunities: [
      { title: "ISRO Scientist", salaryRange: "₹15-25 LPA", department: "ISRO" },
      { title: "DRDO Engineer", salaryRange: "₹12-20 LPA", department: "DRDO" },
    ],
    futureGrowth: "Excellent – IT sector continues to grow rapidly with AI/ML demand",
    growthRate: "Excellent",
    difficultyLevel: "hard",
    industryDemand: "very_high",
    isFeatured: true,
    displayOrder: 1,
    status: "published",
    description: "B.Tech in Computer Science Engineering",
    overview: "Learn core programming, algorithms, databases, and modern web technologies",
  },
  {
    title: "MBBS",
    slug: "mbbs",
    category: "Medical & Allied",
    tags: ["after_12th", "pcb", "featured"],
    requiredQualification: "12th_pass",
    requiredStream: "pcb",
    minPercentage: 50,
    duration: { min: 66, max: 66, unit: "months" },
    fees: { min: 800000, max: 3000000, average: 1500000, frequency: "per-year" },
    salary: { minLPA: 4, maxLPA: 12 },
    jobRoles: [
      { title: "Medical Doctor", avgSalaryLPA: 8, demandLevel: "high" },
      { title: "Surgeon", avgSalaryLPA: 20, demandLevel: "high" },
    ],
    placementRate: 100,
    entranceExams: [{ examId: examIds[2], isMandatory: true }],
    topColleges: collegeIds.slice(0, 2).map((id, idx) => ({ collegeId: id, rank: idx + 1 })),
    govtOpportunities: [
      { title: "Armed Forces Medical Corps", salaryRange: "₹10-18 LPA" },
    ],
    futureGrowth: "Good – Healthcare sector growing with demand for specialists",
    growthRate: "Good",
    difficultyLevel: "very_hard",
    industryDemand: "high",
    isFeatured: true,
    displayOrder: 2,
    status: "published",
    description: "Bachelor of Medicine, Bachelor of Surgery",
    overview: "5.5-year medical degree program with clinical training",
  },
  {
    title: "B.Com",
    slug: "bcom",
    category: "Commerce",
    tags: ["after_12th", "commerce"],
    requiredQualification: "12th_pass",
    requiredStream: "commerce",
    duration: { min: 36, max: 36, unit: "months" },
    fees: { min: 100000, max: 500000, average: 250000, frequency: "per-year" },
    salary: { minLPA: 3, maxLPA: 8 },
    jobRoles: [
      { title: "Accountant", avgSalaryLPA: 5, demandLevel: "high" },
      { title: "Finance Manager", avgSalaryLPA: 10, demandLevel: "high" },
    ],
    placementRate: 70,
    futureGrowth: "Steady – Finance professionals always in demand",
    growthRate: "Steady",
    difficultyLevel: "moderate",
    industryDemand: "high",
    displayOrder: 3,
    status: "published",
    description: "Bachelor of Commerce",
    overview: "3-year commerce degree focusing on accounting, finance, and business",
  },
  {
    title: "B.A",
    slug: "ba",
    category: "Arts & Humanities",
    tags: ["after_12th", "arts"],
    requiredQualification: "12th_pass",
    requiredStream: "arts",
    duration: { min: 36, max: 36, unit: "months" },
    fees: { min: 50000, max: 300000, average: 150000, frequency: "per-year" },
    salary: { minLPA: 2, maxLPA: 6 },
    jobRoles: [
      { title: "Teacher", avgSalaryLPA: 4, demandLevel: "moderate" },
      { title: "Journalist", avgSalaryLPA: 5, demandLevel: "moderate" },
      { title: "Civil Servant", avgSalaryLPA: 10, demandLevel: "high" },
    ],
    placementRate: 60,
    futureGrowth: "Moderate – Depends on specialization and soft skills",
    growthRate: "Steady",
    difficultyLevel: "easy",
    industryDemand: "moderate",
    displayOrder: 4,
    status: "published",
    description: "Bachelor of Arts",
    overview: "3-year arts degree with humanities specializations",
  },
  {
    title: "B.Tech ECE",
    slug: "btech-ece",
    category: "Engineering",
    tags: ["after_12th", "pcm"],
    requiredQualification: "12th_pass",
    requiredStream: "pcm",
    minPercentage: 55,
    duration: { min: 48, max: 48, unit: "months" },
    fees: { min: 700000, max: 1000000, average: 850000, frequency: "per-year" },
    salary: { minLPA: 4, maxLPA: 30 },
    jobRoles: [
      { title: "Electronics Engineer", avgSalaryLPA: 9, demandLevel: "high" },
      { title: "VLSI Engineer", avgSalaryLPA: 12, demandLevel: "high" },
    ],
    placementRate: 85,
    entranceExams: examIds.slice(0, 2).map((id) => ({ examId: id, isMandatory: true })),
    topColleges: collegeIds.slice(0, 2).map((id, idx) => ({ collegeId: id, rank: idx + 1 })),
    futureGrowth: "Good – Electronics sector growing with telecom and IoT",
    growthRate: "Good",
    difficultyLevel: "hard",
    industryDemand: "high",
    displayOrder: 5,
    status: "published",
    description: "B.Tech in Electronics and Communication Engineering",
    overview: "Specialization in electronics, communication systems, and signal processing",
  },
  {
    title: "MBA",
    slug: "mba",
    category: "Postgraduate",
    tags: ["after_12th", "featured"],
    requiredQualification: "bachelor",
    duration: { min: 24, max: 24, unit: "months" },
    fees: { min: 200000, max: 3500000, average: 1200000, frequency: "per-year" },
    salary: { minLPA: 8, maxLPA: 40 },
    jobRoles: [
      { title: "Business Consultant", avgSalaryLPA: 15, demandLevel: "very_high" },
      { title: "Product Manager", avgSalaryLPA: 18, demandLevel: "very_high" },
      { title: "Finance Manager", avgSalaryLPA: 14, demandLevel: "high" },
    ],
    placementRate: 90,
    entranceExams: [{ examId: examIds[3], isMandatory: true }],
    futureGrowth: "Excellent – Management roles in high demand globally",
    growthRate: "Excellent",
    difficultyLevel: "hard",
    industryDemand: "very_high",
    isFeatured: true,
    displayOrder: 1,
    status: "published",
    description: "Master of Business Administration",
    overview: "2-year postgraduate degree with specializations in management",
  },
  {
    title: "B.Tech Mechanical",
    slug: "btech-mechanical",
    category: "Engineering",
    tags: ["after_12th", "pcm"],
    requiredQualification: "12th_pass",
    requiredStream: "pcm",
    minPercentage: 50,
    duration: { min: 48, max: 48, unit: "months" },
    fees: { min: 600000, max: 900000, average: 750000, frequency: "per-year" },
    salary: { minLPA: 4, maxLPA: 18 },
    jobRoles: [
      { title: "Mechanical Engineer", avgSalaryLPA: 7, demandLevel: "high" },
      { title: "Manufacturing Engineer", avgSalaryLPA: 8, demandLevel: "moderate" },
    ],
    placementRate: 80,
    futureGrowth: "Steady – Always in demand for manufacturing and automotive",
    growthRate: "Steady",
    difficultyLevel: "moderate",
    industryDemand: "high",
    displayOrder: 6,
    status: "published",
    description: "B.Tech in Mechanical Engineering",
    overview: "Focus on mechanical design, thermodynamics, and manufacturing",
  },
  {
    title: "BDS",
    slug: "bds",
    category: "Medical & Allied",
    tags: ["after_12th", "pcb"],
    requiredQualification: "12th_pass",
    requiredStream: "pcb",
    minPercentage: 45,
    duration: { min: 60, max: 60, unit: "months" },
    fees: { min: 600000, max: 2500000, average: 1200000, frequency: "per-year" },
    salary: { minLPA: 3, maxLPA: 10 },
    jobRoles: [
      { title: "Dentist", avgSalaryLPA: 6, demandLevel: "high" },
      { title: "Dental Surgeon", avgSalaryLPA: 9, demandLevel: "high" },
    ],
    placementRate: 85,
    entranceExams: [{ examId: examIds[2], isMandatory: true }],
    futureGrowth: "Good – Dental care in high demand",
    growthRate: "Good",
    difficultyLevel: "hard",
    industryDemand: "high",
    isFeatured: true,
    displayOrder: 3,
    status: "published",
    description: "Bachelor of Dental Surgery",
    overview: "5-year dentistry degree with clinical practice",
  },
  {
    title: "B.A Psychology",
    slug: "ba-psychology",
    category: "Arts & Humanities",
    tags: ["after_12th", "arts"],
    requiredQualification: "12th_pass",
    requiredStream: "arts",
    duration: { min: 36, max: 36, unit: "months" },
    fees: { min: 80000, max: 400000, average: 200000, frequency: "per-year" },
    salary: { minLPA: 2, maxLPA: 6 },
    jobRoles: [
      { title: "Psychologist", avgSalaryLPA: 4, demandLevel: "moderate" },
      { title: "HR Specialist", avgSalaryLPA: 6, demandLevel: "high" },
    ],
    placementRate: 65,
    futureGrowth: "Growing – Mental health awareness increasing",
    growthRate: "Good",
    difficultyLevel: "moderate",
    industryDemand: "moderate",
    displayOrder: 7,
    status: "published",
    description: "Bachelor of Arts in Psychology",
    overview: "3-year psychology program with emphasis on human behavior",
  },
  {
    title: "BA LLB",
    slug: "ba-llb",
    category: "Law",
    tags: ["after_12th", "arts", "featured"],
    requiredQualification: "12th_pass",
    requiredStream: "arts",
    duration: { min: 60, max: 60, unit: "months" },
    fees: { min: 400000, max: 1500000, average: 900000, frequency: "per-year" },
    salary: { minLPA: 4, maxLPA: 25 },
    jobRoles: [
      { title: "Lawyer", avgSalaryLPA: 10, demandLevel: "high" },
      { title: "Legal Consultant", avgSalaryLPA: 12, demandLevel: "high" },
    ],
    placementRate: 75,
    entranceExams: [{ examId: examIds[5], isMandatory: true }],
    futureGrowth: "Good – Legal profession always in demand",
    growthRate: "Good",
    difficultyLevel: "hard",
    industryDemand: "high",
    isFeatured: true,
    displayOrder: 2,
    status: "published",
    description: "Integrated BA LLB Program",
    overview: "5-year integrated law degree combining arts and legal studies",
  },
];

// ============= MAIN SEED FUNCTION =============
const seedDatabase = async () => {
  try {
    logger.info("🚀 Starting Career Programs Database Seeding...");
    
    await connectDB();
    logger.success("Connected to database");

    const forceCleanup = process.argv.includes("--force");
    await cleanupDatabase(forceCleanup);

    const adminId = await getAdminId();
    logger.success(`Using admin ID: ${adminId}`);

    // ============= SEED ENTRANCE EXAMS =============
    logger.info("Seeding entrance exams...");
    const examsData = getExamsData().map((e) => ({
      ...e,
      createdBy: adminId,
      status: "published",
    }));
    const exams = await EntranceExam.insertMany(examsData, { ordered: false });
    logger.success(`✅ ${exams.length} entrance exams seeded`);

    // ============= SEED COLLEGES =============
    logger.info("Seeding colleges...");
    const collegesData = getCollegesData().map((c) => ({
      ...c,
      createdBy: adminId,
      status: "published",
    }));
    const colleges = await College.insertMany(collegesData, { ordered: false });
    logger.success(`✅ ${colleges.length} colleges seeded`);

    // ============= SEED CAREER PROGRAMS =============
    logger.info("Seeding career programs...");
    const programsData = getProgramsData(
      exams.map((e) => e._id),
      colleges.map((c) => c._id)
    ).map((p) => ({
      ...p,
      createdBy: adminId,
    }));
    const programs = await CareerProgram.insertMany(programsData, { ordered: false });
    logger.success(`✅ ${programs.length} career programs seeded`);

    // ============= SUMMARY =============
    console.log("\n" + "═".repeat(70));
    console.log("✅ SEEDING COMPLETED SUCCESSFULLY");
    console.log("═".repeat(70));
    console.log(`\n📊 Summary:`);
    console.log(`   • Entrance Exams: ${exams.length}`);
    console.log(`   • Colleges: ${colleges.length}`);
    console.log(`   • Career Programs: ${programs.length}`);
    console.log(`   • Admin User: ${adminId}`);
    console.log(`\n🎯 API Endpoints Ready:`);
    console.log(`   • GET  /api/v1/careers/programs`);
    console.log(`   • GET  /api/v1/careers/programs/:slug`);
    console.log(`   • POST /api/v1/admin/careers/programs`);
    console.log(`   • GET  /api/v1/admin/careers/exams`);
    console.log(`   • GET  /api/v1/admin/careers/colleges`);
    console.log(`\n🚀 System ready for production!\n`);

    process.exit(0);
  } catch (error) {
    logger.error("Seeding failed", error);
    console.error(error);
    process.exit(1);
  }
};

seedDatabase();