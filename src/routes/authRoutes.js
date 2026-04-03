const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// Public routes
router.post('/login', authController.login);

// Protected routes (require authentication)
router.get('/me', protect, authController.getMe);
router.post('/logout', protect, authController.logout);

module.exports = router;