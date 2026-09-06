import express from 'express';
import {
  getCategories,
  getCategoryDynamicFields,
  getCategorySubcategories
} from '../controllers/category.controller.js';

const router = express.Router();

// Get all categories with subcategories
router.get('/categories', getCategories);

// Get dynamic fields for a specific category/subcategory
router.get('/categories/fields', getCategoryDynamicFields);

// Get subcategories for a primary category
router.get('/categories/subcategories', getCategorySubcategories);

export default router;
