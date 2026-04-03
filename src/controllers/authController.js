const { User } = require('../models/User');
const { generateToken } = require('../middlewares/authMiddleware');

// Login Logic
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email and password'
      });
    }

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    console.log('User found in database:', user ? 'YES' : 'NO');
  
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      console.log('User is inactive');
      return res.status(401).json({
        success: false,
        error: 'Your account is inactive. Please contact administrator to activate your account.'
      });
    }

    // Compare password
    const isPasswordMatch = await user.comparePassword(password);
    
    if (!isPasswordMatch) {
      console.log('Password mismatch!');
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const token = generateToken(user);
    console.log('Login successful! Token generated');

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token,
        expiresIn: process.env.JWT_EXPIRE || '7d'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
};

//Get current logged in user profile

const getMe = async (req, res) => {
  try {
    
    const user = req.user;

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};


// Logout user 

const logout = async (req, res) => {

  // For JWT, logout is handled client-side by removing the token like localstorage.#localStorage.removeItem('token');
  // #localStorage.removeItem('user');
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please remove your token on client side.'
  });
};

module.exports = {
  login,
  getMe,
  logout
};