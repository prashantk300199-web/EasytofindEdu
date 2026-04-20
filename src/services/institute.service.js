import Institute from '../models/Institute.js';
import Course from '../models/Course.js';
import Batch from '../models/Batch.js';
import FeeStructure from '../models/FeeStructure.js';
import Result from '../models/Result.js';
import City from '../models/City.js';
import Area from '../models/Area.js';
import SubArea from '../models/SubArea.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';


// In services/institute.service.js - Update extractImageData function
const extractImageData = (file) => {
  if (!file) {
    console.log('📍 No file provided for image extraction');
    return null;
  }

  console.log('📍 Extracting image data from file:', file);

  // Handle Cloudinary response format
  if (file.filename && file.path) {
    return {
      publicId: file.filename,
      url: file.path
    };
  }

  console.log('📍 Unknown file format:', file);
  return null;
};


// Utility functions
const paginate = (query, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(parseInt(limit));
};

const buildFilterQuery = (filters) => {
  console.log('📍 buildFilterQuery called with filters:', filters);
  const query = {};

  if (filters.city) query['location.city'] = filters.city;
  if (filters.area) query['location.area'] = filters.area;
  if (filters.course) query.courses = filters.course;
  if (filters.mode) query['batches.mode'] = filters.mode;
  if (filters.scholarshipAvailable) query['feeStructures.scholarshipAvailable'] = filters.scholarshipAvailable === 'true';

  // Facility filtering
  if (filters.facilities) {
    try {
      const facilityFilters = JSON.parse(filters.facilities);
      Object.keys(facilityFilters).forEach(key => {
        if (facilityFilters[key]) {
          query[`facilities.${key}`] = true;
        }
      });
    } catch (e) {
      console.error('📍 Error parsing facilities filter:', e);
    }
  }

  console.log('📍 Final query built:', query);
  return query;
};


// Update createInstituteService function
export const createInstituteService = async (data, userId, files) => {
  console.log('📍 createInstituteService called');
  console.log('📍 Original data:', data);
  console.log('📍 Files received:', files);

  // Parse JSON strings back to objects if needed
  let parsedData = { ...data };

  try {
    if (typeof data.location === 'string') {
      parsedData.location = JSON.parse(data.location);
    }
    if (typeof data.facilities === 'string') {
      parsedData.facilities = JSON.parse(data.facilities);
    }
    if (typeof data.academicInfo === 'string') {
      parsedData.academicInfo = JSON.parse(data.academicInfo);
    }
    if (typeof data.transparency === 'string') {
      parsedData.transparency = JSON.parse(data.transparency);
    }
  } catch (parseError) {
    console.error('📍 Error parsing JSON strings:', parseError);
  }

  console.log('📍 Parsed data:', parsedData);

  // Handle image uploads
  if (files?.logo) {
    console.log('📍 Processing logo file:', files.logo);
    const logoFile = Array.isArray(files.logo) ? files.logo[0] : files.logo;
    parsedData.logo = extractImageData(logoFile);
    console.log('📍 Logo processed:', parsedData.logo);
  }

  if (files?.coverImage) {
    console.log('📍 Processing coverImage file:', files.coverImage);
    const coverFile = Array.isArray(files.coverImage) ? files.coverImage[0] : files.coverImage;
    parsedData.coverImage = extractImageData(coverFile);
    console.log('📍 Cover image processed:', parsedData.coverImage);
  }

  parsedData.createdBy = userId;
  console.log('📍 Final data to save:', parsedData);

  try {
    const institute = await Institute.create(parsedData);
    console.log('📍 Institute saved successfully:', institute._id);
    return institute;
  } catch (error) {
    console.error('📍 Error saving institute:', error);
    throw error;
  }
};

export const getInstitutesService = async (filters, page = 1, limit = 10, sortBy = '-createdAt') => {
  console.log('📍 getInstitutesService called');
  console.log('📍 Filters:', filters);

  try {
    const query = buildFilterQuery(filters);
    console.log('📍 Query built:', query);

    let dbQuery = Institute.find(query);

    if (sortBy) dbQuery.sort(sortBy);

    const institutes = await paginate(dbQuery, page, limit)
      .populate([
        'location.city',
        'location.area',
        'location.subarea',
        'courses'
      ]);

    console.log('📍 Institutes found:', institutes.length);

    const total = await Institute.countDocuments(query);
    console.log('📍 Total count:', total);

    const result = {
      data: institutes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };

    console.log('📍 Returning result:', result);
    return result;
  } catch (error) {
    console.error('📍 Error in getInstitutesService:', error);
    throw error;
  }
};


