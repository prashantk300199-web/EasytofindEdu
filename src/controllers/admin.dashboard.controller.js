import User from "../models/User.js";
import Student from "../models/Students.js";
import Hostel from "../models/Hostel.js";
import Institute from "../models/Institute.js";
import InstituteOwner from "../models/InstituteOwner.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getDashboardOverview = asyncHandler(async (req, res) => {
  // Aggregate stats
  const [
    totalStudents,
    totalHostelOwners,
    totalInstituteOwners,
    totalHostels,
    totalInstitutes
  ] = await Promise.all([
    Student.countDocuments(),
    User.countDocuments(), // Since User model seems to be for Hostel Owners exclusively or primarily
    InstituteOwner.countDocuments(),
    Hostel.countDocuments(),
    Institute.countDocuments()
  ]);

  // Monthly growth (Last 6 months)
  const getMonthlyData = async (Model) => {
    const data = await Model.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
          }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
    return data;
  };

  const studentGrowth = await getMonthlyData(Student);
  const hostelGrowth = await getMonthlyData(Hostel);
  const instituteGrowth = await getMonthlyData(Institute);

  // Status distributions
  const hostelStatus = await Hostel.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);

  const instituteStatus = await Institute.aggregate([
    { $group: { _id: "$isApproved", count: { $sum: 1 } } }
  ]);

  res.status(200).json(
    new ApiResponse(200, "Dashboard stats fetched.", {
      counts: {
        students: totalStudents,
        hostelOwners: totalHostelOwners,
        instituteOwners: totalInstituteOwners,
        hostels: totalHostels,
        institutes: totalInstitutes
      },
      growth: {
        students: studentGrowth,
        hostels: hostelGrowth,
        institutes: instituteGrowth
      },
      distribution: {
        hostelStatus,
        instituteStatus
      }
    })
  );
});
