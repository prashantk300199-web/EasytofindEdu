import mongoose from "mongoose";
import Hostel from "../models/Hostel.js";
import Institute from "../models/Institute.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

// Dummy AI Insight Generator based on data
const generateHostelInsights = (hostels) => {
  if (hostels.length < 2) return [];
  const insights = [];
  
  // Example insight logic
  // Price comparison
  let cheapest = hostels[0];
  let mostExpensive = hostels[0];
  
  hostels.forEach(h => {
    const hPrice = h.rooms?.[0]?.monthly_rent || 0;
    const cPrice = cheapest.rooms?.[0]?.monthly_rent || 0;
    const mPrice = mostExpensive.rooms?.[0]?.monthly_rent || 0;
    if (hPrice > 0 && (hPrice < cPrice || cPrice === 0)) cheapest = h;
    if (hPrice > mPrice) mostExpensive = h;
  });

  if (cheapest && cheapest._id !== mostExpensive._id) {
    insights.push(`${cheapest.name} is better for budget students.`);
  }

  // Security comparison
  let bestSecurity = hostels[0];
  hostels.forEach(h => {
    const hSec = (h.security?.cctv ? 1 : 0) + (h.security?.security_guard_24x7 ? 1 : 0) + (h.security?.biometric_entry ? 1 : 0);
    const bSec = (bestSecurity.security?.cctv ? 1 : 0) + (bestSecurity.security?.security_guard_24x7 ? 1 : 0) + (bestSecurity.security?.biometric_entry ? 1 : 0);
    if (hSec > bSec) bestSecurity = h;
  });

  insights.push(`${bestSecurity.name} offers stronger security features.`);

  return insights;
};

const generateInstituteInsights = (institutes) => {
  if (institutes.length < 2) return [];
  const insights = [];
  
  // Example insight logic
  let oldest = institutes[0];
  institutes.forEach(i => {
    if (i.establishedYear < oldest.establishedYear) oldest = i;
  });
  
  insights.push(`${oldest.name} has the most years of experience in the industry.`);

  return insights;
};

export const getCompareHostels = asyncHandler(async (req, res) => {
  const { ids } = req.query;
  if (!ids) {
    throw new ApiError(400, "Please provide hostel ids to compare.");
  }

  const idArray = ids.split(',').filter(id => mongoose.isValidObjectId(id.trim()));
  
  if (idArray.length < 2 || idArray.length > 4) {
    throw new ApiError(400, "Please provide between 2 and 4 valid hostel IDs.");
  }

  const hostels = await Hostel.find({ _id: { $in: idArray } }).lean();

  if (hostels.length === 0) {
    throw new ApiError(404, "No valid hostels found for the given IDs.");
  }

  // Generate comparison metrics and scores on the fly if not present
  const enrichedHostels = hostels.map(hostel => {
    const amenitiesScore = (hostel.in_room_amenities?.length || 0) + (hostel.common_amenities?.length || 0);
    const securityScore = ((hostel.security?.cctv ? 1 : 0) + (hostel.security?.security_guard_24x7 ? 1 : 0) + (hostel.security?.biometric_entry ? 1 : 0)) * 3;
    const foodScore = hostel.meal_plans?.length ? 8 : 4;
    const valueForMoney = 8; // Dummy calculated
    const studentSatisfaction = 8.5;

    return {
      ...hostel,
      comparisonMetrics: hostel.comparisonMetrics || {
        cleanlinessScore: 8 + Math.random(),
        securityScore: Math.min(10, securityScore + 4),
        foodScore: foodScore,
        wifiScore: 8.5,
        studyEnvironmentScore: 8,
        valueForMoney: valueForMoney,
        studentSatisfaction: studentSatisfaction,
        overallScore: Math.min(10, (amenitiesScore * 0.3) + (securityScore * 0.2) + 5)
      }
    };
  });

  const aiInsights = generateHostelInsights(enrichedHostels);

  res.status(200).json(
    new ApiResponse(200, "Comparison data generated successfully", {
      hostels: enrichedHostels,
      aiInsights
    })
  );
});


export const getCompareInstitutes = asyncHandler(async (req, res) => {
  const { ids } = req.query;
  if (!ids) {
    throw new ApiError(400, "Please provide institute ids to compare.");
  }

  const idArray = ids.split(',').filter(id => mongoose.isValidObjectId(id.trim()));
  
  if (idArray.length < 2 || idArray.length > 4) {
    throw new ApiError(400, "Please provide between 2 and 4 valid institute IDs.");
  }

  const institutes = await Institute.find({ _id: { $in: idArray } }).lean();

  if (institutes.length === 0) {
    throw new ApiError(404, "No valid institutes found for the given IDs.");
  }

  const enrichedInstitutes = institutes.map(inst => {
    return {
      ...inst,
      comparisonMetrics: inst.comparisonMetrics || {
        academicScore: 8 + Math.random(),
        facultyScore: 9,
        infrastructureScore: 8.5,
        transparencyScore: 9,
        careerOutcomesScore: 8.5,
        overallScore: 8.8
      }
    };
  });

  const aiInsights = generateInstituteInsights(enrichedInstitutes);

  res.status(200).json(
    new ApiResponse(200, "Comparison data generated successfully", {
      institutes: enrichedInstitutes,
      aiInsights
    })
  );
});