export const getInstituteByIdService = async (id) => {
  console.log('📍 getInstituteByIdService called with id:', id);

  try {
    const institute = await Institute.findById(id)
      .populate([
        'location.city',
        'location.area',
        'location.subarea',
        'courses',
        'createdBy'
      ]);

    console.log('📍 Institute lookup result:', institute);

    if (!institute) {
      console.log('📍 Institute not found for id:', id);
      throw new ApiError(404, 'Institute not found');
    }

    console.log('📍 Returning institute:', institute._id);
    return institute;
  } catch (error) {
    console.error('📍 Error in getInstituteByIdService:', error);
    throw error;
  }
};




export const updateInstituteService = async (id, data, userId, files) => {
  const institute = await Institute.findById(id);
  if (!institute) {
    throw new ApiError(404, 'Institute not found');
  }

  // Handle image uploads if provided
  if (files?.logo) {
    data.logo = extractImageData(files.logo[0]);
  }
  if (files?.coverImage) {
    data.coverImage = extractImageData(files.coverImage[0]);
  }

  // Define nested fields for deep merging
  const nestedFields = ['location', 'facilities', 'academicInfo', 'transparency'];

  nestedFields.forEach(field => {
    if (data[field] && typeof data[field] === 'object') {
      const current = institute[field] ? (institute[field].toObject ? institute[field].toObject() : institute[field]) : {};
      institute[field] = { ...current, ...data[field] };
      delete data[field]; // Remove from data so it doesn't get overwritten by basic assignment
    }
  });

  // Assign remaining top-level fields
  Object.assign(institute, data);
  institute.updatedBy = userId;

  await institute.save();
  return institute;
};

export const deleteInstituteService = asyncHandler(async (id) => {
  const institute = await Institute.findByIdAndDelete(id);

  if (!institute) {
    throw new ApiError(404, 'Institute not found');
  }

  return institute;
});

// Course Services
export const createCourseService = async (data, userId, files) => {
  console.log('📍 createCourseService called');
  console.log('📍 Data:', data);
  console.log('📍 Files:', files);

  try {
    // Handle image upload
    if (files?.image) {
      data.image = extractImageData(files.image[0]);
      console.log('📍 Image data extracted:', data.image);
    }

    data.createdBy = userId;
    const course = await Course.create(data);
    console.log('📍 Course created:', course._id);
    return course;
  } catch (error) {
    console.error('📍 Error in createCourseService:', error);
    throw error;
  }
};

export const getCoursesService = async (page = 1, limit = 10) => {
  console.log('📍 getCoursesService called');
  try {
    const courses = await paginate(Course.find(), page, limit);
    const total = await Course.countDocuments();

    const result = {
      data: courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };

    console.log('📍 Courses fetched:', courses.length);
    return result;
  } catch (error) {
    console.error('📍 Error in getCoursesService:', error);
    throw error;
  }
};

export const getCourseByIdService = async (id) => {
  console.log('📍 getCourseByIdService called with id:', id);
  try {
    const course = await Course.findById(id);
    console.log('📍 Course lookup result:', course);

    if (!course) {
      console.log('📍 Course not found for id:', id);
      throw new ApiError(404, 'Course not found');
    }

    return course;
  } catch (error) {
    console.error('📍 Error in getCourseByIdService:', error);
    throw error;
  }
};

export const updateCourseService = async (id, data, files) => {
  console.log('📍 updateCourseService called');
  console.log('📍 Update data:', data);
  console.log('📍 Files:', files);

  try {
    // Handle image upload if provided
    if (files?.image) {
      data.image = extractImageData(files.image[0]);
      console.log('📍 Image updated:', data.image);
    }

    const course = await Course.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    console.log('📍 Course update result:', course?._id);

    if (!course) {
      throw new ApiError(404, 'Course not found');
    }

    return course;
  } catch (error) {
    console.error('📍 Error in updateCourseService:', error);
    throw error;
  }
};

export const deleteCourseService = async (id) => {
  console.log('📍 deleteCourseService called with id:', id);
  try {
    const course = await Course.findByIdAndDelete(id);
    console.log('📍 Course delete result:', course?._id);

    if (!course) {
      throw new ApiError(404, 'Course not found');
    }

    return course;
  } catch (error) {
    console.error('📍 Error in deleteCourseService:', error);
    throw error;
  }
};


