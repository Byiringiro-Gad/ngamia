const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/OrderController');
const { protect } = require('../utils/authMiddleware');

router.post('/', OrderController.createOrder);
router.get('/check/:phone', OrderController.getOrderByPhone); // customer check existing order
router.put('/:id/items', OrderController.updateOrderItems);   // customer edit existing order

// Protected Admin Routes
router.get('/', protect, OrderController.getOrders);
router.patch('/:id/status', protect, OrderController.updateOrderStatus);
router.delete('/:id', protect, OrderController.deleteOrder);

module.exports = router;
