const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  validateAccount,
  validateId,
  validatePlatformName
} = require('../middleware/validation');
const {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountsByPlatform,
  getAccountStats
} = require('../controllers/accountController');

// All routes are protected
router.use(auth);

// GET /api/accounts - Get all accounts for logged-in user
router.get('/', getAccounts);

// POST /api/accounts - Create new account
router.post('/', validateAccount, createAccount);

// GET /api/accounts/stats - Get account statistics for dashboard
router.get('/stats', getAccountStats);

// GET /api/accounts/platform/:platform - Get accounts by platform
router.get('/platform/:platform', validatePlatformName, getAccountsByPlatform);

// GET /api/accounts/:id - Get account by ID
router.get('/:id', validateId, getAccountById);

// PUT /api/accounts/:id - Update account
router.put('/:id', validateId, validateAccount, updateAccount);

// DELETE /api/accounts/:id - Delete account
router.delete('/:id', validateId, deleteAccount);

module.exports = router;