// Batch Services
export const createBatchService = async (data) => {
  console.log('📍 createBatchService called');
  console.log('📍 Batch data:', data);

  try {
    const batch = await Batch.create(data);
    console.log('📍 Batch created successfully:', batch._id);
    return batch;
  } catch (error) {
    console.error('📍 Error in createBatchService:', error);
    throw error;
  }
};

export const getBatchesService = async (page = 1, limit = 10) => {
  console.log('📍 getBatchesService called');

  try {
    const batches = await paginate(Batch.find().populate(['institute', 'course']), page, limit);
    const total = await Batch.countDocuments();

    const result = {
      data: batches,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };

    console.log('📍 Batches fetched:', batches.length);
    return result;
  } catch (error) {
    console.error('📍 Error in getBatchesService:', error);
    throw error;
  }
};

export const getBatchByIdService = async (id) => {
  console.log('📍 getBatchByIdService called with id:', id);

  try {
    const batch = await Batch.findById(id).populate(['institute', 'course']);
    console.log('📍 Batch lookup result:', batch);

    if (!batch) {
      console.log('📍 Batch not found for id:', id);
      throw new ApiError(404, 'Batch not found');
    }

    return batch;
  } catch (error) {
    console.error('📍 Error in getBatchByIdService:', error);
    throw error;
  }
};

export const updateBatchService = async (id, data) => {
  console.log('📍 updateBatchService called');
  console.log('📍 Update data:', data);

  try {
    const batch = await Batch.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    console.log('📍 Batch update result:', batch?._id);

    if (!batch) {
      throw new ApiError(404, 'Batch not found');
    }

    return batch;
  } catch (error) {
    console.error('📍 Error in updateBatchService:', error);
    throw error;
  }
};

export const deleteBatchService = async (id) => {
  console.log('📍 deleteBatchService called with id:', id);

  try {
    const batch = await Batch.findByIdAndDelete(id);
    console.log('📍 Batch delete result:', batch?._id);

    if (!batch) {
      throw new ApiError(404, 'Batch not found');
    }

    return batch;
  } catch (error) {
    console.error('📍 Error in deleteBatchService:', error);
    throw error;
  }
};

export const createFeeStructureService = async (data) => {
  console.log('📍 createFeeStructureService called');
  console.log('📍 Fee structure data:', data);

  try {
    const feeStructure = await FeeStructure.create(data);
    console.log('📍 Fee structure created successfully:', feeStructure._id);
    return feeStructure;
  } catch (error) {
    console.error('📍 Error in createFeeStructureService:', error);
    throw error;
  }
};

export const getFeeStructuresService = async (page = 1, limit = 10) => {
  console.log('📍 getFeeStructuresService called');

  try {
    const feeStructures = await paginate(FeeStructure.find().populate(['institute', 'course']), page, limit);
    const total = await FeeStructure.countDocuments();

    const result = {
      data: feeStructures,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };

    console.log('📍 Fee structures fetched:', feeStructures.length);
    return result;
  } catch (error) {
    console.error('📍 Error in getFeeStructuresService:', error);
    throw error;
  }
};

export const getFeeStructureByIdService = async (id) => {
  console.log('📍 getFeeStructureByIdService called with id:', id);

  try {
    const feeStructure = await FeeStructure.findById(id).populate(['institute', 'course']);
    console.log('📍 Fee structure lookup result:', feeStructure);

    if (!feeStructure) {
      console.log('📍 Fee structure not found for id:', id);
      throw new ApiError(404, 'Fee structure not found');
    }

    return feeStructure;
  } catch (error) {
    console.error('📍 Error in getFeeStructureByIdService:', error);
    throw error;
  }
};

export const updateFeeStructureService = async (id, data) => {
  console.log('📍 updateFeeStructureService called');
  console.log('📍 Update data:', data);

  try {
    const feeStructure = await FeeStructure.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    console.log('📍 Fee structure update result:', feeStructure?._id);

    if (!feeStructure) {
      throw new ApiError(404, 'Fee structure not found');
    }

    return feeStructure;
  } catch (error) {
    console.error('📍 Error in updateFeeStructureService:', error);
    throw error;
  }
};

