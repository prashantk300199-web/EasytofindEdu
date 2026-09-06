import * as instituteService from '../services/institute.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';

// In your createInstitute controller
export const createInstitute = async (req, res) => {
  console.log('📍 createInstitute controller called');
  console.log('📍 req.body:', req.body);
  console.log('📍 req.files:', req.files);
  console.log('📍 req.user:', req.user);      // This will be undefined for institute owners
  console.log('📍 req.owner:', req.owner);   // This is what you need for institute owners
  
  try {
    // Use req.owner for institute owners instead of req.user
    const userId = req.owner?._id || req.user?._id;
    if (!userId) {
      return res.status(400).json(new ApiResponse(400, 'User ID not found'));
    }
    
    const institute = await instituteService.createInstituteService(req.body, userId, req.files);
    console.log('📍 Institute created:', institute);
    return res.status(201).json(new ApiResponse(201, 'Institute created successfully', institute));
  } catch (error) {
    console.error('📍 Error in createInstitute:', error);
    return res.status(500).json(new ApiResponse(500, 'Internal server error', { error: error.message }));
  }
};



export const getInstitutes = async (req, res) => {
  console.log('📍 getInstitutes controller called');
  console.log('📍 Query params:', req.query);
  
  try {
    const { page = 1, limit = 10, sortBy = '-createdAt', ...filters } = req.query;
    console.log('📍 Filters:', filters);
    
    const result = await instituteService.getInstitutesService(filters, page, limit, sortBy);
    console.log('📍 Service result:', result);
    
    // Make sure we're sending the actual data
    if (!result || !result.data) {
      console.log('📍 No data found in result');
      return res.status(200).json(new ApiResponse(200, 'No institutes found', {
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        }
      }));
    }
    
    console.log('📍 Sending response with data');
    return res.status(200).json(new ApiResponse(200, 'Institutes fetched successfully', result));
  } catch (error) {
    console.error('📍 Error in getInstitutes:', error);
    return res.status(500).json(new ApiResponse(500, 'Internal server error'));
  }
};


export const getInstituteById = async (req, res) => {
  console.log('📍 getInstituteById controller called');
  console.log('📍 Request params:', req.params);
  console.log('📍 Institute ID from URL:', req.params.id);
  
  try {
    const institute = await instituteService.getInstituteByIdService(req.params.id);
    console.log('📍 Institute found in service:', institute?._id);
    
    // Check if institute is actually returned
    if (!institute) {
      console.log('📍 No institute returned from service');
      return res.status(404).json(new ApiResponse(404, 'Institute not found'));
    }
    
    console.log('📍 Sending institute response');
    return res.status(200).json(new ApiResponse(200, 'Institute fetched successfully', institute));
  } catch (error) {
    console.error('📍 Error in getInstituteById:', error);
    if (error instanceof ApiError) {
      console.log('📍 ApiError caught:', error.message);
      return res.status(error.statusCode).json(new ApiResponse(error.statusCode, error.message));
    }
    return res.status(500).json(new ApiResponse(500, 'Internal server error'));
  }
};






// With this:
export const updateInstitute = async (req, res) => {
  console.log('📍 updateInstitute controller called');
  try {
    // Use req.owner for institute owners instead of req.user
    const userId = req.owner?._id || req.user?._id;
    if (!userId) {
      return res.status(400).json(new ApiResponse(400, 'User ID not found'));
    }
    
    const institute = await instituteService.updateInstituteService(req.params.id, req.body, userId, req.files);
    console.log('📍 Institute updated:', institute?._id);
    return res.status(200).json(new ApiResponse(200, 'Institute updated successfully', institute));
  } catch (error) {
    console.error('📍 Error in updateInstitute:', error);
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(new ApiResponse(error.statusCode, error.message));
    }
    return res.status(500).json(new ApiResponse(500, 'Internal server error'));
  }
};

export const deleteInstitute = asyncHandler(async (req, res) => {
  const institute = await instituteService.deleteInstituteService(req.params.id);
  return res.status(200).json(new ApiResponse(200, 'Institute deleted successfully', institute));
});

// Replace createCourse:
export const createCourse = async (req, res) => {
  try {
    console.log('📍 createCourse controller called');
    console.log('📍 req.body:', req.body);
    console.log('📍 req.files:', req.files);
    
    // Use req.owner for institute owners instead of req.user
    const userId = req.owner?._id || req.user?._id;
    if (!userId) {
      return res.status(400).json(new ApiResponse(400, 'User ID not found'));
    }
    
    // Parse JSON fields if they're strings
    let courseData = { ...req.body };
    
    // Handle image upload
    if (req.files?.image) {
      courseData.image = extractImageData(req.files.image[0]);
      console.log('📍 Course image processed:', courseData.image);
    }
    
    const course = await instituteService.createCourseService(courseData, userId, req.files);
    return res.status(201).json(new ApiResponse(201, 'Course created successfully', course));
  } catch (error) {
    console.error('📍 Course creation error:', error);
    return res.status(500).json(new ApiResponse(500, 'Failed to create course', { error: error.message }));
  }
};

