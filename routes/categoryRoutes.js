const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

const {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
} = require('../controllers/categoryController');

// POST /api/categories
router.post('/', protect, authorize('admin'), createCategory);
console.log('typeof protect:', typeof protect); 
console.log('typeof authorize:', typeof authorize);

// GET /api/categories
router.get('/', getCategories);

// GET /api/categories/:id
router.get('/:id', getCategoryById);

// PUT /api/categories/:id
router.put('/:id', protect, authorize('admin'), updateCategory);

// DELETE /api/categories/:id
router.delete('/:id', protect, authorize('admin'), deleteCategory);

module.exports = router;