import Hostel from "../models/Hostel.js";
import { HOSTEL_STATUS } from "../constants/enums.js";

export const searchHostels = async (query) => {
  const {
    search,
    city,
    state,
    hostel_type,
    min_price,
    max_price,
    room_type,
    amenities,
    min_rating,
    lat,
    lng,
    radius_km,
    sort_by,
    page = 1,
    limit = 20,
  } = query;

  const filter = {
    status: HOSTEL_STATUS.APPROVED,
    is_open: true,
  };

  if (search) {
    filter.$text = { $search: search };
  }

  if (city) {
    filter["address.city"] = new RegExp(city, "i");
  }

  if (state) {
    filter["address.state"] = new RegExp(state, "i");
  }

  if (hostel_type) {
    filter.hostel_type = hostel_type;
  }

  if (min_price || max_price) {
    filter["rent.monthly"] = {};
    if (min_price) filter["rent.monthly"].$gte = Number(min_price);
    if (max_price) filter["rent.monthly"].$lte = Number(max_price);
  }

  if (room_type) {
    filter["rooms.room_type"] = room_type;
  }

  if (amenities) {
    const amenityList = amenities.split(",").map((a) => a.trim());
    filter.amenities = { $all: amenityList };
  }

  if (min_rating) {
    filter["rating_summary.overall"] = { $gte: Number(min_rating) };
  }

  if (lat && lng && radius_km) {
    filter.location = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [Number(lng), Number(lat)],
        },
        $maxDistance: Number(radius_km) * 1000,
      },
    };
  }

  let sortOption = { sort_priority: -1, createdAt: -1 };

  switch (sort_by) {
    case "price_asc":
      sortOption = { "rent.monthly": 1 };
      break;
    case "price_desc":
      sortOption = { "rent.monthly": -1 };
      break;
    case "rating":
      sortOption = { "rating_summary.overall": -1 };
      break;
    case "newest":
      sortOption = { createdAt: -1 };
      break;
    case "views":
      sortOption = { views_count: -1 };
      break;
  }

  if (search && !sort_by) {
    sortOption = { score: { $meta: "textScore" }, ...sortOption };
  }

  const skip = (Number(page) - 1) * Number(limit);

  let queryBuilder = Hostel.find(filter);

  if (search && !sort_by) {
    queryBuilder = queryBuilder.select({ score: { $meta: "textScore" } });
  }

  const [hostels, total] = await Promise.all([
    queryBuilder
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .populate("owner", "name phone profilePhoto")
      .lean(),
    Hostel.countDocuments(filter),
  ]);

  return {
    hostels,
    pagination: {
      current_page: Number(page),
      total_pages: Math.ceil(total / Number(limit)),
      total_results: total,
      per_page: Number(limit),
    },
  };
};