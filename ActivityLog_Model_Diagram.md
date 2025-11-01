# ActivityLog Model Relationship Diagram

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ ActivityLog : performs
    User ||--o{ Account : owns
    Account ||--o{ ActivityLog : target_of
    Platform ||--o{ Account : defines
    Platform ||--o{ ActivityLog : context_for
    NameData ||--o{ ActivityLog : referenced_by
    
    User {
        ObjectId _id PK
        string username
        string email
        string password
        string role
        date createdAt
        date updatedAt
    }
    
    Account {
        ObjectId _id PK
        ObjectId userId FK
        string platform
        string username
        string password
        object additionalData
        date createdAt
        date updatedAt
    }
    
    Platform {
        ObjectId _id PK
        string name
        string displayName
        array fields
        object usernameFormat
        object passwordRequirements
        date createdAt
        date updatedAt
    }
    
    NameData {
        ObjectId _id PK
        string name
        string platform
        string source
        date createdAt
        date updatedAt
    }
    
    ActivityLog {
        ObjectId _id PK
        string activityId UK
        string activityType
        string status
        ObjectId userId FK
        object targetEntity
        object requestContext
        object details
        object error
        object performance
        object location
        object security
        object retention
        date createdAt
        date updatedAt
    }
```

## ActivityLog Field Details

### Core Identification
- **activityId**: Unique identifier for each activity (format: ACT_timestamp_randomString)
- **activityType**: Type of activity (ACCOUNT_CREATE, ACCOUNT_DELETE, etc.)
- **status**: Status of the activity (SUCCESS, FAILURE, PENDING, TIMEOUT)

### User Context
- **userId**: Reference to the User who performed the action

### Target Entity Information
- **targetEntity**: Object containing:
  - **entityType**: Type of entity (Account, User, Platform, etc.)
  - **entityId**: ID of the target entity (if available)
  - **entityName**: Human-readable name of the entity
  - **platform**: Platform name (for account operations)

### Request Context
- **requestContext**: Object containing:
  - **ipAddress**: Client IP address
  - **userAgent**: Browser/client user agent
  - **requestId**: Unique request identifier
  - **sessionId**: Session identifier
  - **endpoint**: API endpoint
  - **method**: HTTP method
  - **timestamp**: Request timestamp

### Activity Details
- **details**: Object containing:
  - **beforeState**: State before the activity
  - **afterState**: State after the activity
  - **changes**: Array of field changes
  - **metadata**: Additional metadata

### Error Information
- **error**: Object containing:
  - **code**: Error code
  - **message**: Error message
  - **stack**: Error stack trace
  - **details**: Additional error details

### Performance Metrics
- **performance**: Object containing:
  - **duration**: Operation duration in milliseconds
  - **memoryUsage**: Memory usage in MB
  - **cpuUsage**: CPU usage percentage

### Geographic Location
- **location**: Object containing:
  - **country**: Country name
  - **region**: Region/state
  - **city**: City name
  - **coordinates**: Latitude and longitude

### Security Context
- **security**: Object containing:
  - **riskScore**: Risk score (0-100)
  - **flagged**: Whether activity is flagged
  - **reasons**: Reasons for flagging

### Retention Policy
- **retention**: Object containing:
  - **expiresAt**: Expiration date
  - **permanent**: Whether record is permanent

## Activity Flow Examples

### Account Creation Flow
```mermaid
sequenceDiagram
    participant Client
    participant API
    participant AccountController
    participant ActivityLog
    participant Database
    
    Client->>API: POST /api/accounts
    API->>AccountController: createAccount()
    AccountController->>ActivityLog: Log activity start
    AccountController->>Database: Check existing account
    Database-->>AccountController: Account not found
    AccountController->>Database: Create new account
    Database-->>AccountController: Account created
    AccountController->>ActivityLog: Log success
    ActivityLog->>Database: Store activity log
    AccountController-->>API: Success response
    API-->>Client: Account created
```

### Account Deletion Flow
```mermaid
sequenceDiagram
    participant Client
    participant API
    participant AccountController
    participant ActivityLog
    participant Database
    
    Client->>API: DELETE /api/accounts/:id
    API->>AccountController: deleteAccount()
    AccountController->>ActivityLog: Log activity start
    AccountController->>Database: Find account
    Database-->>AccountController: Account found
    AccountController->>Database: Delete account
    Database-->>AccountController: Account deleted
    AccountController->>ActivityLog: Log success
    ActivityLog->>Database: Store activity log
    AccountController-->>API: Success response
    API-->>Client: Account deleted
```

## Query Patterns and Indexes

### Common Query Patterns
1. **User Activity Timeline**: Find all activities for a specific user
2. **Account Operations**: Find all activities related to a specific account
3. **Platform Activities**: Find all activities for a specific platform
4. **Security Monitoring**: Find high-risk or flagged activities
5. **Error Tracking**: Find failed operations
6. **Performance Analysis**: Find slow operations

### Index Strategy
```mermaid
graph TD
    A[ActivityLog Collection] --> B[Primary Index]
    A --> C[User Activity Index]
    A --> D[Activity Type Index]
    A --> E[Status Index]
    A --> F[Platform Index]
    A --> G[Security Index]
    A --> H[Performance Index]
    A --> I[Geographic Index]
    A --> J[Retention Index]
    A --> K[Compound Index]
    A --> L[Text Search Index]
    
    B --> B1[activityId: 1 unique]
    C --> C1[userId: 1, timestamp: -1]
    D --> D1[activityType: 1, timestamp: -1]
    E --> E1[status: 1, timestamp: -1]
    F --> F1[targetEntity.platform: 1, activityType: 1, timestamp: -1]
    G --> G1[security.flagged: 1, timestamp: -1]
    G --> G2[security.riskScore: -1, timestamp: -1]
    H --> H1[performance.duration: -1, timestamp: -1]
    I --> I1[location.country: 1, timestamp: -1]
    J --> J1[retention.expiresAt: 1 TTL]
    K --> K1[userId: 1, activityType: 1, status: 1, timestamp: -1]
    L --> L1[error.message: text, details.metadata: text]
```

## Data Retention Strategy

```mermaid
graph LR
    A[New Activity Log] --> B{Is Security Event?}
    B -->|Yes| C[5 Year Retention]
    B -->|No| D{Is Critical Event?}
    D -->|Yes| E[Permanent Record]
    D -->|No| F[Standard 2 Year Retention]
    
    C --> G[Automatic Cleanup After 5 Years]
    F --> H[Automatic Cleanup After 2 Years]
    E --> I[No Automatic Cleanup]
    
    G --> J[Archived to Cold Storage]
    H --> J
    I --> K[Permanent Storage]
```

## Implementation Architecture

```mermaid
graph TB
    A[Client Request] --> B[Authentication Middleware]
    B --> C[Activity Logger Middleware]
    C --> D[Route Handler]
    D --> E[Business Logic]
    E --> F[Database Operations]
    F --> G[Activity Log Service]
    G --> H[ActivityLog Model]
    H --> I[MongoDB]
    
    G --> J[Error Handler]
    J --> K[Update Activity Log with Error]
    K --> H
    
    G --> L[Performance Monitor]
    L --> M[Update Activity Log with Metrics]
    M --> H
    
    G --> N[Security Analyzer]
    N --> O[Update Activity Log with Risk Score]
    O --> H
```

## Integration Points

### Account Controller Integration
```javascript
// Example integration in accountController.js
const ActivityLog = require('../models/ActivityLog');

exports.createAccount = async (req, res) => {
  const activityId = `ACT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Log activity start
    await ActivityLog.create({
      activityId,
      activityType: 'ACCOUNT_CREATE',
      status: 'PENDING',
      userId: req.user.id,
      requestContext: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        method: req.method
      }
    });
    
    // Account creation logic...
    const account = await Account.create(accountData);
    
    // Update activity log with success
    await ActivityLog.updateOne(
      { activityId },
      {
        status: 'SUCCESS',
        'targetEntity': {
          entityType: 'Account',
          entityId: account._id,
          entityName: account.username,
          platform: account.platform
        },
        'details.afterState': {
          platform: account.platform,
          username: account.username,
          // Non-sensitive fields only
        }
      }
    );
    
    res.status(201).json(account);
  } catch (error) {
    // Update activity log with error
    await ActivityLog.updateOne(
      { activityId },
      {
        status: 'FAILURE',
        error: {
          code: error.code,
          message: error.message,
          stack: error.stack
        }
      }
    );
    
    res.status(500).json({ message: error.message });
  }
};
```

This diagram provides a comprehensive visual representation of the ActivityLog model, its relationships with existing models, and how it integrates into the current system architecture.