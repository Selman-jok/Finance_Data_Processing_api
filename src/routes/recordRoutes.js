
const express = require('express');
const router = express.Router();
const {
  createRecord,
  getAllRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  permanentDeleteRecord
} = require('../controllers/recordController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(protect);

// Admin only - Create, Update, Delete

router.post('/', authorize('admin'), createRecord);
router.put('/:id', authorize('admin'), updateRecord);
router.delete('/:id', authorize('admin'), deleteRecord);
router.delete('/:id/permanent', authorize('admin'), permanentDeleteRecord);

// Analyst and Admin can read records
router.get('/', authorize('analyst', 'admin'), getAllRecords);
router.get('/:id', authorize('analyst', 'admin'), getRecordById);

module.exports = router;