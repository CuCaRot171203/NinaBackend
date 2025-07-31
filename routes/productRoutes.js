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
    filterProducts,
    getRandomProducts,
    exportEnglishProductNames 
} = require('../controllers/productController');

router.post('/', upload.single('image'), createProduct);
router.get('/', getProducts);
router.get('/filter', filterProducts);
router.get('/filter/advanced', filterProducts);
router.get('/random', getRandomProducts);
router.get('/export/english-names', exportEnglishProductNames);
router.get('/:id', getProductById);
router.put('/:id', upload.single('image'), updateProduct);
router.delete('/:id', deleteProduct);


module.exports = router;