export const getCourseById = async (req, res) => {
  console.log('📍 getCourseById controller called with id:', req.params.id);
  try {
    const course = await instituteService.getCourseByIdService(req.params.id);
    console.log('📍 Course found:', course?._id);
    if (!course) {
      return res.status(404).json(new ApiResponse(404, 'Course not found'));
    }
    return res.status(200).json(new ApiResponse(200, 'Course fetched successfully', course));
  } catch (error) {
    console.error('📍 Error in getCourseById:', error);
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(new ApiResponse(error.statusCode, error.message));
    }
    return res.status(500).json(new ApiResponse(500, 'Internal server error'));
  }
};

export const updateCourse = async (req, res) => {
  console.log('📍 updateCourse controller called');
  try {
    const course = await instituteService.updateCourseService(req.params.id, req.body, req.files);
    console.log('📍 Course updated:', course?._id);
    return res.status(200).json(new ApiResponse(200, 'Course updated successfully', course));
  } catch (error) {
    console.error('📍 Error in updateCourse:', error);
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(new ApiResponse(error.statusCode, error.message));
    }
    return res.status(500).json(new ApiResponse(500, 'Internal server error'));
  }
};

export const getCourses = async (req, res) => {
  console.log('📍 getCourses controller called');
  console.log('📍 Query params:', req.query);
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await instituteService.getCoursesService(page, limit);
    console.log('📍 Courses fetched:', result);
    return res.status(200).json(new ApiResponse(200, 'Courses fetched successfully', result));
  } catch (error) {
    console.error('📍 Error in getCourses:', error);
    return res.status(500).json(new ApiResponse(500, 'Internal server error'));
  }
};

export const deleteCourse = async (req, res) => {
  console.log('📍 deleteCourse controller called');
  try {
    const course = await instituteService.deleteCourseService(req.params.id);
    console.log('📍 Course deleted:', course?._id);
    return res.status(200).json(new ApiResponse(200, 'Course deleted successfully', course));
  } catch (error) {
    console.error('📍 Error in deleteCourse:', error);
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(new ApiResponse(error.statusCode, error.message));
    }
    return res.status(500).json(new ApiResponse(500, 'Internal server error'));
  }
};


export const createBatch = async (req, res) => {
  console.log('📍 createBatch controller called');
  console.log('📍 req.body:', req.body);
  
  try {
    const batch = await instituteService.createBatchService(req.body);
    console.log('📍 Batch created:', batch?._id);
    return res.status(201).json(new ApiResponse(201, 'Batch created successfully', batch));
  } catch (error) {
    console.error('📍 Batch creation error:', error);
    return res.status(500).json(new ApiResponse(500, 'Failed to create batch', { error: error.message }));
  }
};

export const getBatches = async (req, res) => {
  console.log('📍 getBatches controller called');
  console.log('📍 Query params:', req.query);
  
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await instituteService.getBatchesService(page, limit);
    console.log('📍 Batches fetched:', result?.data?.length || 0);
    return res.status(200).json(new ApiResponse(200, 'Batches fetched successfully', result));
  } catch (error) {
    console.error('📍 Error in getBatches:', error);
    return res.status(500).json(new ApiResponse(500, 'Internal server error'));
  }
};

export const getBatchById = async (req, res) => {
  console.log('📍 getBatchById controller called with id:', req.params.id);
  
  try {
    const batch = await instituteService.getBatchByIdService(req.params.id);
    console.log('📍 Batch found:', batch?._id);
    
    if (!batch) {
      return res.status(404).json(new ApiResponse(404, 'Batch not found'));
    }
    
    return res.status(200).json(new ApiResponse(200, 'Batch fetched successfully', batch));
  } catch (error) {
    console.error('📍 Error in getBatchById:', error);
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(new ApiResponse(error.statusCode, error.message));
    }
    return res.status(500).json(new ApiResponse(500, 'Internal server error'));
  }
};

