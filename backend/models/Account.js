const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['roblox', 'google', 'facebook', 'instagram', 'twitter']
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  additionalData: {
    birthDate: {
      day: Number,
      month: Number,
      year: Number
    },
    gender: String,
    firstName: String,
    lastName: String,
    recoveryEmail: String,
    phoneNumber: String,
    // Dynamic fields based on platform
  }
}, {
  timestamps: true
});

// Compound index for unique username per platform per user
accountSchema.index({ userId: 1, platform: 1, username: 1 }, { unique: true });

module.exports = mongoose.model('Account', accountSchema);