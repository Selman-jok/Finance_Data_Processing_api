const { User, userRoles, userStatus } = require('../models/User');
const bcrypt = require('bcryptjs');

//desc: getAllUsers
//access : only admin
const getAllUsers = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filters
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.status) filter.status = req.query.status;
    
    // Search by name or email
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Get users with pagination
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      data: users
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// desc: Get single user by ID (Admin or Self)
// access: only Admin
const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUser = req.user;
    
    // Check if user exists
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check permission: Admin can access any user, users can only access themselves
    if (requestingUser.role !== 'admin' && requestingUser._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only view your own profile.'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get user error:', error);
    
    // Handle invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// desc: Create a new user
// access: Admin only
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, status } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and password'
      });
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Validate role if provided
    if (role && !Object.values(userRoles).includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Must be one of: ${Object.values(userRoles).join(', ')}`
      });
    }

    // Validate status if provided
    if (status && !Object.values(userStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${Object.values(userStatus).join(', ')}`
      });
    }

    //  HASH THE PASSWORD
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with hashed password
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || userRoles.VIEWER,
      status: status || userStatus.ACTIVE,
      createdBy: req.user._id
    });

    console.log('✅ User created successfully with ID:', user._id);

    // Remove password from response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      createdBy: req.user._id
    };

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });

  } catch (error) {
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
};

// desc: Update user (Admin or Self)
// access:Admin only
const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUser = req.user;
    const { name, email, role, status, password } = req.body;
    
    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check permission: Admin can update any user, users can only update themselves
    const isAdmin = requestingUser.role === 'admin';
    const isSelf = requestingUser._id.toString() === userId;
    
    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only update your own profile.'
      });
    }
    
    // If not admin, restrict what they can update
    if (!isAdmin && isSelf) {
      // Non-admin users can only update name and password
      if (name) user.name = name;
      if (password) user.password = password;
      // Cannot update email, role, or status
      if (email && email !== user.email) {
        return res.status(403).json({
          success: false,
          error: 'You cannot change your email. Contact admin for email changes.'
        });
      }
      if (role) {
        return res.status(403).json({
          success: false,
          error: 'You cannot change your role. Contact admin for role changes.'
        });
      }
      if (status) {
        return res.status(403).json({
          success: false,
          error: 'You cannot change your status. Contact admin if you need account changes.'
        });
      }
    }
    
    // Admin can update all fields
    if (isAdmin) {
      if (name) user.name = name;
      if (email) user.email = email;
      if (role) {
        if (!Object.values(userRoles).includes(role)) {
          return res.status(400).json({
            success: false,
            error: `Invalid role. Must be one of: ${Object.values(userRoles).join(', ')}`
          });
        }
        user.role = role;
      }
      if (status) {
        if (!Object.values(userStatus).includes(status)) {
          return res.status(400).json({
            success: false,
            error: `Invalid status. Must be one of: ${Object.values(userStatus).join(', ')}`
          });
        }
        // Prevent admin from deactivating themselves
        if (isSelf && status === userStatus.INACTIVE) {
          return res.status(400).json({
            success: false,
            error: 'You cannot deactivate your own account'
          });
        }
        user.status = status;
      }
      if (password) {
        if (password.length < 6) {
          return res.status(400).json({
            success: false,
            error: 'Password must be at least 6 characters long'
          });
        }
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        // user.password = password;
      }
    }
    
    user.updatedBy = requestingUser._id;
    await user.save();

    const updatedUser = await User.findById(userId).select('-password');

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    
    // Handle duplicate email
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};


// desc: Delete user 
// access:Admin only
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUser = req.user;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === requestingUser._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'You cannot delete your own account'
      });
    }

    //optional: Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete the last admin user'
        });
      }
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: `User ${user.name} (${user.email}) deleted successfully`
    });

  } catch (error) {
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// desc: Update user status (activate/deactivate)
// access:Admin only
const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.params.id;
    const requestingUser = req.user;

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be "active" or "inactive"'
      });
    }

    // Find user (to check existence and self-deactivation)
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Prevent self-deactivation
    if (user._id.toString() === requestingUser._id.toString() && status === 'inactive') {
      return res.status(400).json({ success: false, error: 'You cannot deactivate yourself' });
    }

    // Direct update using findByIdAndUpdate (no pre-save hooks triggered)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        status,
        updatedBy: requestingUser._id,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      data: updatedUser
    });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// desc: Get current login user profile
// access:all can get there own profile
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// desc: Update my own profile
// access:all can updated there profile but restrictive only name and password they can change not allow status , role and email 
const updateMyProfile = async (req, res) => {
  try {
    const allowedFields = ['name', 'password'];
    const restrictedFields = ['email', 'role', 'status'];

    const requestFields = Object.keys(req.body);

    // Check for restricted fields
    const forbiddenFields = requestFields.filter(field =>
      restrictedFields.includes(field)
    );

    if (forbiddenFields.length > 0) {
      return res.status(403).json({
        success: false,
        error: `You are not allowed to update these fields: ${forbiddenFields.join(', ')}`
      });
    }

    // Check for invalid/unknown fields
    const invalidFields = requestFields.filter(field =>
      !allowedFields.includes(field)
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid fields provided: ${invalidFields.join(', ')}`
      });
    }

    const { name, password } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update name if provided
    if (name) {
      user.name = name.trim();
    }

    // Update password if provided
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters long'
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    //  prevent empty update
    if (!name && !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide at least one field to update: name or password'
      });
    }

    user.updatedBy = req.user._id;
    await user.save();

    const updatedUser = await User.findById(req.user._id).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  getMyProfile,
  updateMyProfile
};