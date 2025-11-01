const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  validateRegister,
  validateLogin,
  validateUpdateProfile
} = require('../middleware/validation');
const {
  register,
  login,
  getMe,
  updateProfile
} = require('../controllers/authController');

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected routes
router.get('/me', auth, getMe);
router.put('/profile', auth, validateUpdateProfile, updateProfile);

module.exports = router;