const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('../utils/cloudinary');
const upload = multer({ storage });

const {
    createProduct,
    getProducts,
    updateProduct,
    deleteProduct,
    getProductById,
    filterProducts
} = require('../controllers/productController');

router.post('/', upload.single('image'), createProduct);
router.get('/', getProducts);
router.get('/filter', filterProducts);
router.get('/:id', getProductById);
router.put('/:id', upload.single('image'), updateProduct);
router.delete('/:id', deleteProduct);
router.get('/filter/advanced', filterProducts);


module.exports = router;