const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const upload = require('../middleware/fileUpload');
const {
  validateName,
  validateId,
  validatePlatformName
} = require('../middleware/validation');
const {
  getNames,
  addName,
  uploadNames,
  getRandomName,
  deleteName,
  bulkDeleteNames
} = require('../controllers/nameController');

// All routes are protected
router.use(auth);

// GET /api/names - Get all names
router.get('/', getNames);

// POST /api/names - Add new name manually
router.post('/', validateName, addName);

// POST /api/names/upload - Upload names from file
router.post('/upload', (req, res, next) => {
  console.log('DEBUG: Upload route accessed');
  next();
}, upload.single('file'), upload.handleMulterError, uploadNames);

// GET /api/names/random/:platform - Get random name for specific platform
router.get('/random/:platform', validatePlatformName, getRandomName);

// DELETE /api/names/bulk - Bulk delete names
router.delete('/bulk', bulkDeleteNames);

// DELETE /api/names/:id - Delete name
router.delete('/:id', validateId, deleteName);

module.exports = router;