export const updateBatch = async (req, res) => {
  console.log('📍 updateBatch controller called');
  console.log('📍 Batch ID:', req.params.id);
  console.log('📍 Update data:', req.body);
  
  try {
    const batch = await instituteService.updateBatchService(req.params.id, req.body);
    console.log('📍 Batch updated:', batch?._id);
    return res.status(200).json(new ApiResponse(200, 'Batch updated successfully', batch));
  } catch (error) {
    console.error('📍 Error in updateBatch:', error);
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(new ApiResponse(error.statusCode, error.message));
    }
    return res.status(500).json(new ApiResponse(500, 'Internal server error'));
  }
};

export const deleteBatch = async (req, res) => {
  console.log('📍 deleteBatch controller called');
  console.log('📍 Batch ID:', req.params.id);
  
  try {
    const batch = await instituteService.deleteBatchService(req.params.id);
    console.log('📍 Batch deleted:', batch?._id);
    return res.status(200).json(new ApiResponse(200, 'Batch deleted successfully', batch));
  } catch (error) {
    console.error('📍 Error in deleteBatch:', error);
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(new ApiResponse(error.statusCode, error.message));
    }
    return res.status(500).json(new ApiResponse(500, 'Internal server error'));
  }
};

export const createFeeStructure = async (req, res) => {
  console.log('📍 createFeeStructure controller called');
  console.log('📍 req.body:', req.body);
  
  try {
    const feeStructure = await instituteService.createFeeStructureService(req.body);
    console.log('📍 Fee structure created:', feeStructure?._id);
    return res.status(201).json(new ApiResponse(201, 'Fee structure created successfully', feeStructure));
  } catch (error) {
    console.error('📍 Fee structure creation error:', error);
    return res.status(500).json(new ApiResponse(500, 'Failed to create fee structure', { error: error.message }));
  }
};

export const getFeeStructures = async (req, res) => {
  console.log('📍 getFeeStructures controller called');
  console.log('📍 Query params:', req.query);
  
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await instituteService.getFeeStructuresService(page, limit);
    console.log('📍 Fee structures fetched:', result?.data?.length || 0);
    return res.status(200).json(new ApiResponse(200, 'Fee structures fetched successfully', result));
  } catch (error) {
    console.error('📍 Error in getFeeStructures:', error);
    return res.status(500).json(new ApiResponse(500, 'Internal server error'));
  }
};

export const getFeeStructureById = async (req, res) => {
  console.log('📍 getFeeStructureById controller called with id:', req.params.id);
  
  try {
    const feeStructure = await instituteService.getFeeStructureByIdService(req.params.id);
    console.log('📍 Fee structure found:', feeStructure?._id);
    
    if (!feeStructure) {
      return res.status(404).json(new ApiResponse(404, 'Fee structure not found'));
    }
    
    return res.status(200).json(new ApiResponse(200, 'Fee structure fetched successfully', feeStructure));
  } catch (error) {
    console.error('📍 Error in getFeeStructureById:', error);
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(new ApiResponse(error.statusCode, error.message));
    }
    return res.status(500).json(new ApiResponse(500, 'Internal server error'));
  }
};

export const updateFeeStructure = async (req, res) => {
  console.log('📍 updateFeeStructure controller called');
  console.log('📍 Fee structure ID:', req.params.id);
  console.log('📍 Update data:', req.body);
  
  try {
    const feeStructure = await instituteService.updateFeeStructureService(req.params.id, req.body);
    console.log('📍 Fee structure updated:', feeStructure?._id);
    return res.status(200).json(new ApiResponse(200, 'Fee structure updated successfully', feeStructure));
  } catch (error) {
    console.error('📍 Error in updateFeeStructure:', error);
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(new ApiResponse(error.statusCode, error.message));
    }
    return res.status(500).json(new ApiResponse(500, 'Internal server error'));
  }
};

export const deleteFeeStructure = async (req, res) => {
  console.log('📍 deleteFeeStructure controller called');
  console.log('📍 Fee structure ID:', req.params.id);
  
  try {
    const feeStructure = await instituteService.deleteFeeStructureService(req.params.id);
    console.log('📍 Fee structure deleted:', feeStructure?._id);
    return res.status(200).json(new ApiResponse(200, 'Fee structure deleted successfully', feeStructure));
  } catch (error) {
    console.error('📍 Error in deleteFeeStructure:', error);
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(new ApiResponse(error.statusCode, error.message));
    }
    return res.status(500).json(new ApiResponse(500, 'Internal server error'));
  }
};
export const createResult = async (req, res) => {
  console.log('📍 createResult controller called');
  console.log('📍 req.body:', req.body);
  console.log('📍 req.files:', req.files);
  
  try {
    const result = await instituteService.createResultService(req.body, req.files);
    console.log('📍 Result created:', result?._id);
    return res.status(201).json(new ApiResponse(201, 'Result created successfully', result));
  } catch (error) {
    console.error('📍 Result creation error:', error);
    return res.status(500).json(new ApiResponse(500, 'Failed to create result', { error: error.message }));
  }
};

