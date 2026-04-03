const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
  getCategorySummary,
  getMonthlyTrends,
  getRecentActivity
} = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');

// All dashboard routes require authentication
router.use(protect);

// Dashboard endpoints
router.get('/summary', getDashboardSummary);
router.get('/category-summary', getCategorySummary);
router.get('/trends', getMonthlyTrends);
router.get('/recent-activity', getRecentActivity);

module.exports = router;