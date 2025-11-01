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
      'ACCOUNT_BULK_DELETE',
      
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
    entityIds: [{
      type: mongoose.Schema.Types.ObjectId,
      required: false // For bulk operations
    }],
    entityName: String, // Human-readable name for quick reference
    entityNames: [String], // For bulk operations
    platform: String, // Relevant for account operations
    platforms: [String] // For bulk operations
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
activityLogSchema.index({ userId: 1, 'requestContext.timestamp': -1 });
activityLogSchema.index({ activityType: 1, 'requestContext.timestamp': -1 });
activityLogSchema.index({ status: 1, 'requestContext.timestamp': -1 });
activityLogSchema.index({ 'targetEntity.platform': 1, activityType: 1, 'requestContext.timestamp': -1 });
activityLogSchema.index({ 'security.flagged': 1, 'requestContext.timestamp': -1 });
activityLogSchema.index({ 'security.riskScore': -1, 'requestContext.timestamp': -1 });
activityLogSchema.index({ status: 1, 'error.code': 1, 'requestContext.timestamp': -1 });
activityLogSchema.index({ 'performance.duration': -1, 'requestContext.timestamp': -1 });
activityLogSchema.index({ 'location.country': 1, 'requestContext.timestamp': -1 });
activityLogSchema.index({ 'retention.expiresAt': 1 }, { expireAfterSeconds: 0 });
activityLogSchema.index({ 
  userId: 1, 
  activityType: 1, 
  status: 1, 
  'requestContext.timestamp': -1 
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
      .sort({ 'requestContext.timestamp': -1 })
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
      .sort({ 'requestContext.timestamp': -1 })
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
      .sort({ 'security.riskScore': -1, 'requestContext.timestamp': -1 })
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
    
    const matchStage = { 'requestContext.timestamp': { $gte: startDate } };
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