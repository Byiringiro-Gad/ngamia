const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/OrderController');
const { protect } = require('../utils/authMiddleware');
const validate = require('../middleware/validate');
const { orderSchema, updateOrderItemsSchema } = require('../schemas/orderSchema');

router.post('/', validate(orderSchema), OrderController.createOrder);
router.get('/check/:phone', OrderController.getOrderByPhone); // customer check existing order
router.put('/:id/items', validate(updateOrderItemsSchema), OrderController.updateOrderItems);   // customer edit existing order

// Protected Admin Routes
router.get('/', protect, OrderController.getOrders);
router.patch('/:id/status', protect, OrderController.updateOrderStatus);
router.delete('/:id', protect, OrderController.deleteOrder);

module.exports = router;