export const deleteFeeStructureService = async (id) => {
  console.log('📍 deleteFeeStructureService called with id:', id);

  try {
    const feeStructure = await FeeStructure.findByIdAndDelete(id);
    console.log('📍 Fee structure delete result:', feeStructure?._id);

    if (!feeStructure) {
      throw new ApiError(404, 'Fee structure not found');
    }

    return feeStructure;
  } catch (error) {
    console.error('📍 Error in deleteFeeStructureService:', error);
    throw error;
  }
}; export const createResultService = async (data, files) => {
  console.log('📍 createResultService called');
  console.log('📍 Data:', data);
  console.log('📍 Files:', files);

  try {
    // Handle image uploads
    if (files?.rankersListImage) {
      data.rankersListImage = extractImageData(files.rankersListImage[0]);
      console.log('📍 Rankers list image processed:', data.rankersListImage);
    }

    if (files?.certificatesImage) {
      data.certificatesImage = extractImageData(files.certificatesImage[0]);
      console.log('📍 Certificates image processed:', data.certificatesImage);
    }

    const result = await Result.create(data);
    console.log('📍 Result created successfully:', result._id);
    return result;
  } catch (error) {
    console.error('📍 Error in createResultService:', error);
    throw error;
  }
};

export const getResultsService = async (page = 1, limit = 10) => {
  console.log('📍 getResultsService called');

  try {
    const results = await paginate(Result.find().populate('institute'), page, limit);
    const total = await Result.countDocuments();

    const resultObj = {
      data: results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };

    console.log('📍 Results fetched:', results.length);
    return resultObj;
  } catch (error) {
    console.error('📍 Error in getResultsService:', error);
    throw error;
  }
};

export const getResultByIdService = async (id) => {
  console.log('📍 getResultByIdService called with id:', id);

  try {
    const result = await Result.findById(id).populate('institute');
    console.log('📍 Result lookup result:', result);

    if (!result) {
      console.log('📍 Result not found for id:', id);
      throw new ApiError(404, 'Result not found');
    }

    return result;
  } catch (error) {
    console.error('📍 Error in getResultByIdService:', error);
    throw error;
  }
};

export const updateResultService = async (id, data, files) => {
  console.log('📍 updateResultService called');
  console.log('📍 Update data:', data);
  console.log('📍 Files:', files);

  try {
    // Handle image uploads if provided
    if (files?.rankersListImage) {
      data.rankersListImage = extractImageData(files.rankersListImage[0]);
      console.log('📍 Rankers list image updated:', data.rankersListImage);
    }

    if (files?.certificatesImage) {
      data.certificatesImage = extractImageData(files.certificatesImage[0]);
      console.log('📍 Certificates image updated:', data.certificatesImage);
    }

    const result = await Result.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    console.log('📍 Result update result:', result?._id);

    if (!result) {
      throw new ApiError(404, 'Result not found');
    }

    return result;
  } catch (error) {
    console.error('📍 Error in updateResultService:', error);
    throw error;
  }
};

export const deleteResultService = async (id) => {
  console.log('📍 deleteResultService called with id:', id);

  try {
    const result = await Result.findByIdAndDelete(id);
    console.log('📍 Result delete result:', result?._id);

    if (!result) {
      throw new ApiError(404, 'Result not found');
    }

    return result;
  } catch (error) {
    console.error('📍 Error in deleteResultService:', error);
    throw error;
  }
};



// In services/institute.service.js
export const getCitiesService = async () => {  // Remove asyncHandler wrapper
  console.log('📍 getCitiesService called');
  try {
    const cities = await City.find().select('name');
    console.log('📍 Cities fetched:', cities.length);
    return cities;
  } catch (error) {
    console.error('📍 Error in getCitiesService:', error);
    throw error;
  }
};




export const getAreasByCityService = async (cityId) => {
  try {
    const areas = await Area.find({ city: cityId }).select('name city');
    return areas;
  } catch (error) {
    console.error('📍 Error in getAreasByCityService:', error);
    throw error;
  }
};


export const getSubAreasByAreaService = async (areaId) => {
  try {
    console.log('📍 getSubAreasByAreaService called with areaId:', areaId);
    const subAreas = await SubArea.find({ area: areaId }).select('name area');
    console.log('📍 SubAreas fetched:', subAreas.length);
    return subAreas;
  } catch (error) {
    console.error('📍 Error in getSubAreasByAreaService:', error);
    throw error;
  }
};


