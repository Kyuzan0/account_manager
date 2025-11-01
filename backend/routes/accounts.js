const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  validateAccount,
  validateId,
  validatePlatformName,
  validateAutoAccount,
  validateUsernameGeneration,
  validatePasswordGeneration,
  validateGenderPrediction,
  validateAccountQuery,
  validateBulkDelete
} = require('../middleware/validation');
const {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountsByPlatform,
  getAccountStats,
  autoCreateAccount,
  generateUsername,
  generatePassword,
  predictGender,
  bulkDeleteAccounts
} = require('../controllers/accountController');

// All routes are protected
router.use(auth);

// GET /api/accounts - Get all accounts for logged-in user
router.get('/', validateAccountQuery, getAccounts);

// POST /api/accounts - Create new account
router.post('/', validateAccount, createAccount);

// GET /api/accounts/stats - Get account statistics for dashboard
router.get('/stats', getAccountStats);

// POST /api/accounts/auto-create - Auto-create account with all data generated
router.post('/auto-create', (req, res, next) => {
  console.log('DEBUG: Request body received:', JSON.stringify(req.body, null, 2));
  console.log('DEBUG: Content-Type:', req.get('Content-Type'));
  next();
}, validateAutoAccount, autoCreateAccount);

// GET /api/accounts/generate-username - Generate username only
router.get('/generate-username', generateUsername);

// GET /api/accounts/generate-password - Generate password only
router.get('/generate-password', generatePassword);

// GET /api/accounts/predict-gender - Predict gender from name
router.get('/predict-gender', predictGender);

// GET /api/accounts/platform/:platform - Get accounts by platform
router.get('/platform/:platform', validatePlatformName, validateAccountQuery, getAccountsByPlatform);

// DELETE /api/accounts/bulk - Bulk delete accounts (must be before /:id route)
router.delete('/bulk', validateBulkDelete, bulkDeleteAccounts);

// GET /api/accounts/:id - Get account by ID (must be last to avoid conflicts)
router.get('/:id', validateId, getAccountById);

// PUT /api/accounts/:id - Update account
router.put('/:id', validateId, validateAccount, updateAccount);

// DELETE /api/accounts/:id - Delete account
router.delete('/:id', validateId, deleteAccount);

module.exports = router;