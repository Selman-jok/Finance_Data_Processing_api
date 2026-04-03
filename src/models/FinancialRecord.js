const mongoose = require('mongoose');

// Transaction types
const transactionTypes = {
  INCOME: 'income',
  EXPENSE: 'expense'
};

// Predefined categories
const categories = {
  // Income categories
  SALARY: 'Salary',
  FREELANCE: 'Freelance',
  INVESTMENT: 'Investment',
  GIFT: 'Gift',
  REFUND: 'Refund',
  OTHER_INCOME: 'Other Income',
  
  // Expense categories
  FOOD: 'Food',
  TRANSPORTATION: 'Transportation',
  HOUSING: 'Housing',
  UTILITIES: 'Utilities',
  ENTERTAINMENT: 'Entertainment',
  HEALTHCARE: 'Healthcare',
  EDUCATION: 'Education',
  SHOPPING: 'Shopping',
  BILLS: 'Bills',
  RENT: 'Rent',
  OTHER_EXPENSE: 'Other Expense'
};

const financialRecordSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  
  type: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: Object.values(transactionTypes)
  },
  
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    default: ''
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters'],
    default: ''
  },
  
  // Who created this record
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Soft delete support
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  deletedAt: {
    type: Date,
    default: null
  },
  
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
financialRecordSchema.index({ createdBy: 1, date: -1 });
financialRecordSchema.index({ createdBy: 1, type: 1 });
financialRecordSchema.index({ createdBy: 1, category: 1 });
financialRecordSchema.index({ date: -1 });
financialRecordSchema.index({ isDeleted: 1 });

// Exclude soft-deleted records by default
financialRecordSchema.pre(/^find/, function() {
  if (this.getOptions().includeDeleted !== true) {
    this.where({ isDeleted: false });
  }
});

// Soft delete method
financialRecordSchema.methods.softDelete = async function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return await this.save();
};

// Restore method
financialRecordSchema.methods.restore = async function() {
  this.isDeleted = false;
  this.deletedAt = null;
  this.deletedBy = null;
  return await this.save();
};

const FinancialRecord = mongoose.model('FinancialRecord', financialRecordSchema);

module.exports = {
  FinancialRecord,
  transactionTypes,
  categories
};