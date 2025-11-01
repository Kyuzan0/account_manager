# ActivityLog Implementation Guide

## Overview
This guide provides the complete implementation details for the ActivityLog model, including the model code, middleware, controllers, and integration points.

## 1. ActivityLog Model Implementation

### File: backend/models/ActivityLog.js

```javascript
const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  // Primary identification
  activityId: {
    type: String,
    required: true,
    unique: true,
    default: () => `ACT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  
  // Activity classification
  activityType: {
    type: String,
    required: true,
    enum: [
      // Account operations
      'ACCOUNT_CREATE',
      'ACCOUNT_DELETE',
      'ACCOUNT_UPDATE',
      'ACCOUNT_VIEW',
      
      // User operations (for future expansion)
      'USER_LOGIN',
      'USER_LOGOUT',
      'USER_REGISTER',
      'USER_UPDATE_PROFILE',
      
      // System operations (for future expansion)
      'SYSTEM_BACKUP',
      'SYSTEM_MAINTENANCE',
      'DATA_EXPORT',
      'DATA_IMPORT'
    ]
  },
  
  // Activity status
  status: {
    type: String,
    required: true,
    enum: ['SUCCESS', 'FAILURE', 'PENDING', 'TIMEOUT']
  },
  
  // User context
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Target entity information
  targetEntity: {
    entityType: {
      type: String,
      required: true,
      enum: ['Account', 'User', 'Platform', 'NameData', 'System']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false // May not always be available (e.g., failed creations)
    },
    entityName: String, // Human-readable name for quick reference
    platform: String // Relevant for account operations
  },
  
  // Request context
  requestContext: {
    ipAddress: String,
    userAgent: String,
    requestId: String, // For tracing through the system
    sessionId: String,
    endpoint: String, // API endpoint that triggered the activity
    method: String, // HTTP method (GET, POST, PUT, DELETE)
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  
  // Activity details
  details: {
    // Before state (for updates and deletions)
    beforeState: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    
    // After state (for creations and updates)
    afterState: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    
    // Changes made (for updates)
    changes: [{
      field: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed
    }],
    
    // Additional metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  
  // Error information (for failed operations)
  error: {
    code: String,
    message: String,
    stack: String,
    details: mongoose.Schema.Types.Mixed
  },
  
  // Performance metrics
  performance: {
    duration: Number, // in milliseconds
    memoryUsage: Number, // in MB
    cpuUsage: Number // in percentage
  },
  
  // Geographic location (if available)
  location: {
    country: String,
    region: String,
    city: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Security context
  security: {
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    flagged: {
      type: Boolean,
      default: false
    },
    reasons: [String] // Reasons for flagging
  },
  
  // Retention policy
  retention: {
    expiresAt: {
      type: Date,
      default: () => {
        // Default retention of 2 years
        const date = new Date();
        date.setFullYear(date.getFullYear() + 2);
        return date;
      }
    },
    permanent: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes for optimal query performance
activityLogSchema.index({ activityId: 1 }, { unique: true });
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ activityType: 1, timestamp: -1 });
activityLogSchema.index({ status: 1, timestamp: -1 });
activityLogSchema.index({ 'targetEntity.platform': 1, activityType: 1, timestamp: -1 });
activityLogSchema.index({ 'security.flagged': 1, timestamp: -1 });
activityLogSchema.index({ 'security.riskScore': -1, timestamp: -1 });
activityLogSchema.index({ status: 1, 'error.code': 1, timestamp: -1 });
activityLogSchema.index({ 'performance.duration': -1, timestamp: -1 });
activityLogSchema.index({ 'location.country': 1, timestamp: -1 });
activityLogSchema.index({ 'retention.expiresAt': 1 }, { expireAfterSeconds: 0 });
activityLogSchema.index({ 
  userId: 1, 
  activityType: 1, 
  status: 1, 
  timestamp: -1 
});
activityLogSchema.index({ 
  'error.message': 'text', 
  'details.metadata': 'text' 
});

// Static methods for common queries
activityLogSchema.statics = {
  // Get user activity timeline
  getUserActivity: function(userId, options = {}) {
    const { limit = 20, page = 1, activityType, status } = options;
    const query = { userId };
    
    if (activityType) query.activityType = activityType;
    if (status) query.status = status;
    
    return this.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('userId', 'username email');
  },
  
  // Get account activities
  getAccountActivities: function(accountId, options = {}) {
    const { limit = 20, page = 1 } = options;
    
    return this.find({
      'targetEntity.entityId': accountId,
      'targetEntity.entityType': 'Account'
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('userId', 'username email');
  },
  
  // Get security events
  getSecurityEvents: function(options = {}) {
    const { limit = 50, minRiskScore = 70, flagged = true } = options;
    const query = {};
    
    if (flagged !== undefined) query['security.flagged'] = flagged;
    if (minRiskScore) query['security.riskScore'] = { $gte: minRiskScore };
    
    return this.find(query)
      .sort({ 'security.riskScore': -1, timestamp: -1 })
      .limit(limit)
      .populate('userId', 'username email');
  },
  
  // Get activity statistics
  getActivityStats: function(options = {}) {
    const { timeRange = '30d', userId, activityType } = options;
    
    // Calculate date range
    const days = parseInt(timeRange.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const matchStage = { timestamp: { $gte: startDate } };
    if (userId) matchStage.userId = mongoose.Types.ObjectId(userId);
    if (activityType) matchStage.activityType = activityType;
    
    return this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            activityType: '$activityType',
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.activityType',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      },
      { $sort: { total: -1 } }
    ]);
  }
};

// Instance methods
activityLogSchema.methods = {
  // Mark as security event
  markAsSecurityEvent: function(reasons = [], riskScore = 80) {
    this.security.flagged = true;
    this.security.riskScore = riskScore;
    this.security.reasons = reasons;
    this.retention.permanent = true;
    return this.save();
  },
  
  // Add performance metrics
  addPerformanceMetrics: function(duration, memoryUsage, cpuUsage) {
    this.performance = {
      duration,
      memoryUsage,
      cpuUsage
    };
    return this.save();
  },
  
  // Update status
  updateStatus: function(status, error = null) {
    this.status = status;
    if (error) {
      this.error = {
        code: error.code,
        message: error.message,
        stack: error.stack,
        details: error.details
      };
    }
    return this.save();
  }
};

module.exports = mongoose.model('ActivityLog', activityLogSchema);
```

## 2. Activity Logger Middleware

### File: backend/middleware/activityLogger.js

```javascript
const ActivityLog = require('../models/ActivityLog');
const { v4: uuidv4 } = require('uuid');

// Activity logger middleware
const activityLogger = (options = {}) => {
  const { 
    logLevel = 'INFO', 
    includeRequestBody = false,
    includeResponseBody = false,
    sensitiveFields = ['password', 'token', 'secret']
  } = options;
  
  return (req, res, next) => {
    // Skip logging for health checks and static assets
    if (req.path === '/health' || req.path.startsWith('/static')) {
      return next();
    }
    
    // Generate unique request ID
    const requestId = uuidv4();
    req.requestId = requestId;
    
    // Store start time for performance tracking
    const startTime = Date.now();
    
    // Sanitize request body to remove sensitive information
    const sanitizeBody = (body) => {
      if (!body || typeof body !== 'object') return body;
      
      const sanitized = { ...body };
      sensitiveFields.forEach(field => {
        if (sanitized[field]) {
          sanitized[field] = '[REDACTED]';
        }
      });
      return sanitized;
    };
    
    // Create initial activity log entry
    const activityData = {
      activityId: `ACT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      activityType: getActivityTypeFromRequest(req),
      status: 'PENDING',
      userId: req.user?.id,
      requestContext: {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        requestId,
        sessionId: req.sessionID,
        endpoint: req.path,
        method: req.method,
        timestamp: new Date()
      },
      details: {
        metadata: {
          query: req.query,
          params: req.params,
          body: includeRequestBody ? sanitizeBody(req.body) : undefined
        }
      }
    };
    
    // Store activity data in request for later access
    req.activityData = activityData;
    
    // Create initial log entry
    ActivityLog.create(activityData)
      .then(log => {
        req.activityLog = log;
      })
      .catch(err => {
        console.error('Failed to create activity log:', err);
      });
    
    // Intercept response to log completion
    const originalJson = res.json;
    const originalSend = res.send;
    
    res.json = function(data) {
      finalizeActivityLog(req, res, data, startTime);
      return originalJson.call(this, data);
    };
    
    res.send = function(data) {
      finalizeActivityLog(req, res, data, startTime);
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Helper function to determine activity type from request
const getActivityTypeFromRequest = (req) => {
  const { method, path, route } = req;
  
  // Extract route pattern if available
  const routePath = route?.path || path;
  
  // Account operations
  if (routePath.includes('/accounts')) {
    if (method === 'POST') return 'ACCOUNT_CREATE';
    if (method === 'PUT' || method === 'PATCH') return 'ACCOUNT_UPDATE';
    if (method === 'DELETE') return 'ACCOUNT_DELETE';
    if (method === 'GET') return 'ACCOUNT_VIEW';
  }
  
  // Auth operations
  if (routePath.includes('/auth')) {
    if (routePath.includes('/login')) return 'USER_LOGIN';
    if (routePath.includes('/register')) return 'USER_REGISTER';
    if (routePath.includes('/profile')) return 'USER_UPDATE_PROFILE';
  }
  
  // Default to generic activity type
  return 'SYSTEM_ACTIVITY';
};

// Helper function to finalize activity log
const finalizeActivityLog = async (req, res, responseData, startTime) => {
  if (!req.activityLog) return;
  
  try {
    const duration = Date.now() - startTime;
    const isSuccess = res.statusCode < 400;
    
    // Prepare update data
    const updateData = {
      status: isSuccess ? 'SUCCESS' : 'FAILURE',
      'performance.duration': duration,
      'details.afterState': includeResponseBody ? responseData : undefined
    };
    
    // Add error information if request failed
    if (!isSuccess && responseData) {
      updateData.error = {
        message: responseData.message || 'Request failed',
        code: responseData.code || 'UNKNOWN_ERROR',
        details: responseData.errors || responseData.details
      };
    }
    
    // Update target entity information if available
    if (responseData && responseData._id) {
      updateData.targetEntity = {
        entityType: getEntityTypeFromPath(req.path),
        entityId: responseData._id,
        entityName: responseData.username || responseData.name || responseData._id.toString(),
        platform: responseData.platform
      };
    }
    
    // Update the activity log
    await ActivityLog.findByIdAndUpdate(req.activityLog._id, updateData);
    
  } catch (error) {
    console.error('Failed to update activity log:', error);
  }
};

// Helper function to get entity type from path
const getEntityTypeFromPath = (path) => {
  if (path.includes('/accounts')) return 'Account';
  if (path.includes('/users')) return 'User';
  if (path.includes('/platforms')) return 'Platform';
  if (path.includes('/names')) return 'NameData';
  return 'System';
};

module.exports = activityLogger;
```

## 3. Activity Log Controller

### File: backend/controllers/activityLogController.js

```javascript
const ActivityLog = require('../models/ActivityLog');

// Get activity logs for the current user
exports.getUserActivities = async (req, res) => {
  try {
    const { page = 1, limit = 20, activityType, status, timeRange } = req.query;
    const userId = req.user.id;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      activityType,
      status
    };
    
    // Add time range filter if specified
    if (timeRange) {
      const days = parseInt(timeRange.replace('d', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      options.startDate = startDate;
    }
    
    const activities = await ActivityLog.getUserActivity(userId, options);
    const total = await ActivityLog.countDocuments({ userId });
    
    res.json({
      activities,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get activities for a specific account
exports.getAccountActivities = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // Verify user has access to this account
    const Account = require('../models/Account');
    const account = await Account.findOne({
      _id: accountId,
      userId: req.user.id
    });
    
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };
    
    const activities = await ActivityLog.getAccountActivities(accountId, options);
    const total = await ActivityLog.countDocuments({
      'targetEntity.entityId': accountId,
      'targetEntity.entityType': 'Account'
    });
    
    res.json({
      activities,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get activity statistics
exports.getActivityStats = async (req, res) => {
  try {
    const { timeRange = '30d', activityType } = req.query;
    const userId = req.user.id;
    
    const options = {
      timeRange,
      userId,
      activityType
    };
    
    const stats = await ActivityLog.getActivityStats(options);
    
    res.json({
      stats,
      timeRange,
      generatedAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get security events (admin only)
exports.getSecurityEvents = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { limit = 50, minRiskScore = 70, flagged = true } = req.query;
    
    const options = {
      limit: parseInt(limit),
      minRiskScore: parseInt(minRiskScore),
      flagged: flagged === 'true'
    };
    
    const events = await ActivityLog.getSecurityEvents(options);
    
    res.json({
      events,
      count: events.length,
      filters: options
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export activity logs (admin only)
exports.exportActivityLogs = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { format = 'json', startDate, endDate, activityType, status } = req.query;
    
    // Build query
    const query = {};
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    if (activityType) query.activityType = activityType;
    if (status) query.status = status;
    
    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(10000) // Limit to prevent large exports
      .populate('userId', 'username email');
    
    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(logs);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=activity_logs.csv');
      res.send(csv);
    } else {
      // Default to JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=activity_logs.json');
      res.json(logs);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to convert logs to CSV
const convertToCSV = (logs) => {
  const headers = [
    'Activity ID', 'Activity Type', 'Status', 'User ID', 'Username',
    'Entity Type', 'Entity Name', 'Platform', 'IP Address', 'Endpoint',
    'Method', 'Timestamp', 'Duration (ms)', 'Risk Score', 'Flagged'
  ];
  
  const rows = logs.map(log => [
    log.activityId,
    log.activityType,
    log.status,
    log.userId?._id || log.userId,
    log.userId?.username || '',
    log.targetEntity?.entityType || '',
    log.targetEntity?.entityName || '',
    log.targetEntity?.platform || '',
    log.requestContext?.ipAddress || '',
    log.requestContext?.endpoint || '',
    log.requestContext?.method || '',
    log.timestamp,
    log.performance?.duration || '',
    log.security?.riskScore || '',
    log.security?.flagged || ''
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
};
```

## 4. Activity Log Routes

### File: backend/routes/activityLogs.js

```javascript
const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');
const auth = require('../middleware/auth');

// Apply authentication to all routes
router.use(auth);

// User activity routes
router.get('/user', activityLogController.getUserActivities);
router.get('/account/:accountId', activityLogController.getAccountActivities);
router.get('/stats', activityLogController.getActivityStats);

// Admin routes
router.get('/security', activityLogController.getSecurityEvents);
router.get('/export', activityLogController.exportActivityLogs);

module.exports = router;
```

## 5. Integration with Existing Controllers

### Update to backend/controllers/accountController.js

```javascript
// Add these lines at the top of the file
const ActivityLog = require('../models/ActivityLog');

// Update the createAccount function
exports.createAccount = async (req, res) => {
  const activityId = `ACT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  let activityLog;
  
  try {
    // Create initial activity log
    activityLog = await ActivityLog.create({
      activityId,
      activityType: 'ACCOUNT_CREATE',
      status: 'PENDING',
      userId: req.user.id,
      requestContext: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        method: req.method
      },
      targetEntity: {
        entityType: 'Account',
        platform: req.body.platform
      }
    });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Update activity log with validation errors
      await ActivityLog.findByIdAndUpdate(activityLog._id, {
        status: 'FAILURE',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array()
        }
      });
      
      return res.status(400).json({ errors: errors.array() });
    }

    const { platform, username, password, additionalData } = req.body;

    // Check if account with same username and platform already exists for this user
    const existingAccount = await Account.findOne({
      userId: req.user.id,
      platform,
      username
    });

    if (existingAccount) {
      // Update activity log with duplicate error
      await ActivityLog.findByIdAndUpdate(activityLog._id, {
        status: 'FAILURE',
        error: {
          code: 'DUPLICATE_ACCOUNT',
          message: 'Account with this username already exists'
        }
      });
      
      return res.status(400).json({ message: 'Account with this username already exists' });
    }

    // Prepare account data with additionalData
    const accountData = {
      userId: req.user.id,
      platform,
      username,
      password
    };

    // Only add additionalData if it exists and is not empty
    if (additionalData && Object.keys(additionalData).length > 0) {
      accountData.additionalData = additionalData;
    }

    const account = await Account.create(accountData);

    // Update activity log with success
    await ActivityLog.findByIdAndUpdate(activityLog._id, {
      status: 'SUCCESS',
      'targetEntity.entityId': account._id,
      'targetEntity.entityName': account.username,
      'details.afterState': {
        platform: account.platform,
        username: account.username,
        // Include non-sensitive additionalData fields
        ...(account.additionalData && {
          additionalData: {
            birthDate: account.additionalData.birthDate,
            gender: account.additionalData.gender,
            firstName: account.additionalData.firstName,
            lastName: account.additionalData.lastName
          }
        })
      }
    });

    res.status(201).json(account);
  } catch (error) {
    console.error('Error creating account:', error);
    
    // Update activity log with error
    if (activityLog) {
      await ActivityLog.findByIdAndUpdate(activityLog._id, {
        status: 'FAILURE',
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message,
          stack: error.stack
        }
      });
    }
    
    res.status(500).json({ message: error.message });
  }
};

// Update the deleteAccount function
exports.deleteAccount = async (req, res) => {
  const activityId = `ACT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  let activityLog;
  let accountToDelete;
  
  try {
    // Find the account first to capture its details
    accountToDelete = await Account.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!accountToDelete) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Create initial activity log
    activityLog = await ActivityLog.create({
      activityId,
      activityType: 'ACCOUNT_DELETE',
      status: 'PENDING',
      userId: req.user.id,
      requestContext: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        method: req.method
      },
      targetEntity: {
        entityType: 'Account',
        entityId: accountToDelete._id,
        entityName: accountToDelete.username,
        platform: accountToDelete.platform
      },
      'details.beforeState': {
        platform: accountToDelete.platform,
        username: accountToDelete.username,
        // Include non-sensitive additionalData fields
        ...(accountToDelete.additionalData && {
          additionalData: {
            birthDate: accountToDelete.additionalData.birthDate,
            gender: accountToDelete.additionalData.gender,
            firstName: accountToDelete.additionalData.firstName,
            lastName: accountToDelete.additionalData.lastName
          }
        })
      }
    });

    // Delete the account
    const deletedAccount = await Account.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    // Update activity log with success
    await ActivityLog.findByIdAndUpdate(activityLog._id, {
      status: 'SUCCESS',
      'details.metadata.deletionReason': 'user_request',
      'details.metadata.initiatedBy': 'user'
    });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    
    // Update activity log with error
    if (activityLog) {
      await ActivityLog.findByIdAndUpdate(activityLog._id, {
        status: 'FAILURE',
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message,
          stack: error.stack
        }
      });
    }
    
    res.status(500).json({ message: error.message });
  }
};
```

## 6. Update Main Server File

### Update to backend/server.js

```javascript
// Add these lines after other middleware imports
const activityLogger = require('./middleware/activityLogger');
const activityLogRoutes = require('./routes/activityLogs');

// Add activity logger middleware after auth middleware
app.use(activityLogger({
  logLevel: 'INFO',
  includeRequestBody: true,
  includeResponseBody: false,
  sensitiveFields: ['password', 'token', 'secret']
}));

// Add activity log routes
app.use('/api/activity-logs', activityLogRoutes);
```

## 7. Database Migration Script

### File: backend/scripts/createActivityLogIndexes.js

```javascript
const mongoose = require('mongoose');
const ActivityLog = require('../models/ActivityLog');
const connectDB = require('../config/database');

const createIndexes = async () => {
  try {
    await connectDB();
    
    console.log('Creating ActivityLog indexes...');
    
    // The indexes are already defined in the model schema
    // This script ensures they are created in the database
    await ActivityLog.createIndexes();
    
    console.log('ActivityLog indexes created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating ActivityLog indexes:', error);
    process.exit(1);
  }
};

createIndexes();
```

## 8. Testing the Implementation

### File: backend/tests/activityLog.test.js

```javascript
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Account = require('../models/Account');
const ActivityLog = require('../models/ActivityLog');

describe('Activity Logging', () => {
  let authToken;
  let userId;
  
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI);
    
    // Create test user
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
    
    authToken = userResponse.body.token;
    userId = userResponse.body.user.id;
  });
  
  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Account.deleteMany({});
    await ActivityLog.deleteMany({});
    await mongoose.connection.close();
  });
  
  describe('Account Creation Logging', () => {
    it('should log successful account creation', async () => {
      const accountData = {
        platform: 'roblox',
        username: 'testroblox',
        password: 'testpass123',
        additionalData: {
          firstName: 'Test',
          lastName: 'User',
          gender: 'male'
        }
      };
      
      const response = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(accountData)
        .expect(201);
      
      // Verify activity log was created
      const activityLog = await ActivityLog.findOne({
        activityType: 'ACCOUNT_CREATE',
        status: 'SUCCESS',
        userId
      });
      
      expect(activityLog).toBeTruthy();
      expect(activityLog.targetEntity.entityType).toBe('Account');
      expect(activityLog.targetEntity.platform).toBe('roblox');
      expect(activityLog.details.afterState.username).toBe('testroblox');
    });
    
    it('should log failed account creation', async () => {
      const invalidAccountData = {
        platform: 'roblox',
        username: '', // Invalid username
        password: 'testpass123'
      };
      
      const response = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidAccountData)
        .expect(400);
      
      // Verify activity log was created with failure status
      const activityLog = await ActivityLog.findOne({
        activityType: 'ACCOUNT_CREATE',
        status: 'FAILURE',
        userId
      });
      
      expect(activityLog).toBeTruthy();
      expect(activityLog.error).toBeTruthy();
    });
  });
  
  describe('Account Deletion Logging', () => {
    let accountId;
    
    beforeEach(async () => {
      // Create a test account
      const account = await Account.create({
        userId,
        platform: 'google',
        username: 'testgoogle',
        password: 'testpass123'
      });
      accountId = account._id;
    });
    
    it('should log successful account deletion', async () => {
      const response = await request(app)
        .delete(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Verify activity log was created
      const activityLog = await ActivityLog.findOne({
        activityType: 'ACCOUNT_DELETE',
        status: 'SUCCESS',
        userId
      });
      
      expect(activityLog).toBeTruthy();
      expect(activityLog.targetEntity.entityId).toEqual(accountId);
      expect(activityLog.details.beforeState.username).toBe('testgoogle');
    });
  });
  
  describe('Activity Log Retrieval', () => {
    it('should retrieve user activities', async () => {
      const response = await request(app)
        .get('/api/activity-logs/user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.activities).toBeInstanceOf(Array);
      expect(response.body.totalPages).toBeDefined();
      expect(response.body.currentPage).toBeDefined();
    });
    
    it('should retrieve activity statistics', async () => {
      const response = await request(app)
        .get('/api/activity-logs/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.stats).toBeInstanceOf(Array);
      expect(response.body.timeRange).toBeDefined();
      expect(response.body.generatedAt).toBeDefined();
    });
  });
});
```

## 9. Performance Monitoring

### File: backend/utils/performanceMonitor.js

```javascript
const ActivityLog = require('../models/ActivityLog');

// Performance monitoring utility
const performanceMonitor = {
  // Log slow operations
  logSlowOperation: async (activityId, duration, threshold = 1000) => {
    if (duration > threshold) {
      try {
        await ActivityLog.updateOne(
          { activityId },
          {
            'performance.duration': duration,
            'security.flagged': true,
            'security.riskScore': Math.min(50, Math.floor(duration / 100)),
            'security.reasons': ['SLOW_OPERATION']
          }
        );
      } catch (error) {
        console.error('Failed to log slow operation:', error);
      }
    }
  },
  
  // Monitor memory usage
  logMemoryUsage: async (activityId) => {
    const memoryUsage = process.memoryUsage();
    const memoryMB = memoryUsage.heapUsed / 1024 / 1024;
    
    try {
      await ActivityLog.updateOne(
        { activityId },
        {
          'performance.memoryUsage': memoryMB
        }
      );
    } catch (error) {
      console.error('Failed to log memory usage:', error);
    }
  },
  
  // Analyze performance patterns
  analyzePerformance: async (timeRange = '24h') => {
    const hours = parseInt(timeRange.replace('h', ''));
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);
    
    return await ActivityLog.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: '$activityType',
          avgDuration: { $avg: '$performance.duration' },
          maxDuration: { $max: '$performance.duration' },
          minDuration: { $min: '$performance.duration' },
          count: { $sum: 1 }
        }
      },
      { $sort: { avgDuration: -1 } }
    ]);
  }
};

module.exports = performanceMonitor;
```

## 10. Security Monitoring

### File: backend/utils/securityMonitor.js

```javascript
const ActivityLog = require('../models/ActivityLog');

// Security monitoring utility
const securityMonitor = {
  // Detect suspicious patterns
  detectSuspiciousActivity: async (userId, timeWindow = 300000) => { // 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - timeWindow);
    
    const recentActivities = await ActivityLog.find({
      userId,
      timestamp: { $gte: fiveMinutesAgo }
    });
    
    const suspiciousPatterns = [];
    
    // Check for rapid account creation
    const accountCreations = recentActivities.filter(
      activity => activity.activityType === 'ACCOUNT_CREATE'
    );
    
    if (accountCreations.length > 5) {
      suspiciousPatterns.push({
        type: 'RAPID_ACCOUNT_CREATION',
        count: accountCreations.length,
        riskScore: 70
      });
    }
    
    // Check for multiple failed attempts
    const failedAttempts = recentActivities.filter(
      activity => activity.status === 'FAILURE'
    );
    
    if (failedAttempts.length > 10) {
      suspiciousPatterns.push({
        type: 'MULTIPLE_FAILURES',
        count: failedAttempts.length,
        riskScore: 60
      });
    }
    
    // Check for unusual IP addresses
    const ipAddresses = [...new Set(recentActivities.map(
      activity => activity.requestContext?.ipAddress
    ))];
    
    if (ipAddresses.length > 3) {
      suspiciousPatterns.push({
        type: 'MULTIPLE_IP_ADDRESSES',
        count: ipAddresses.length,
        riskScore: 50
      });
    }
    
    return suspiciousPatterns;
  },
  
  // Flag suspicious activities
  flagSuspiciousActivities: async (userId, patterns) => {
    const fiveMinutesAgo = new Date(Date.now() - 300000);
    
    for (const pattern of patterns) {
      await ActivityLog.updateMany(
        {
          userId,
          timestamp: { $gte: fiveMinutesAgo },
          'security.riskScore': { $lt: pattern.riskScore }
        },
        {
          'security.flagged': true,
          'security.riskScore': pattern.riskScore,
          'security.reasons': [pattern.type]
        }
      );
    }
  },
  
  // Generate security report
  generateSecurityReport: async (timeRange = '24h') => {
    const hours = parseInt(timeRange.replace('h', ''));
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);
    
    return await ActivityLog.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalActivities: { $sum: 1 },
          flaggedActivities: {
            $sum: { $cond: ['$security.flagged', 1, 0] }
          },
          failedActivities: {
            $sum: { $cond: [{ $eq: ['$status', 'FAILURE'] }, 1, 0] }
          },
          avgRiskScore: { $avg: '$security.riskScore' },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          totalActivities: 1,
          flaggedActivities: 1,
          failedActivities: 1,
          avgRiskScore: 1,
          uniqueUserCount: { $size: '$uniqueUsers' }
        }
      }
    ]);
  }
};

module.exports = securityMonitor;
```

## Implementation Checklist

1. [ ] Create the ActivityLog model in `backend/models/ActivityLog.js`
2. [ ] Implement the activity logger middleware in `backend/middleware/activityLogger.js`
3. [ ] Create the activity log controller in `backend/controllers/activityLogController.js`
4. [ ] Set up the activity log routes in `backend/routes/activityLogs.js`
5. [ ] Update existing controllers (accountController.js) to include activity logging
6. [ ] Update the main server file to include the new middleware and routes
7. [ ] Run the database migration script to create indexes
8. [ ] Implement performance monitoring utilities
9. [ ] Implement security monitoring utilities
10. [ ] Write tests for the activity logging functionality
11. [ ] Document the API endpoints for activity logs
12. [ ] Set up monitoring dashboards for activity metrics

## Best Practices

1. **Data Privacy**: Never log sensitive information like passwords or tokens
2. **Performance**: Use asynchronous logging to avoid impacting request response times
3. **Retention**: Implement appropriate data retention policies based on regulatory requirements
4. **Security**: Implement proper access controls for viewing activity logs
5. **Monitoring**: Set up alerts for suspicious activities based on the logged data
6. **Testing**: Thoroughly test the logging functionality to ensure it doesn't break existing features
7. **Documentation**: Keep the activity log schema and API endpoints well documented

This implementation provides a comprehensive activity logging system that captures account creation and deletion activities while maintaining flexibility for future expansion.