// Enrollment Management
export const enrollStudentInBatchService = asyncHandler(async (batchId) => {
  const batch = await Batch.findById(batchId);
  if (!batch) {
    throw new ApiError(404, 'Batch not found');
  }

  if (batch.seatsAvailable <= 0) {
    throw new ApiError(400, 'No seats available in this batch');
  }

  batch.seatsAvailable -= 1;
  await batch.save();

  return batch;
});


// ============================================================
// OWNER-SCOPED SERVICES
// ============================================================

/**
 * Get all institutes that belong to a specific owner.
 */
export const getMyInstitutesService = async (ownerId, filters = {}, page = 1, limit = 10, sortBy = '-createdAt') => {
  const query = { createdBy: ownerId, ...buildFilterQuery(filters) };
  const institutes = await paginate(Institute.find(query).sort(sortBy), page, limit)
    .populate(['location.city', 'location.area', 'location.subarea', 'courses']);
  const total = await Institute.countDocuments(query);
  return {
    data: institutes,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
  };
};

/**
 * Verify that a given owner owns the given institute.
 * Throws 403 if not.
 */
export const verifyInstituteOwnership = async (instituteId, ownerId) => {
  const institute = await Institute.findOne({ _id: instituteId, createdBy: ownerId });
  if (!institute) throw new ApiError(403, 'You do not have permission to access this institute');
  return institute;
};

/**
 * Verify that a resource (batch/fee-structure/result) belongs to an owner via its institute.
 */
export const verifyResourceOwnership = async (Model, resourceId, ownerId) => {
  const myInstituteIds = await Institute.find({ createdBy: ownerId }).distinct('_id');
  const resource = await Model.findOne({ _id: resourceId, institute: { $in: myInstituteIds } });
  if (!resource) throw new ApiError(403, 'You do not have permission to access this resource');
  return resource;
};

/**
 * Get courses that belong to an owner (by createdBy or via institute).
 */
export const getMyCoursesService = async (ownerId, page = 1, limit = 10, filters = {}) => {
  const myInstituteIds = await Institute.find({ createdBy: ownerId }).distinct('_id');
  const query = {
    $or: [
      { createdBy: ownerId },
      { institute: { $in: myInstituteIds } }
    ],
    ...filters
  };
  const courses = await paginate(Course.find(query).populate('institute'), page, limit);
  const total = await Course.countDocuments(query);
  return {
    data: courses,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
  };
};

/**
 * Create a course linked to a specific institute (with ownership check).
 */
export const createOwnerCourseService = async (data, ownerId, files) => {
  // Verify the institute belongs to this owner
  await verifyInstituteOwnership(data.institute, ownerId);

  if (files?.image) {
    data.image = extractImageData(files.image[0]);
  }
  data.createdBy = ownerId;

  const course = await Course.create(data);
  // Keep Institute.courses array in sync
  await Institute.findByIdAndUpdate(data.institute, { $addToSet: { courses: course._id } });
  return course;
};

/**
 * Update a course with ownership check.
 */
export const updateOwnerCourseService = async (courseId, data, ownerId, files) => {
  const myInstituteIds = await Institute.find({ createdBy: ownerId }).distinct('_id');
  const course = await Course.findOne({
    _id: courseId,
    $or: [{ createdBy: ownerId }, { institute: { $in: myInstituteIds } }]
  });
  if (!course) throw new ApiError(403, 'You do not have permission to update this course');

  if (files?.image) {
    data.image = extractImageData(files.image[0]);
  }

  return Course.findByIdAndUpdate(courseId, data, { new: true, runValidators: true });
};

/**
 * Delete a course with ownership check.
 */
export const deleteOwnerCourseService = async (courseId, ownerId) => {
  const myInstituteIds = await Institute.find({ createdBy: ownerId }).distinct('_id');
  const course = await Course.findOne({
    _id: courseId,
    $or: [{ createdBy: ownerId }, { institute: { $in: myInstituteIds } }]
  });
  if (!course) throw new ApiError(403, 'You do not have permission to delete this course');

  // Remove from institute's courses array
  if (course.institute) {
    await Institute.findByIdAndUpdate(course.institute, { $pull: { courses: course._id } });
  }
  return Course.findByIdAndDelete(courseId);
};

/**
 * Get batches that belong to an owner's institutes.
 */
