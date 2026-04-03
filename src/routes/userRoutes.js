const express = require('express');
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserStatus,
  getMyProfile,
  updateMyProfile
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(protect);

// Self-profile routes (accessible by authenticated users)
router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);

// Admin-only routes
router.use(authorize('admin'));

// User management routes (admin only)
router.post('/', createUser);                    
router.get('/', getAllUsers);                    
router.get('/:id', getUserById);                 
router.put('/:id', updateUser);                  
router.delete('/:id', deleteUser);               
router.patch('/:id/status', updateUserStatus);  

module.exports = router;