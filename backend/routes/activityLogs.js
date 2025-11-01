const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const {
  validateActivityLogQuery,
  validateActivityLogId,
  validateAccountId
} = require('../middleware/validation');
const {
  getUserActivityLogs,
  getAccountActivityLogs,
  getActivityStatistics,
  getRecentActivities,
  getActivityLogById,
  getSecurityEvents
} = require('../controllers/activityLogController');

// All routes are protected with authentication
router.use(auth);

// GET /api/activity-logs - Get user activity logs (paginated)
router.get('/', validateActivityLogQuery, getUserActivityLogs);

// GET /api/activity-logs/statistics - Get activity statistics
router.get('/statistics', validateActivityLogQuery, getActivityStatistics);

// GET /api/activity-logs/account/:accountId - Get account-specific activity logs
router.get('/account/:accountId', validateAccountId, validateActivityLogQuery, getAccountActivityLogs);

// GET /api/activity-logs/:id - Get activity log by ID
router.get('/:id', validateActivityLogId, getActivityLogById);

// Admin-only routes
router.use('/admin', adminAuth);

// GET /api/activity-logs/admin/recent - Get recent activities across all users (for admin)
router.get('/admin/recent', validateActivityLogQuery, getRecentActivities);

// GET /api/activity-logs/admin/security - Get security events (for admin)
router.get('/admin/security', validateActivityLogQuery, getSecurityEvents);

module.exports = router;