export const getMyBatchesService = async (ownerId, page = 1, limit = 10, filters = {}) => {
  const myInstituteIds = await Institute.find({ createdBy: ownerId }).distinct('_id');
  const query = { institute: { $in: myInstituteIds }, ...filters };
  const batches = await paginate(Batch.find(query).populate(['institute', 'course']), page, limit);
  const total = await Batch.countDocuments(query);
  return {
    data: batches,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
  };
};

/**
 * Create batch with ownership check on institute.
 */
export const createOwnerBatchService = async (data, ownerId) => {
  await verifyInstituteOwnership(data.institute, ownerId);
  return Batch.create(data);
};

/**
 * Update batch with ownership check.
 */
export const updateOwnerBatchService = async (batchId, data, ownerId) => {
  await verifyResourceOwnership(Batch, batchId, ownerId);
  const batch = await Batch.findByIdAndUpdate(batchId, data, { new: true, runValidators: true });
  if (!batch) throw new ApiError(404, 'Batch not found');
  return batch;
};

/**
 * Delete batch with ownership check.
 */
export const deleteOwnerBatchService = async (batchId, ownerId) => {
  await verifyResourceOwnership(Batch, batchId, ownerId);
  const batch = await Batch.findByIdAndDelete(batchId);
  if (!batch) throw new ApiError(404, 'Batch not found');
  return batch;
};

/**
 * Get fee structures that belong to an owner's institutes.
 */
export const getMyFeeStructuresService = async (ownerId, page = 1, limit = 10, filters = {}) => {
  const myInstituteIds = await Institute.find({ createdBy: ownerId }).distinct('_id');
  const query = { institute: { $in: myInstituteIds }, ...filters };
  const feeStructures = await paginate(FeeStructure.find(query).populate(['institute', 'course']), page, limit);
  const total = await FeeStructure.countDocuments(query);
  return {
    data: feeStructures,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
  };
};

/**
 * Create fee structure with ownership check.
 */
export const createOwnerFeeStructureService = async (data, ownerId) => {
  await verifyInstituteOwnership(data.institute, ownerId);
  return FeeStructure.create(data);
};

/**
 * Update fee structure with ownership check.
 */
export const updateOwnerFeeStructureService = async (id, data, ownerId) => {
  await verifyResourceOwnership(FeeStructure, id, ownerId);
  const fs = await FeeStructure.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!fs) throw new ApiError(404, 'Fee structure not found');
  return fs;
};

/**
 * Delete fee structure with ownership check.
 */
export const deleteOwnerFeeStructureService = async (id, ownerId) => {
  await verifyResourceOwnership(FeeStructure, id, ownerId);
  const fs = await FeeStructure.findByIdAndDelete(id);
  if (!fs) throw new ApiError(404, 'Fee structure not found');
  return fs;
};

/**
 * Get results that belong to an owner's institutes.
 */
export const getMyResultsService = async (ownerId, page = 1, limit = 10, filters = {}) => {
  const myInstituteIds = await Institute.find({ createdBy: ownerId }).distinct('_id');
  const query = { institute: { $in: myInstituteIds }, ...filters };
  const results = await paginate(Result.find(query).populate('institute'), page, limit);
  const total = await Result.countDocuments(query);
  return {
    data: results,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
  };
};

/**
 * Create result with ownership check.
 */
export const createOwnerResultService = async (data, ownerId, files) => {
  await verifyInstituteOwnership(data.institute, ownerId);

  if (files?.rankersListImage) {
    data.rankersListImage = extractImageData(files.rankersListImage[0]);
  }
  if (files?.certificatesImage) {
    data.certificatesImage = extractImageData(files.certificatesImage[0]);
  }
  return Result.create(data);
};

/**
 * Update result with ownership check.
 */
export const updateOwnerResultService = async (id, data, ownerId, files) => {
  await verifyResourceOwnership(Result, id, ownerId);

  if (files?.rankersListImage) {
    data.rankersListImage = extractImageData(files.rankersListImage[0]);
  }
  if (files?.certificatesImage) {
    data.certificatesImage = extractImageData(files.certificatesImage[0]);
  }
  const result = await Result.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!result) throw new ApiError(404, 'Result not found');
  return result;
};

/**
 * Delete result with ownership check.
 */
export const deleteOwnerResultService = async (id, ownerId) => {
  await verifyResourceOwnership(Result, id, ownerId);
  const result = await Result.findByIdAndDelete(id);
  if (!result) throw new ApiError(404, 'Result not found');
  return result;
};

/**
 * Owner dashboard stats.
 */
