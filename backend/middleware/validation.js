const { query, body, param } = require('express-validator');

// User validation
exports.validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

exports.validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

exports.validateUpdateProfile = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
];

// Account validation
exports.validateAccount = [
  body('platform')
    .isIn(['roblox', 'google', 'facebook', 'instagram', 'twitter'])
    .withMessage('Invalid platform'),
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('additionalData')
    .optional()
    .isObject()
    .withMessage('Additional data must be an object'),
  body('additionalData.firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('additionalData.lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('additionalData.gender')
    .optional()
    .trim()
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),
  body('additionalData.birthDate')
    .optional()
    .isObject()
    .withMessage('Birth date must be an object'),
  body('additionalData.birthDate.day')
    .optional()
    .isInt({ min: 1, max: 31 })
    .withMessage('Birth day must be between 1 and 31'),
  body('additionalData.birthDate.month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Birth month must be between 1 and 12'),
  body('additionalData.birthDate.year')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage(`Birth year must be between 1900 and ${new Date().getFullYear()}`),
  body('additionalData.recoveryEmail')
    .optional()
    .isEmail()
    .withMessage('Recovery email must be a valid email')
    .normalizeEmail(),
  body('additionalData.phoneNumber')
    .optional()
    .trim()
    .matches(/^[+]?[\d\s\-\(\)]+$/)
    .withMessage('Phone number must be a valid phone number')
];

// Name validation
exports.validateName = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('platform')
    .optional()
    .isIn(['roblox', 'google', 'facebook', 'instagram', 'twitter', 'general'])
    .withMessage('Invalid platform')
];

// Platform validation
exports.validatePlatform = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Platform name is required')
    .isAlphanumeric()
    .withMessage('Platform name can only contain letters and numbers'),
  body('displayName')
    .trim()
    .notEmpty()
    .withMessage('Display name is required'),
  body('fields')
    .isArray()
    .withMessage('Fields must be an array'),
  body('usernameFormat')
    .optional()
    .isObject()
    .withMessage('Username format must be an object'),
  body('passwordRequirements')
    .optional()
    .isObject()
    .withMessage('Password requirements must be an object')
];

// ID validation
exports.validateId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format')
];

// Platform name validation
exports.validatePlatformName = [
  param('platform')
    .isIn(['roblox', 'google', 'facebook', 'instagram', 'twitter'])
    .withMessage('Invalid platform name')
];

// Activity Log validation
exports.validateActivityLogQuery = [
  // Pagination
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  // Filters
  query('activityType')
    .optional()
    .isIn([
      'ACCOUNT_CREATE',
      'ACCOUNT_DELETE',
      'ACCOUNT_UPDATE',
      'ACCOUNT_VIEW',
      'USER_LOGIN',
      'USER_LOGOUT',
      'USER_REGISTER',
      'USER_UPDATE_PROFILE',
      'SYSTEM_BACKUP',
      'SYSTEM_MAINTENANCE',
      'DATA_EXPORT',
      'DATA_IMPORT'
    ])
    .withMessage('Invalid activity type'),
  query('status')
    .optional()
    .isIn(['SUCCESS', 'FAILURE', 'PENDING', 'TIMEOUT'])
    .withMessage('Invalid status'),
  
  // Date range
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  
  // Time range for statistics
  query('timeRange')
    .optional()
    .matches(/^\d+d$/)
    .withMessage('Time range must be in format "Xd" where X is number of days'),
  
  // Admin filters
  query('userId')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID format'),
  query('flaggedOnly')
    .optional()
    .isBoolean()
    .withMessage('Flagged only must be a boolean'),
  query('minRiskScore')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Minimum risk score must be between 0 and 100')
];

exports.validateActivityLogId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid activity log ID format')
];

exports.validateAccountId = [
  param('accountId')
    .isMongoId()
    .withMessage('Invalid account ID format')
];