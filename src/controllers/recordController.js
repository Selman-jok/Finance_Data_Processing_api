const { FinancialRecord, transactionTypes } = require('../models/FinancialRecord');
const { userRoles } = require('../models/User');

// desc: Create a new financial record
// access: Admin only
const createRecord = async (req, res) => {
  try {
    const { amount, type, category, date, notes, description } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    // ONLY ADMIN can create records
    if (userRole !== userRoles.ADMIN) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only Admins can create records.'
      });
    }

    // Validate required fields
    if (!amount || !type || !category) {
      return res.status(400).json({
        success: false,
        error: 'Amount, type, and category are required'
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0'
      });
    }

    // Validate type
    if (!Object.values(transactionTypes).includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type must be either "income" or "expense"'
      });
    }

    // Create record
    const record = await FinancialRecord.create({
      amount,
      type,
      category,
      date: date || new Date(),
      notes: notes || '',
      description: description || '',
      createdBy: userId
    });

    res.status(201).json({
      success: true,
      message: 'Record created successfully by Admin',
      data: record
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

// desc: Get all records with filters
// access: Analyst (read-only), Admin (full access)
// query   page, limit, type, category, startDate, endDate, search
const getAllRecords = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;

    // ANALYST and ADMIN can view records, VIEWER cannot
    if (userRole === userRoles.VIEWER) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Viewers cannot access records. Only Analysts and Admins.'
      });
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};

    // Apply filters from query params
    if (req.query.type) {
      if (!Object.values(transactionTypes).includes(req.query.type)) {
        return res.status(400).json({
          success: false,
          error: 'Type must be "income" or "expense"'
        });
      }
      filter.type = req.query.type;
    }

    if (req.query.category) {
      filter.category = { $regex: req.query.category, $options: 'i' };
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) {
        filter.date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.date.$lte = new Date(req.query.endDate);
      }
    }

    // Search in notes or description
    if (req.query.search) {
      filter.$or = [
        { notes: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Get records
    const records = await FinancialRecord.find(filter)
      .populate('createdBy', 'name email')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await FinancialRecord.countDocuments(filter);

    res.status(200).json({
      success: true,
      role: userRole,
      count: records.length,
      total,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      data: records
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// desc: Get single record by ID
// access: Analyst and Admin only
const getRecordById = async (req, res) => {
  try {
    const recordId = req.params.id;
    const userRole = req.user.role;

    // Only Analyst and Admin can view records
    if (userRole === userRoles.VIEWER) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Viewers cannot view records.'
      });
    }

    const record = await FinancialRecord.findById(recordId)
      .populate('createdBy', 'name email');

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: record
    });

  } catch (error) {
    console.error('Get record error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// desc: Update a record
// access: Admin only
const updateRecord = async (req, res) => {
  try {
    const recordId = req.params.id;
    const userRole = req.user.role;
    const { amount, type, category, date, notes, description } = req.body;

    // Only admin can update records
    if (userRole !== userRoles.ADMIN) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only Admins can update records.'
      });
    }

    const record = await FinancialRecord.findById(recordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Record not found'
      });
    }

    // Update fields
    if (amount) {
      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be greater than 0'
        });
      }
      record.amount = amount;
    }
    if (type) {
      if (!Object.values(transactionTypes).includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Type must be "income" or "expense"'
        });
      }
      record.type = type;
    }
    if (category) record.category = category;
    if (date) record.date = date;
    if (notes !== undefined) record.notes = notes;
    if (description !== undefined) record.description = description;

    await record.save();

    res.status(200).json({
      success: true,
      message: 'Record updated successfully by Admin',
      data: record
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// desc: Delete a record (soft delete)
// access: Admin only
const deleteRecord = async (req, res) => {
  try {
    const recordId = req.params.id;
    const userRole = req.user.role;
    const userId = req.user._id;

    // Only admin can delete records
    if (userRole !== userRoles.ADMIN) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only Admins can delete records.'
      });
    }

    const record = await FinancialRecord.findById(recordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Record not found'
      });
    }

    // Soft delete
    await record.softDelete(userId);

    res.status(200).json({
      success: true,
      message: 'Record deleted successfully by Admin',
      data: {
        id: record._id,
        deletedAt: record.deletedAt
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// desc: Permanently delete a record (hard delete)
// access: Admin only
const permanentDeleteRecord = async (req, res) => {
  try {
    const recordId = req.params.id;
    const userRole = req.user.role;

    if (userRole !== userRoles.ADMIN) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only Admins can permanently delete records.'
      });
    }

    const record = await FinancialRecord.findById(recordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Record not found'
      });
    }

    await record.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Record permanently deleted by Admin'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  createRecord,
  getAllRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  permanentDeleteRecord
};