export const getResults = async (req, res) => {
  console.log('📍 getResults controller called');
  console.log('📍 Query params:', req.query);
  
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await instituteService.getResultsService(page, limit);
    console.log('📍 Results fetched:', result?.data?.length || 0);
    return res.status(200).json(new ApiResponse(200, 'Results fetched successfully', result));
  } catch (error) {
    console.error('📍 Error in getResults:', error);
    return res.status(500).json(new ApiResponse(500, 'Internal server error'));
  }
};

export const getResultById = async (req, res) => {
  console.log('📍 getResultById controller called with id:', req.params.id);
  
  try {
    const result = await instituteService.getResultByIdService(req.params.id);
    console.log('📍 Result found:', result?._id);
    
    if (!result) {
      return res.status(404).json(new ApiResponse(404, 'Result not found'));
    }
    
    return res.status(200).json(new ApiResponse(200, 'Result fetched successfully', result));
  } catch (error) {
    console.error('📍 Error in getResultById:', error);
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(new ApiResponse(error.statusCode, error.message));
    }
    return res.status(500).json(new ApiResponse(500, 'Internal server error'));
  }
};

export const updateResult = async (req, res) => {
  console.log('📍 updateResult controller called');
  console.log('📍 Result ID:', req.params.id);
  console.log('📍 Update data:', req.body);
  console.log('📍 Files:', req.files);
  
  try {
    const result = await instituteService.updateResultService(req.params.id, req.body, req.files);
    console.log('📍 Result updated:', result?._id);
    return res.status(200).json(new ApiResponse(200, 'Result updated successfully', result));
  } catch (error) {
    console.error('📍 Error in updateResult:', error);
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(new ApiResponse(error.statusCode, error.message));
    }
    return res.status(500).json(new ApiResponse(500, 'Internal server error'));
  }
};

export const deleteResult = async (req, res) => {
  console.log('📍 deleteResult controller called');
  console.log('📍 Result ID:', req.params.id);
  
  try {
    const result = await instituteService.deleteResultService(req.params.id);
    console.log('📍 Result deleted:', result?._id);
    return res.status(200).json(new ApiResponse(200, 'Result deleted successfully', result));
  } catch (error) {
    console.error('📍 Error in deleteResult:', error);
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(new ApiResponse(error.statusCode, error.message));
    }
    return res.status(500).json(new ApiResponse(500, 'Internal server error'));
  }
};


// Location Controllers
// In controllers/institute.controller.js
export const getCities = async (req, res) => {  // Remove asyncHandler wrapper
  console.log('📍 getCities controller called');
  try {
    const cities = await instituteService.getCitiesService();
    console.log('📍 Cities received:', cities?.length || 0);
    
    if (!cities || cities.length === 0) {
      return res.status(200).json(new ApiResponse(200, 'No cities found', []));
    }
    
    return res.status(200).json(new ApiResponse(200, 'Cities fetched successfully', cities));
  } catch (error) {
    console.error('📍 Error in getCities:', error);
    return res.status(500).json(new ApiResponse(500, 'Internal server error'));
  }
};







export const getAreasByCity = async (req, res) => {
  try {
    const areas = await instituteService.getAreasByCityService(req.params.cityId);
    return res.status(200).json(new ApiResponse(200, 'Areas fetched successfully', areas));
  } catch (error) {
    console.error('📍 Error in getAreasByCity:', error);
    return res.status(500).json(new ApiResponse(500, 'Internal server error'));
  }
};

export const getSubAreasByArea = async (req, res) => {
  console.log('📍 getSubAreasByArea controller called with areaId:', req.params.areaId);
  try {
    const subAreas = await instituteService.getSubAreasByAreaService(req.params.areaId);
    console.log('📍 SubAreas received:', subAreas?.length || 0);
    
    if (!subAreas || subAreas.length === 0) {
      return res.status(200).json(new ApiResponse(200, 'No subareas found', []));
    }
    
    return res.status(200).json(new ApiResponse(200, 'Sub areas fetched successfully', subAreas));
  } catch (error) {
    console.error('📍 Error in getSubAreasByArea:', error);
    return res.status(500).json(new ApiResponse(500, 'Internal server error'));
  }
};


// Enrollment Controller
export const enrollStudentInBatch = asyncHandler(async (req, res) => {
  const batch = await instituteService.enrollStudentInBatchService(req.params.batchId);
  return res.status(200).json(new ApiResponse(200, 'Student enrolled successfully', batch));
});
