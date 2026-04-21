const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');
const { protect } = require('../utils/authMiddleware');

router.get('/', ProductController.getAllProducts);
router.get('/:id', ProductController.getProductById);

// Protected Admin Routes
router.post('/', protect, ProductController.createProduct);
router.put('/:id', protect, ProductController.updateProduct);
router.delete('/:id', protect, ProductController.deleteProduct);

module.exports = router;
