
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Role and status constants
const userRoles = {
  VIEWER: 'viewer',
  ANALYST: 'analyst',
  ADMIN: 'admin'
};

const userStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name too short'],
    maxlength: [50, 'Name too long']
  },
  email: {
    type: String,
    required: [true, 'Email required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email']
  },
  password: {
    type: String,
    required: [true, 'Password required'],
    minlength: [6, 'Password too short'],
    select: false
  },
  role: {
    type: String,
    enum: Object.values(userRoles),
    default: userRoles.VIEWER
  },
  status: {
    type: String,
    enum: Object.values(userStatus),
    default: userStatus.ACTIVE
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    if (!candidatePassword || !this.password) {
      console.log('Missing password data');
      return false;
    }
    
    console.log('Comparing passwords...');
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('bcrypt.compare result:', isMatch);
    
    return isMatch;
  } catch (error) {
    console.error('Error in comparePassword:', error);
    return false;
  }
};

const User = mongoose.model('User', userSchema);
module.exports = { User, userRoles, userStatus };