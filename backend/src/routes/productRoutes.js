const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');
const { protect } = require('../utils/authMiddleware');
const validate = require('../middleware/validate');
const { productSchema } = require('../schemas/productSchema');

const upload = require('../middleware/upload');

router.get('/', ProductController.getAllProducts);           // customers — stock > 0 only
router.get('/admin/all', protect, ProductController.getAllProductsAdmin); // admin — all products
router.get('/:id', ProductController.getProductById);

// Protected Admin Routes
router.post('/', protect, upload.single('image'), validate(productSchema), ProductController.createProduct);
router.put('/:id', protect, upload.single('image'), validate(productSchema), ProductController.updateProduct);
router.delete('/:id', protect, ProductController.deleteProduct);

module.exports = router;
