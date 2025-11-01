const ActivityLog = require('../models/ActivityLog');
const { validationResult } = require('express-validator');

// Get user activity logs (paginated)
exports.getUserActivityLogs = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      page = 1, 
      limit = 20, 
      activityType, 
      status, 
      startDate, 
      endDate 
    } = req.query;
    
    // Build query
    const query = { userId: req.user.id };
    
    if (activityType) {
      query.activityType = activityType;
    }
    
    if (status) {
      query.status = status;
    }
    
    // Add date range filter if provided
    if (startDate || endDate) {
      query['requestContext.timestamp'] = {};
      if (startDate) {
        query['requestContext.timestamp'].$gte = new Date(startDate);
      }
      if (endDate) {
        query['requestContext.timestamp'].$lte = new Date(endDate);
      }
    }
    
    // Execute query with pagination
    const logs = await ActivityLog.find(query)
      .sort({ 'requestContext.timestamp': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-details.changes -error.stack'); // Exclude verbose fields for list view
    
    const total = await ActivityLog.countDocuments(query);
    
    res.json({
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      hasNext: page * limit < total,
      hasPrev: page > 1
    });
  } catch (error) {
    console.error('Error fetching user activity logs:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get account-specific activity logs
exports.getAccountActivityLogs = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { accountId } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      activityType, 
      status 
    } = req.query;
    
    // Build query
    const query = {
      userId: req.user.id,
      'targetEntity.entityId': accountId,
      'targetEntity.entityType': 'Account'
    };
    
    if (activityType) {
      query.activityType = activityType;
    }
    
    if (status) {
      query.status = status;
    }
    
    // Execute query with pagination
    const logs = await ActivityLog.find(query)
      .sort({ 'requestContext.timestamp': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await ActivityLog.countDocuments(query);
    
    res.json({
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      hasNext: page * limit < total,
      hasPrev: page > 1
    });
  } catch (error) {
    console.error('Error fetching account activity logs:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get activity statistics
exports.getActivityStatistics = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { timeRange = '30d' } = req.query;
    
    // Calculate date range
    const days = parseInt(timeRange.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get activity type distribution
    const activityTypeStats = await ActivityLog.aggregate([
      {
        $match: {
          userId: req.user.id,
          'requestContext.timestamp': { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$activityType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get status distribution
    const statusStats = await ActivityLog.aggregate([
      {
        $match: {
          userId: req.user.id,
          'requestContext.timestamp': { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get daily activity trends
    const dailyTrends = await ActivityLog.aggregate([
      {
        $match: {
          userId: req.user.id,
          'requestContext.timestamp': { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$requestContext.timestamp'
            }
          },
          count: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0] }
          },
          failureCount: {
            $sum: { $cond: [{ $eq: ['$status', 'FAILURE'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get platform-specific activity
    const platformStats = await ActivityLog.aggregate([
      {
        $match: {
          userId: req.user.id,
          'requestContext.timestamp': { $gte: startDate },
          'targetEntity.platform': { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$targetEntity.platform',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get performance metrics
    const performanceStats = await ActivityLog.aggregate([
      {
        $match: {
          userId: req.user.id,
          'requestContext.timestamp': { $gte: startDate },
          'performance.duration': { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$performance.duration' },
          minDuration: { $min: '$performance.duration' },
          maxDuration: { $max: '$performance.duration' }
        }
      }
    ]);
    
    // Get error summary
    const errorSummary = await ActivityLog.aggregate([
      {
        $match: {
          userId: req.user.id,
          'requestContext.timestamp': { $gte: startDate },
          status: 'FAILURE',
          'error.message': { $exists: true }
        }
      },
      {
        $group: {
          _id: '$error.message',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    const stats = {
      timeRange,
      activityTypeStats,
      statusStats,
      dailyTrends,
      platformStats,
      performanceMetrics: performanceStats[0] || {
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0
      },
      errorSummary,
      totalActivities: activityTypeStats.reduce((sum, stat) => sum + stat.count, 0)
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching activity statistics:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get recent activities across all users (for admin)
exports.getRecentActivities = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      page = 1, 
      limit = 50, 
      activityType, 
      status, 
      userId,
      flaggedOnly = false
    } = req.query;
    
    // Build query
    const query = {};
    
    if (activityType) {
      query.activityType = activityType;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (userId) {
      query.userId = userId;
    }
    
    if (flaggedOnly === 'true') {
      query['security.flagged'] = true;
    }
    
    // Execute query with pagination
    const logs = await ActivityLog.find(query)
      .sort({ 'requestContext.timestamp': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'username email')
      .select('-details.changes -error.stack'); // Exclude verbose fields for list view
    
    const total = await ActivityLog.countDocuments(query);
    
    res.json({
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      hasNext: page * limit < total,
      hasPrev: page > 1
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get activity log by ID
exports.getActivityLogById = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    
    const log = await ActivityLog.findOne({
      _id: id,
      userId: req.user.id
    }).populate('userId', 'username email');
    
    if (!log) {
      return res.status(404).json({ message: 'Activity log not found' });
    }
    
    res.json(log);
  } catch (error) {
    console.error('Error fetching activity log by ID:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get security events (for admin)
exports.getSecurityEvents = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      page = 1, 
      limit = 50, 
      minRiskScore = 70,
      flaggedOnly = true
    } = req.query;
    
    // Build query
    const query = {};
    
    if (flaggedOnly === 'true') {
      query['security.flagged'] = true;
    }
    
    if (minRiskScore) {
      query['security.riskScore'] = { $gte: parseInt(minRiskScore) };
    }
    
    // Execute query with pagination
    const logs = await ActivityLog.find(query)
      .sort({ 'security.riskScore': -1, 'requestContext.timestamp': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'username email');
    
    const total = await ActivityLog.countDocuments(query);
    
    res.json({
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      hasNext: page * limit < total,
      hasPrev: page > 1
    });
  } catch (error) {
    console.error('Error fetching security events:', error);
    res.status(500).json({ message: error.message });
  }
};