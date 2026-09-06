import Hostel from "../models/Hostel.js";

export const trackView = async (hostelId) => {
  await Hostel.findByIdAndUpdate(hostelId, {
    $inc: { views_count: 1 },
    last_viewed_at: new Date(),
  });
};

export const trackLead = async (hostelId) => {
  await Hostel.findByIdAndUpdate(hostelId, {
    $inc: { leads_count: 1 },
  });
};