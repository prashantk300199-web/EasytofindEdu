import { categoryFieldsConfig, getCategoryFields, getSubcategories } from '../config/categoryFields.config.js';

/**
 * Get all available categories and their subcategories
 */
export const getCategories = async (req, res) => {
  try {
    const categories = Object.keys(categoryFieldsConfig).map(key => ({
      value: key,
      label: categoryFieldsConfig[key].label,
      subcategories: Object.keys(categoryFieldsConfig[key].subcategories || {}).map(subKey => ({
        value: subKey,
        label: categoryFieldsConfig[key].subcategories[subKey].label
      }))
    }));

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve categories',
      error: error.message
    });
  }
};

/**
 * Get dynamic fields for a specific category and subcategory
 */
export const getCategoryDynamicFields = async (req, res) => {
  try {
    const { primaryCategory, subcategory } = req.query;

    if (!primaryCategory || !subcategory) {
      return res.status(400).json({
        success: false,
        message: 'Primary category and subcategory are required'
      });
    }

    const fields = getCategoryFields(primaryCategory, subcategory);

    res.status(200).json({
      success: true,
      data: {
        primaryCategory,
        subcategory,
        fields
      }
    });
  } catch (error) {
    console.error('Get category fields error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve category fields',
      error: error.message
    });
  }
};

/**
 * Get subcategories for a primary category
 */
export const getCategorySubcategories = async (req, res) => {
  try {
    const { primaryCategory } = req.query;

    if (!primaryCategory) {
      return res.status(400).json({
        success: false,
        message: 'Primary category is required'
      });
    }

    const subcategories = getSubcategories(primaryCategory);

    res.status(200).json({
      success: true,
      data: subcategories
    });
  } catch (error) {
    console.error('Get subcategories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve subcategories',
      error: error.message
    });
  }
};
