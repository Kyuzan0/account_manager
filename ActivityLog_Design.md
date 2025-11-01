# ActivityLog Model Design for Account Management System

## Overview
This document outlines the design for an ActivityLog model that will track account creation and deletion activities in the account management system. The design focuses on capturing essential information while maintaining flexibility for future expansion.

## Current System Analysis

### Existing Models
1. **User Model**: Stores user information with fields like username, email, password, and role
2. **Account Model**: Stores account details with userId, platform, username, password, and additionalData
3. **NameData Model**: Stores name data for different platforms
4. **Platform Model**: Stores platform configurations and field requirements

### Key Operations to Track
- Account creation (successful and failed attempts)
- Account deletion (successful and failed attempts)
- Future: Account updates, login attempts, password changes, etc.

## ActivityLog Schema Design

### Core Schema Structure

```javascript
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
  timestamps: true,
  // Enable automatic expiration based on retention.expiresAt
  expireAfterSeconds: 0 // Will be overridden by index
});
```

### Specialized Account Activity Sub-schema

For account-specific activities, we can extend the details field with a more structured approach:

```javascript
// For ACCOUNT_CREATE activity type
const accountCreateDetails = {
  accountData: {
    platform: String,
    username: String,
    // Non-sensitive fields only
    additionalData: {
      birthDate: {
        day: Number,
        month: Number,
        year: Number
      },
      gender: String,
      firstName: String,
      lastName: String
      // Excluding sensitive data like passwords, recovery emails, phone numbers
    }
  },
  source: {
    type: String,
    enum: ['manual', 'bulk_import', 'api', 'automation']
  },
  batchId: String, // For bulk operations
  validationErrors: [String]
};

// For ACCOUNT_DELETE activity type
const accountDeleteDetails = {
  deletionReason: {
    type: String,
    enum: ['user_request', 'admin_action', 'automation', 'cleanup', 'violation']
  },
  initiatedBy: {
    type: String,
    enum: ['user', 'admin', 'system']
  },
  softDelete: {
    type: Boolean,
    default: false
  },
  scheduledFor: Date // For scheduled deletions
};
```

## Indexes for Optimal Query Performance

```javascript
// Primary index for activity lookup
activityLogSchema.index({ activityId: 1 }, { unique: true });

// User activity timeline (most common query)
activityLogSchema.index({ userId: 1, timestamp: -1 });

// Activity type filtering
activityLogSchema.index({ activityType: 1, timestamp: -1 });

// Status filtering
activityLogSchema.index({ status: 1, timestamp: -1 });

// Platform-specific activities
activityLogSchema.index({ 'targetEntity.platform': 1, activityType: 1, timestamp: -1 });

// Security monitoring
activityLogSchema.index({ 'security.flagged': 1, timestamp: -1 });
activityLogSchema.index({ 'security.riskScore': -1, timestamp: -1 });

// Error tracking
activityLogSchema.index({ status: 1, 'error.code': 1, timestamp: -1 });

// Performance monitoring
activityLogSchema.index({ 'performance.duration': -1, timestamp: -1 });

// Geographic queries
activityLogSchema.index({ 'location.country': 1, timestamp: -1 });

// Retention policy
activityLogSchema.index({ 'retention.expiresAt': 1 }, { expireAfterSeconds: 0 });

// Compound index for complex queries
activityLogSchema.index({ 
  userId: 1, 
  activityType: 1, 
  status: 1, 
  timestamp: -1 
});

// Text search for error messages and details
activityLogSchema.index({ 
  'error.message': 'text', 
  'details.metadata': 'text' 
});
```

## Relationships with Existing Models

### Reference Relationships
1. **User Reference**: Each activity log references the User who performed the action
2. **Entity Reference**: For account operations, references the Account model (when available)
3. **Platform Reference**: Stores platform name for account-related activities

### Integration Points
1. **AccountController**: Add logging to createAccount, updateAccount, and deleteAccount methods
2. **AuthController**: Add logging to login, register, and updateProfile methods
3. **Middleware**: Create logging middleware for automatic request tracking

## Data Retention and Performance Considerations

### Retention Strategy
1. **Default Retention**: 2 years for most activities
2. **Security Events**: 5 years for high-risk activities
3. **Permanent Records**: Critical security events marked as permanent
4. **Automatic Cleanup**: MongoDB TTL index for automatic expiration

### Performance Optimization
1. **Sharding Strategy**: Shard by userId for even distribution
2. **Read Preference**: Use secondary reads for analytics queries
3. **Write Concern**: Use w:1 for normal logs, w:majority for security events
4. **Batch Processing**: Consider batching logs for high-volume operations

### Storage Optimization
1. **Compression**: Enable MongoDB compression for the collection
2. **Field Selection**: Store only essential data in the main document
3. **Separate Collections**: Consider moving detailed data to a separate collection for old logs

## Future Extensibility

### Activity Type Expansion
The schema is designed to easily accommodate new activity types through the enum values and flexible details field.

### Plugin Architecture
```javascript
// Activity handler plugins for different activity types
const activityHandlers = {
  'ACCOUNT_CREATE': require('./handlers/accountCreateHandler'),
  'ACCOUNT_DELETE': require('./handlers/accountDeleteHandler'),
  'USER_LOGIN': require('./handlers/userLoginHandler'),
  // Add new handlers as needed
};
```

### Event-Driven Architecture
The ActivityLog can serve as an event source for:
- Real-time notifications
- Analytics dashboards
- Security monitoring systems
- Audit trail generation

## Implementation Guidelines

### Logging Middleware
```javascript
// Example middleware for automatic request logging
const activityLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Store original res.json to intercept response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    // Log activity based on endpoint and method
    logActivity(req, res, data, duration);
    
    return originalJson.call(this, data);
  };
  
  next();
};
```

### Error Handling
```javascript
// Centralized error logging
const logError = (error, req, activityType) => {
  return ActivityLog.create({
    activityType,
    status: 'FAILURE',
    userId: req.user?.id,
    requestContext: {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      method: req.method
    },
    error: {
      code: error.code,
      message: error.message,
      stack: error.stack
    }
  });
};
```

### Security Considerations
1. **Data Sanitization**: Remove sensitive information before logging
2. **Access Control**: Implement role-based access for viewing logs
3. **Encryption**: Encrypt sensitive fields if required
4. **Audit Trail**: Create immutable records for critical security events

## Query Examples

### User Activity Timeline
```javascript
// Get recent activities for a user
const userActivities = await ActivityLog.find({ userId })
  .sort({ timestamp: -1 })
  .limit(20)
  .populate('userId', 'username email');
```

### Account Creation Statistics
```javascript
// Get account creation statistics by platform
const creationStats = await ActivityLog.aggregate([
  { $match: { activityType: 'ACCOUNT_CREATE', status: 'SUCCESS' } },
  { $group: { _id: '$targetEntity.platform', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]);
```

### Security Monitoring
```javascript
// Get high-risk activities
const riskyActivities = await ActivityLog.find({
  'security.riskScore': { $gte: 70 },
  timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
}).sort({ 'security.riskScore': -1 });
```

## Conclusion

This ActivityLog model design provides a comprehensive foundation for tracking account creation and deletion activities while maintaining flexibility for future expansion. The schema captures essential context, supports efficient querying, and addresses performance and retention concerns.

The modular design allows for incremental implementation, starting with account operations and gradually expanding to cover other system activities.