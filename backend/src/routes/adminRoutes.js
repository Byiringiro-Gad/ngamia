const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const { protect } = require('../utils/authMiddleware');

router.post('/login', AdminController.loginAdmin);
router.get('/me', protect, AdminController.getMe);
router.get('/export/daily', protect, AdminController.exportDailyManifest);
router.post('/seed', AdminController.seedAdmin);
router.post('/reset-password', AdminController.resetAdminPassword); // temp reset route
router.delete('/orders/reset', protect, AdminController.resetAllOrders); // wipe all orders

module.exports = router;
