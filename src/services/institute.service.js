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




export const updateInstituteService = asyncHandler(async (id, data, userId, files) => {
    // Handle image uploads if provided
    if (files?.logo) {
      data.logo = extractImageData(files.logo[0]);
    }
    if (files?.coverImage) {
      data.coverImage = extractImageData(files.coverImage[0]);
    }
    
    const institute = await Institute.findByIdAndUpdate(
      id,
      { ...data, updatedBy: userId },
      { new: true, runValidators: true }
    );
    
    if (!institute) {
      throw new ApiError(404, 'Institute not found');
    }
    
    return institute;
  });

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
};export const createResultService = async (data, files) => {
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