export const getOwnerDashboardStatsService = async (ownerId) => {
  const myInstituteIds = await Institute.find({ createdBy: ownerId }).distinct('_id');
  const [totalInstitutes, approvedInstitutes, pendingInstitutes, totalCourses, totalBatches, totalFeeStructures, totalResults] = await Promise.all([
    Institute.countDocuments({ createdBy: ownerId }),
    Institute.countDocuments({ createdBy: ownerId, isApproved: true }),
    Institute.countDocuments({ createdBy: ownerId, isApproved: false }),
    Course.countDocuments({ $or: [{ createdBy: ownerId }, { institute: { $in: myInstituteIds } }] }),
    Batch.countDocuments({ institute: { $in: myInstituteIds } }),
    FeeStructure.countDocuments({ institute: { $in: myInstituteIds } }),
    Result.countDocuments({ institute: { $in: myInstituteIds } })
  ]);
  return { totalInstitutes, approvedInstitutes, pendingInstitutes, totalCourses, totalBatches, totalFeeStructures, totalResults };
};

/**
 * Owner: delete their own institute and cascade.
 */
export const deleteOwnerInstituteService = async (instituteId, ownerId) => {
  await verifyInstituteOwnership(instituteId, ownerId);
  const institute = await Institute.findByIdAndDelete(instituteId);
  if (!institute) throw new ApiError(404, 'Institute not found');
  // Cascade delete
  await Promise.all([
    Batch.deleteMany({ institute: instituteId }),
    FeeStructure.deleteMany({ institute: instituteId }),
    Result.deleteMany({ institute: instituteId }),
    Course.deleteMany({ institute: instituteId })
  ]);
  return institute;
};


// ============================================================
// ADMIN-SCOPED SERVICES
// ============================================================

/**
 * Admin: approve an institute.
 */
export const approveInstituteService = async (id) => {
  const institute = await Institute.findByIdAndUpdate(
    id,
    { isApproved: true, isActive: true, rejectionReason: null },
    { new: true }
  );
  if (!institute) throw new ApiError(404, 'Institute not found');
  return institute;
};

/**
 * Admin: reject an institute.
 */
export const rejectInstituteService = async (id, reason) => {
  const institute = await Institute.findByIdAndUpdate(
    id,
    { isApproved: false, isActive: false, rejectionReason: reason || 'Not specified' },
    { new: true }
  );
  if (!institute) throw new ApiError(404, 'Institute not found');
  return institute;
};

/**
 * Admin: toggle institute active status.
 */
export const toggleInstituteActiveService = async (id) => {
  const institute = await Institute.findById(id);
  if (!institute) throw new ApiError(404, 'Institute not found');
  institute.isActive = !institute.isActive;
  await institute.save();
  return institute;
};

/**
 * Admin: get overall institute platform stats.
 */
export const getInstituteStatsService = async () => {
  const [total, approved, pending, active, totalCourses, totalBatches] = await Promise.all([
    Institute.countDocuments(),
    Institute.countDocuments({ isApproved: true }),
    Institute.countDocuments({ isApproved: false }),
    Institute.countDocuments({ isActive: true }),
    Course.countDocuments(),
    Batch.countDocuments()
  ]);
  return { total, approved, pending, active, totalCourses, totalBatches };
};

/**
 * Admin: hard delete institute + cascade all related.
 */
export const adminDeleteInstituteService = async (id) => {
  const institute = await Institute.findByIdAndDelete(id);
  if (!institute) throw new ApiError(404, 'Institute not found');
  await Promise.all([
    Batch.deleteMany({ institute: id }),
    FeeStructure.deleteMany({ institute: id }),
    Result.deleteMany({ institute: id }),
    Course.deleteMany({ institute: id })
  ]);
  return institute;
};

/**
 * Admin: create course (no ownership restriction, but links to institute).
 */
export const adminCreateCourseService = async (data, adminId, files) => {
  if (files?.image) {
    data.image = extractImageData(files.image[0]);
  }
  const course = await Course.create(data);
  if (data.institute) {
    await Institute.findByIdAndUpdate(data.institute, { $addToSet: { courses: course._id } });
  }
  return course;
};

/**
 * Admin: create batch (no ownership restriction).
 */
export const adminCreateBatchService = async (data) => {
  return Batch.create(data);
};

/**
 * Admin: create fee structure (no ownership restriction).
 */
export const adminCreateFeeStructureService = async (data) => {
  return FeeStructure.create(data);
};

