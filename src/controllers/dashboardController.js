
const { FinancialRecord } = require('../models/FinancialRecord');
const { userRoles } = require('../models/User');

// desc: Get dashboard summary (totals)
// access: All authenticated users (Viewer, Analyst, Admin)
const getDashboardSummary = async (req, res) => {
  try {
    const userRole = req.user.role;
    const { startDate, endDate } = req.query;

    // Build filter
    const filter = {};

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Calculate totals from ALL records
    const records = await FinancialRecord.find(filter);

    const totalIncome = records
      .filter(r => r.type === 'income')
      .reduce((sum, r) => sum + r.amount, 0);

    const totalExpense = records
      .filter(r => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount, 0);

    const netBalance = totalIncome - totalExpense;

    res.status(200).json({
      success: true,
      role: userRole,
      data: {
        totalIncome,
        totalExpense,
        netBalance,
        transactionCount: records.length,
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || 'Present'
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

//desc: Get category-wise totals
// access: All authenticated users (Viewer, Analyst, Admin)
const getCategorySummary = async (req, res) => {
  try {
    const userRole = req.user.role;
    const { startDate, endDate } = req.query;

    const filter = {};

    // No createdBy filter - viewers see ALL records
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const records = await FinancialRecord.find(filter);

    // Group by category
    const categoryMap = new Map();

    records.forEach(record => {
      if (!categoryMap.has(record.category)) {
        categoryMap.set(record.category, {
          category: record.category,
          income: 0,
          expense: 0,
          count: 0
        });
      }

      const cat = categoryMap.get(record.category);
      if (record.type === 'income') {
        cat.income += record.amount;
      } else {
        cat.expense += record.amount;
      }
      cat.count++;
    });

    const categorySummary = Array.from(categoryMap.values())
      .map(cat => ({
        ...cat,
        net: cat.income - cat.expense
      }))
      .sort((a, b) => (b.income + b.expense) - (a.income + a.expense));

    res.status(200).json({
      success: true,
      role: userRole,
      data: categorySummary
    });

  } catch (error) {
    console.error('Category summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

//desc: Get monthly trends
// access: All authenticated users (Viewer, Analyst, Admin)
const getMonthlyTrends = async (req, res) => {
  try {
    const userRole = req.user.role;
    const { months = 6 } = req.query;

    const filter = {};

    // Last N months
    const date = new Date();
    date.setMonth(date.getMonth() - parseInt(months));
    filter.date = { $gte: date };

    const records = await FinancialRecord.find(filter);

    // Group by month
    const monthlyData = new Map();

    records.forEach(record => {
      const year = record.date.getFullYear();
      const month = record.date.getMonth();
      const key = `${year}-${month}`;
      const monthName = record.date.toLocaleString('default', { month: 'long' });

      if (!monthlyData.has(key)) {
        monthlyData.set(key, {
          year,
          month,
          monthName,
          income: 0,
          expense: 0,
          count: 0
        });
      }

      const data = monthlyData.get(key);
      if (record.type === 'income') {
        data.income += record.amount;
      } else {
        data.expense += record.amount;
      }
      data.count++;
    });

    const trends = Array.from(monthlyData.values())
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      })
      .map(item => ({
        ...item,
        net: item.income - item.expense
      }));

    res.status(200).json({
      success: true,
      role: userRole,
      data: trends
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

//desc: Get recent activity (last 10 transactions)
// access: All authenticated users (Viewer, Analyst, Admin)
const getRecentActivity = async (req, res) => {
  try {
    const userRole = req.user.role;
    const { limit = 10 } = req.query;

    const filter = {};

    const recentRecords = await FinancialRecord.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      role: userRole,
      data: recentRecords
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  getDashboardSummary,
  getCategorySummary,
  getMonthlyTrends,
  getRecentActivity
};