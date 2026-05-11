const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/SettingsController');
const { protect } = require('../utils/authMiddleware');

router.get('/status', SettingsController.getStatus);              // public
router.patch('/', protect, SettingsController.updateSettings);    // admin only

module.exports = router;