/**
 * Admin: create result (no ownership restriction).
 */
export const adminCreateResultService = async (data, files) => {
  if (files?.rankersListImage) {
    data.rankersListImage = extractImageData(files.rankersListImage[0]);
  }
  if (files?.certificatesImage) {
    data.certificatesImage = extractImageData(files.certificatesImage[0]);
  }
  return Result.create(data);
};

/**
 * Admin: get all institutes (with full filter support, no approval filter).
 */
export const adminGetInstitutesService = async (filters = {}, page = 1, limit = 10, sortBy = '-createdAt') => {
  // Admin can filter by isApproved, isActive etc. from query params without restrictions
  const query = {};
  if (filters.isApproved !== undefined) query.isApproved = filters.isApproved === 'true';
  if (filters.isActive !== undefined) query.isActive = filters.isActive === 'true';
  if (filters.city) query['location.city'] = filters.city;
  if (filters.area) query['location.area'] = filters.area;

  const institutes = await paginate(
    Institute.find(query).sort(sortBy).populate(['location.city', 'location.area', 'location.subarea', 'createdBy']),
    page, limit
  );
  const total = await Institute.countDocuments(query);
  return {
    data: institutes,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
  };
};


// ============================================================
// PUBLIC-SCOPED SERVICES (only approved + active institutes)
// ============================================================

/**
 * Public search: approved + active institutes only.
 */
export const getPublicInstitutesService = async (filters = {}, page = 1, limit = 10, sortBy = '-createdAt') => {
  const baseQuery = { isApproved: true, isActive: true };
  const filterQuery = buildFilterQuery(filters);
  const query = { ...baseQuery, ...filterQuery };

  const institutes = await paginate(
    Institute.find(query).sort(sortBy).populate(['location.city', 'location.area', 'location.subarea', 'courses']),
    page, limit
  );
  const total = await Institute.countDocuments(query);
  return {
    data: institutes,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
  };
};

/**
 * Public: get a single approved+active institute.
 */
export const getPublicInstituteByIdService = async (id) => {
  const institute = await Institute.findOne({ _id: id, isApproved: true, isActive: true })
    .populate(['location.city', 'location.area', 'location.subarea', 'courses', 'createdBy']);
  if (!institute) throw new ApiError(404, 'Institute not found or not available');
  return institute;
};

/**
 * Public: get batches of an approved institute.
 */
export const getPublicBatchesByInstituteService = async (instituteId, page = 1, limit = 10) => {
  // First verify institute is public
  const institute = await Institute.findOne({ _id: instituteId, isApproved: true, isActive: true });
  if (!institute) throw new ApiError(404, 'Institute not found or not available');

  const query = { institute: instituteId, isActive: true };
  const batches = await paginate(Batch.find(query).populate('course'), page, limit);
  const total = await Batch.countDocuments(query);
  return {
    data: batches,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
  };
};

/**
 * Public: get fee structures of an approved institute.
 */
export const getPublicFeeStructuresByInstituteService = async (instituteId, page = 1, limit = 10) => {
  const institute = await Institute.findOne({ _id: instituteId, isApproved: true, isActive: true });
  if (!institute) throw new ApiError(404, 'Institute not found or not available');

  const feeStructures = await paginate(
    FeeStructure.find({ institute: instituteId }).populate('course'),
    page, limit
  );
  const total = await FeeStructure.countDocuments({ institute: instituteId });
  return {
    data: feeStructures,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
  };
};

/**
 * Public: get results of an approved institute.
 */
export const getPublicResultsByInstituteService = async (instituteId, page = 1, limit = 10) => {
  const institute = await Institute.findOne({ _id: instituteId, isApproved: true, isActive: true });
  if (!institute) throw new ApiError(404, 'Institute not found or not available');

  const results = await paginate(Result.find({ institute: instituteId }), page, limit);
  const total = await Result.countDocuments({ institute: instituteId });
  return {
    data: results,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
  };
};

/**
 * Public: get courses of an approved institute.
 */
export const getPublicCoursesByInstituteService = async (instituteId, page = 1, limit = 10) => {
  const institute = await Institute.findOne({ _id: instituteId, isApproved: true, isActive: true });
  if (!institute) throw new ApiError(404, 'Institute not found or not available');

  const courses = await paginate(Course.find({ institute: instituteId }), page, limit);
  const total = await Course.countDocuments({ institute: instituteId });
  return {
    data: courses,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
  };
};
