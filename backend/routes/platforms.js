const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const {
  validatePlatform,
  validateId
} = require('../middleware/validation');
const {
  getPlatforms,
  getPlatformById,
  addPlatform,
  updatePlatform,
  deletePlatform,
  initializeDefaultPlatforms
} = require('../controllers/platformController');

// GET /api/platforms - Get all platforms (public)
router.get('/', getPlatforms);

// GET /api/platforms/:id - Get platform by ID (public)
router.get('/:id', validateId, getPlatformById);

// POST /api/platforms - Add new platform (admin only)
router.post('/', auth, adminAuth, validatePlatform, addPlatform);

// PUT /api/platforms/:id - Update platform (admin only)
router.put('/:id', auth, adminAuth, validateId, validatePlatform, updatePlatform);

// DELETE /api/platforms/:id - Delete platform (admin only)
router.delete('/:id', auth, adminAuth, validateId, deletePlatform);

// Initialize default platforms (admin only, for setup)
router.post('/initialize', auth, adminAuth, initializeDefaultPlatforms);

module.exports = router;